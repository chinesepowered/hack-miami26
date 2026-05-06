import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { RPC_URL, USDC_MINT_DEVNET } from "./constants";

export const connection = new Connection(RPC_URL, "confirmed");

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

function memoIx(memo: string, signer: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, "utf8"),
  });
}

function attachReference(ix: TransactionInstruction, reference: PublicKey) {
  // Solana Pay convention: append the reference key as a non-signer, read-only
  // account so it appears in the transaction's account list and can be watched
  // by `connection.onLogs(reference, ...)` on the receive side.
  ix.keys.push({ pubkey: reference, isSigner: false, isWritable: false });
}

export type SolToken = { kind: "SOL" };
export type SplToken = { kind: "SPL"; mint: PublicKey; symbol: string };
export type TokenSpec = SolToken | SplToken;

export const SOL: SolToken = { kind: "SOL" };
export const USDC: SplToken = {
  kind: "SPL",
  mint: new PublicKey(USDC_MINT_DEVNET),
  symbol: "USDC",
};

export async function getSolBalance(owner: PublicKey): Promise<number> {
  const lamports = await connection.getBalance(owner, "confirmed");
  return lamports / LAMPORTS_PER_SOL;
}

export async function getSplBalance(
  owner: PublicKey,
  mint: PublicKey,
): Promise<number> {
  try {
    const ata = await getAssociatedTokenAddress(mint, owner);
    const acc = await getAccount(connection, ata);
    const m = await getMint(connection, mint);
    return Number(acc.amount) / 10 ** m.decimals;
  } catch {
    return 0;
  }
}

export async function buildTransferTx(args: {
  from: PublicKey;
  to: PublicKey;
  amount: number;
  token: TokenSpec;
  memo?: string;
  reference?: PublicKey;
}): Promise<Transaction> {
  const { from, to, amount, token, memo, reference } = args;
  const tx = new Transaction();

  let payerIx: TransactionInstruction;
  if (token.kind === "SOL") {
    payerIx = SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: Math.round(amount * LAMPORTS_PER_SOL),
    });
    if (reference) attachReference(payerIx, reference);
    tx.add(payerIx);
  } else {
    const mintInfo = await getMint(connection, token.mint);
    const fromAta = await getAssociatedTokenAddress(token.mint, from);
    const toAta = await getAssociatedTokenAddress(token.mint, to);

    const toAtaInfo = await connection.getAccountInfo(toAta);
    if (!toAtaInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(from, toAta, to, token.mint),
      );
    }
    payerIx = createTransferInstruction(
      fromAta,
      toAta,
      from,
      BigInt(Math.round(amount * 10 ** mintInfo.decimals)),
    );
    if (reference) attachReference(payerIx, reference);
    tx.add(payerIx);
  }

  if (memo) tx.add(memoIx(memo, from));

  const { blockhash } = await connection.getLatestBlockhash("finalized");
  tx.recentBlockhash = blockhash;
  tx.feePayer = from;
  return tx;
}

export async function airdropIfNeeded(
  owner: PublicKey,
  minSol = 0.1,
): Promise<void> {
  const bal = await getSolBalance(owner);
  if (bal >= minSol) return;
  try {
    const sig = await connection.requestAirdrop(owner, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
  } catch {
    // Devnet airdrop is rate-limited; ignore.
  }
}

export function explorerUrl(sig: string, cluster = "devnet") {
  return `https://explorer.solana.com/tx/${sig}?cluster=${cluster}`;
}
