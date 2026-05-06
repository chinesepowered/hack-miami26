import { PublicKey } from "@solana/web3.js";
import { USDC_MINT } from "./constants";

export type ParsedPayment = {
  recipient: string;
  amount?: number;
  splToken?: string;
  reference?: string;
  label?: string;
  message?: string;
  memo?: string;
};

const PROTO = "solana:";

export function buildPaymentURL(args: {
  recipient: string;
  amount?: number;
  splToken?: string;
  label?: string;
  message?: string;
  memo?: string;
  reference?: string;
}): string {
  const { recipient, amount, splToken, label, message, memo, reference } = args;
  const params = new URLSearchParams();
  if (amount !== undefined) params.set("amount", String(amount));
  if (splToken) params.set("spl-token", splToken);
  if (label) params.set("label", label);
  if (message) params.set("message", message);
  if (memo) params.set("memo", memo);
  if (reference) params.set("reference", reference);
  const qs = params.toString();
  return `${PROTO}${recipient}${qs ? `?${qs}` : ""}`;
}

export function parsePaymentURL(raw: string): ParsedPayment {
  let s = raw.trim();
  if (!s.startsWith(PROTO)) {
    throw new Error("Not a Solana Pay URL");
  }
  s = s.slice(PROTO.length);
  const [recipient, query = ""] = s.split("?");
  // Validate the address now so we fail loudly on bad input.
  // eslint-disable-next-line no-new
  new PublicKey(recipient);

  const params = new URLSearchParams(query);
  const amountStr = params.get("amount");
  return {
    recipient,
    amount: amountStr ? Number(amountStr) : undefined,
    splToken: params.get("spl-token") ?? undefined,
    reference: params.get("reference") ?? undefined,
    label: params.get("label") ?? undefined,
    message: params.get("message") ?? undefined,
    memo: params.get("memo") ?? undefined,
  };
}

export function isUsdcMint(mint?: string) {
  return !!mint && mint === USDC_MINT;
}
