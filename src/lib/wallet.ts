import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import * as SecureStore from "expo-secure-store";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { CAN_USE_MWA, APP_IDENTITY, CLUSTER } from "./constants";
import { connection } from "./solana";

const LOCAL_KEY_NAME = "tappay.local-keypair.v1";

// MWA chain identifiers follow the CAIP-2 format: "solana:<cluster>".
// Without the "solana:" prefix the wallet falls back to mainnet, which is
// the cluster mismatch users hit when paying.
const MWA_CHAIN = `solana:${CLUSTER}` as
  | "solana:devnet"
  | "solana:testnet"
  | "solana:mainnet";

export type WalletKind = "mwa" | "local";

export interface Wallet {
  kind: WalletKind;
  publicKey: PublicKey;
  signAndSend: (tx: Transaction) => Promise<string>;
  label?: string;
}

async function loadOrCreateLocalKeypair(): Promise<Keypair> {
  const existing = await SecureStore.getItemAsync(LOCAL_KEY_NAME);
  if (existing) {
    const secret = Uint8Array.from(JSON.parse(existing));
    return Keypair.fromSecretKey(secret);
  }
  const kp = Keypair.generate();
  await SecureStore.setItemAsync(
    LOCAL_KEY_NAME,
    JSON.stringify(Array.from(kp.secretKey)),
  );
  return kp;
}

async function makeLocalWallet(): Promise<Wallet> {
  const kp = await loadOrCreateLocalKeypair();
  return {
    kind: "local",
    publicKey: kp.publicKey,
    label: "Local devnet wallet",
    async signAndSend(tx: Transaction) {
      tx.partialSign(kp);
      const raw = tx.serialize();
      const sig = await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        maxRetries: 3,
      });
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
  };
}

async function makeMwaWallet(): Promise<Wallet> {
  // The protocol layer translates `chain: "solana:devnet"` to whatever the
  // wallet's protocol version expects (legacy: cluster="devnet"; modern: chain
  // unchanged). We deliberately do NOT pass a cluster field — the protocol
  // overwrites it from chain on legacy, and modern ignores it.
  const auth = await transact(async (mobileWallet) => {
    return mobileWallet.authorize({
      chain: MWA_CHAIN,
      identity: APP_IDENTITY,
    } as any);
  });

  const rawAddress = auth.accounts[0].address as unknown as string;
  let pk: PublicKey;
  try {
    pk = new PublicKey(rawAddress);
  } catch {
    pk = new PublicKey(Buffer.from(rawAddress, "base64"));
  }
  const authToken = auth.auth_token;

  return {
    kind: "mwa",
    publicKey: pk,
    label: auth.accounts[0].label,
    async signAndSend(tx: Transaction) {
      const sigs = (await transact(async (mobileWallet) => {
        await mobileWallet.reauthorize({
          auth_token: authToken,
          identity: APP_IDENTITY,
          chain: MWA_CHAIN,
        } as any);
        return mobileWallet.signAndSendTransactions({ transactions: [tx] });
      })) as unknown as string[];
      const sig = Array.isArray(sigs) ? sigs[0] : (sigs as any)?.signatures?.[0];
      if (!sig) throw new Error("Wallet returned no signature");
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
  };
}

export async function connectWallet(): Promise<Wallet> {
  if (CAN_USE_MWA) {
    try {
      return await makeMwaWallet();
    } catch (e) {
      console.warn("MWA failed, falling back to local wallet", e);
    }
  }
  return makeLocalWallet();
}

export async function getOrCreateLocalWallet(): Promise<Wallet> {
  return makeLocalWallet();
}
