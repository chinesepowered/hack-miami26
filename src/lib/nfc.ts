import { CAN_USE_MWA, IS_ANDROID, IS_PHYSICAL_DEVICE } from "./constants";

export type NfcStatus = "unsupported" | "off" | "ready";

let cached: typeof import("react-native-nfc-manager") | null = null;
async function load() {
  if (!IS_ANDROID || !IS_PHYSICAL_DEVICE) return null;
  if (cached) return cached;
  try {
    cached = await import("react-native-nfc-manager");
    await cached.default.start();
    return cached;
  } catch (e) {
    console.warn("NFC unavailable", e);
    return null;
  }
}

export async function getNfcStatus(): Promise<NfcStatus> {
  const m = await load();
  if (!m) return "unsupported";
  try {
    const enabled = await m.default.isEnabled();
    return enabled ? "ready" : "off";
  } catch {
    return "unsupported";
  }
}

/**
 * Read an NDEF text record from a tag tapped to the phone.
 * Returns the decoded payload, or null if cancelled/unsupported.
 */
export async function readNdefOnce(): Promise<string | null> {
  const m = await load();
  if (!m) return null;
  const { default: Nfc, NfcTech, Ndef } = m;
  try {
    await Nfc.requestTechnology(NfcTech.Ndef);
    const tag = await Nfc.getTag();
    const record = tag?.ndefMessage?.[0];
    if (!record) return null;
    return Ndef.text.decodePayload(new Uint8Array(record.payload));
  } catch {
    return null;
  } finally {
    try {
      await m.default.cancelTechnologyRequest();
    } catch {}
  }
}

/**
 * Stub for HCE (host card emulation). True bidirectional HCE on Android
 * requires a small native service; in v1 the merchant displays a QR code
 * and the customer scans with the camera (Solana Pay flow). We expose the
 * same interface here so the rest of the app can stay agnostic.
 */
export async function broadcastNdefStub(_payload: string): Promise<void> {
  // No-op for v1. See README for the v1.5 HCE path.
}

export const nfcCapabilityHint = CAN_USE_MWA
  ? "Tap-to-pay over NFC available on Seeker / Android devices."
  : "Running in demo mode — use the QR fallback to pair phones.";
