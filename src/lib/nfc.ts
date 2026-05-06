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
 * Wait for any NFC tag to come into the field and return its UID as a
 * lowercase hex string. Works with NTAG, MIFARE Classic/Ultralight, ISO-DEP
 * and Ndef-formatted tags — covers virtually any consumer NFC token
 * (wristbands, stickers, transit cards, hotel keycards). Returns null if the
 * scan is cancelled, the device has no NFC, or the tag exposes no UID.
 */
export async function readTagUid(): Promise<string | null> {
  const m = await load();
  if (!m) return null;
  const { default: Nfc, NfcTech } = m;
  try {
    await Nfc.requestTechnology([
      NfcTech.NfcA,
      NfcTech.IsoDep,
      NfcTech.MifareClassic,
      NfcTech.MifareUltralight,
      NfcTech.Ndef,
    ]);
    const tag = await Nfc.getTag();
    const id = tag?.id;
    return typeof id === "string" && id.length > 0 ? id.toLowerCase() : null;
  } catch {
    return null;
  } finally {
    try {
      await Nfc.cancelTechnologyRequest();
    } catch {}
  }
}

/** Cancel any in-flight readTagUid() / readNdefOnce(). */
export async function cancelTagRead(): Promise<void> {
  if (!cached) return;
  try {
    await cached.default.cancelTechnologyRequest();
  } catch {}
}

/** "04:a3:b2:c9" style display formatting for a hex UID. */
export function formatUid(uid: string): string {
  return uid
    .toUpperCase()
    .match(/.{1,2}/g)
    ?.join(":") ?? uid;
}

export async function broadcastNdefStub(_payload: string): Promise<void> {
  // No-op for v1. HCE phone-to-phone is the v1.5 milestone.
}

export const nfcCapabilityHint = CAN_USE_MWA
  ? "Tap-to-pay over NFC available on Seeker / Android devices."
  : "Running in demo mode — use the QR fallback to pair phones.";
