import * as LocalAuth from "expo-local-authentication";

export async function requireBiometric(promptMessage: string): Promise<{
  ok: boolean;
  reason?: string;
  skipped?: boolean;
}> {
  try {
    const hasHardware = await LocalAuth.hasHardwareAsync();
    if (!hasHardware) return { ok: true, skipped: true };
    const enrolled = await LocalAuth.isEnrolledAsync();
    if (!enrolled) return { ok: true, skipped: true };
    const res = await LocalAuth.authenticateAsync({
      promptMessage,
      fallbackLabel: "Use device PIN",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    if (res.success) return { ok: true };
    return { ok: false, reason: (res as any).error ?? "cancelled" };
  } catch (e: any) {
    // Library missing or misconfigured → don't block the demo.
    return { ok: true, skipped: true, reason: e?.message };
  }
}
