import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { Button } from "./Button";
import { shortAddress, formatAmount } from "@/lib/format";
import { requireBiometric } from "@/lib/biometric";

type Props = {
  visible: boolean;
  amount: number;
  token: "SOL" | "USDC";
  recipient: string;
  recipientLabel?: string;
  isNewRecipient?: boolean;
  cancelWindowMs?: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSheet({
  visible,
  amount,
  token,
  recipient,
  recipientLabel,
  isNewRecipient,
  cancelWindowMs = 3000,
  onConfirm,
  onCancel,
}: Props) {
  const [phase, setPhase] = useState<
    "review" | "authorizing" | "broadcasting"
  >("review");
  const [remaining, setRemaining] = useState(cancelWindowMs);

  useEffect(() => {
    if (!visible) {
      setPhase("review");
      setRemaining(cancelWindowMs);
    }
  }, [visible, cancelWindowMs]);

  useEffect(() => {
    if (phase !== "broadcasting") return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, cancelWindowMs - (Date.now() - t0));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onConfirm();
      }
    }, 50);
    return () => clearInterval(id);
  }, [phase, cancelWindowMs, onConfirm]);

  const startReview = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase("authorizing");
    const result = await requireBiometric(
      `Pay ${formatAmount(amount, token === "SOL" ? 4 : 2)} ${token}`,
    );
    if (!result.ok) {
      setPhase("review");
      return;
    }
    setPhase("broadcasting");
  };

  const cancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const progress = 1 - remaining / cancelWindowMs;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={cancel}
    >
      <Pressable className="flex-1 bg-black/60" onPress={cancel}>
        <View className="flex-1 justify-end">
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-ink-900 rounded-t-3xl p-6 pb-10 border-t border-ink-700"
          >
            <View className="items-center mb-2">
              <View className="w-12 h-1.5 rounded-full bg-ink-600" />
            </View>

            <Text className="text-ink-500 text-center text-sm mt-3">
              {phase === "review"
                ? "Review payment"
                : phase === "authorizing"
                  ? "Authenticating…"
                  : "Sending in…"}
            </Text>

            <View className="items-center mt-2 mb-6">
              <Text className="text-white text-5xl font-bold tracking-tight">
                {formatAmount(amount, token === "SOL" ? 4 : 2)}
              </Text>
              <Text className="text-ink-500 text-lg mt-1">{token}</Text>
            </View>

            <View className="bg-ink-800 rounded-2xl p-4 mb-4">
              <Text className="text-ink-500 text-xs uppercase tracking-wider">
                To
              </Text>
              <Text className="text-white text-lg mt-1">
                {recipientLabel ?? shortAddress(recipient, 6, 6)}
              </Text>
              {recipientLabel ? (
                <Text className="text-ink-500 text-xs mt-0.5">
                  {shortAddress(recipient, 6, 6)}
                </Text>
              ) : null}
              {isNewRecipient ? (
                <View className="mt-3 bg-accent-amber/15 rounded-lg p-2.5 border border-accent-amber/30">
                  <Text className="text-accent-amber text-xs">
                    First time paying this address. Double-check before
                    confirming.
                  </Text>
                </View>
              ) : null}
            </View>

            {phase === "broadcasting" ? (
              <>
                <View className="h-1.5 rounded-full bg-ink-700 overflow-hidden mb-4">
                  <View
                    className="h-full bg-brand-500"
                    style={{ width: `${progress * 100}%` }}
                  />
                </View>
                <Button variant="danger" size="lg" onPress={cancel}>
                  Cancel ({Math.ceil(remaining / 1000)}s)
                </Button>
              </>
            ) : (
              <View className="gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  loading={phase === "authorizing"}
                  onPress={startReview}
                >
                  Confirm with biometric
                </Button>
                <Button variant="ghost" onPress={cancel}>
                  Cancel
                </Button>
              </View>
            )}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
