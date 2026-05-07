import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import * as SecureStore from "expo-secure-store";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { CAN_USE_MWA, APP_IDENTITY, CLUSTER } from "./constants";
import { connection } from "./solana";

const LOCAL_KEY_NAME = "tappay.local-keypair.v1";
const MWA_SESSION_KEY = "tappay.mwa-session.v1";

// MWA chain identifiers follow the CAIP-2 format: "solana:<cluster>".
// Without the "solana:" prefix the wallet falls back to mainnet.
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

type MwaSession = {
  authToken: string;
  publicKeyBase58: string;
  label?: string;
  cluster: string;
};

async function saveMwaSession(s: MwaSession) {
  await SecureStore.setItemAsync(MWA_SESSION_KEY, JSON.stringify(s));
}

async function loadMwaSession(): Promise<MwaSession | null> {
  const raw = await SecureStore.getItemAsync(MWA_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MwaSession;
  } catch {
    return null;
  }
}

export async function clearMwaSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(MWA_SESSION_KEY);
  } catch {}
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

async function mwaSignAndSend(
  authToken: string,
  tx: Transaction,
): Promise<string> {
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
}

function buildMwaWallet(session: MwaSession): Wallet {
  return {
    kind: "mwa",
    publicKey: new PublicKey(session.publicKeyBase58),
    label: session.label,
    signAndSend: (tx) => mwaSignAndSend(session.authToken, tx),
  };
}

async function makeMwaWallet(): Promise<Wallet> {
  // The protocol layer translates `chain: "solana:devnet"` to whatever the
  // wallet's protocol version expects (legacy: cluster="devnet"; modern: chain
  // unchanged). We deliberately do NOT pass a cluster field.
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

  const session: MwaSession = {
    authToken: auth.auth_token,
    publicKeyBase58: pk.toBase58(),
    label: auth.accounts[0].label,
    cluster: CLUSTER,
  };
  // Best-effort persist; sign flow still works in-memory if this fails.
  saveMwaSession(session).catch(() => {});

  return buildMwaWallet(session);
}

/**
 * Restore an MWA wallet from persisted session metadata without prompting the
 * user. Returns null if there's no cached session, the cluster has changed
 * since the session was saved, or the cached data is corrupt. The actual
 * `reauthorize()` happens lazily inside `signAndSend()` — same code path as a
 * fresh connect — so a stale token only fails at sign time, not at restore.
 */
export async function tryRestoreMwaWallet(): Promise<Wallet | null> {
  if (!CAN_USE_MWA) return null;
  try {
    const session = await loadMwaSession();
    if (!session) return null;
    if (session.cluster !== CLUSTER) {
      // Cluster flipped since the session was saved — old token is no longer valid.
      await clearMwaSession();
      return null;
    }
    return buildMwaWallet(session);
  } catch (e) {
    console.warn("MWA session restore failed", e);
    return null;
  }
}

/**
 * Boot-time wallet selection: prefer a cached MWA session when present, fall
 * back to the local devnet keypair. This lets a paid demo survive an app
 * relaunch without forcing the user to re-tap Connect.
 */
export async function bootWallet(): Promise<Wallet> {
  const restored = await tryRestoreMwaWallet();
  if (restored) return restored;
  return makeLocalWallet();
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
