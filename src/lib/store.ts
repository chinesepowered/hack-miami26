import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Wallet } from "./wallet";

export type TxStatus = "pending" | "confirmed" | "failed" | "cancelled";

export type TxRecord = {
  id: string;
  ts: number;
  direction: "out" | "in";
  counterparty: string;
  counterpartyLabel?: string;
  amount: number;
  token: "SOL" | "USDC";
  memo?: string;
  signature?: string;
  status: TxStatus;
};

export type Contact = {
  id: string;
  label: string;
  address: string;
  emoji?: string;
};

export type PairedTag = {
  uid: string;
  label: string;
  recipient: string;
  amount?: number;
  token?: "SOL" | "USDC";
  memo?: string;
  pairedAt: number;
};

type AppState = {
  history: TxRecord[];
  contacts: Contact[];
  pairedTags: PairedTag[];
  perTapCap: number;
  dailyCap: number;
  microThreshold: number;
  defaultToken: "SOL" | "USDC";
  addTx: (tx: TxRecord) => void;
  updateTx: (id: string, patch: Partial<TxRecord>) => void;
  addContact: (c: Contact) => void;
  removeContact: (id: string) => void;
  pairTag: (t: PairedTag) => void;
  unpairTag: (uid: string) => void;
  setCaps: (p: Partial<Pick<AppState, "perTapCap" | "dailyCap" | "microThreshold">>) => void;
  setDefaultToken: (t: "SOL" | "USDC") => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      history: [],
      contacts: [],
      pairedTags: [],
      perTapCap: 50,
      dailyCap: 200,
      microThreshold: 5,
      defaultToken: "SOL",
      addTx: (tx) =>
        set((s) => ({ history: [tx, ...s.history].slice(0, 200) })),
      updateTx: (id, patch) =>
        set((s) => ({
          history: s.history.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      addContact: (c) => set((s) => ({ contacts: [c, ...s.contacts] })),
      removeContact: (id) =>
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      pairTag: (t) =>
        set((s) => ({
          pairedTags: [
            t,
            ...s.pairedTags.filter((p) => p.uid !== t.uid),
          ],
        })),
      unpairTag: (uid) =>
        set((s) => ({ pairedTags: s.pairedTags.filter((p) => p.uid !== uid) })),
      setCaps: (p) => set(() => ({ ...p })),
      setDefaultToken: (t) => set({ defaultToken: t }),
    }),
    {
      name: "tappay.app-state.v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        history: s.history,
        contacts: s.contacts,
        pairedTags: s.pairedTags,
        perTapCap: s.perTapCap,
        dailyCap: s.dailyCap,
        microThreshold: s.microThreshold,
        defaultToken: s.defaultToken,
      }),
    },
  ),
);

type WalletState = {
  wallet: Wallet | null;
  setWallet: (w: Wallet | null) => void;
};
export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  setWallet: (w) => set({ wallet: w }),
}));
