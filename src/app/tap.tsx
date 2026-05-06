import { useEffect, useRef, useState } from "react";
import { Text, View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { Button } from "@/components/Button";
import { useAppStore } from "@/lib/store";
import { readTagUid, cancelTagRead, formatUid } from "@/lib/nfc";
import { IS_PHYSICAL_DEVICE, USDC_MINT } from "@/lib/constants";

type Phase = "scanning" | "no-pairing" | "found";

export default function Tap() {
  const router = useRouter();
  const pairedTags = useAppStore((s) => s.pairedTags);
  const [phase, setPhase] = useState<Phase>("scanning");
  const [uid, setUid] = useState<string | null>(null);
  const cancelled = useRef(false);

  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);

  useEffect(() => {
    ring1.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    ring2.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(ring1);
      cancelAnimation(ring2);
    };
  }, []);

  useEffect(() => {
    cancelled.current = false;
    if (!IS_PHYSICAL_DEVICE) {
      const t = setTimeout(() => {
        if (cancelled.current) return;
        handleUid("emulator-mock-uid-0001");
      }, 1500);
      return () => {
        cancelled.current = true;
        clearTimeout(t);
      };
    }
    (async () => {
      const detected = await readTagUid();
      if (cancelled.current) return;
      if (!detected) {
        router.back();
        return;
      }
      handleUid(detected);
    })();
    return () => {
      cancelled.current = true;
      cancelTagRead();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUid = (detected: string) => {
    setUid(detected);
    // Any tap is treated as a successful tap. We route to the most-recently-paired
    // device regardless of UID — this keeps the demo bulletproof against
    // session-randomized UIDs (some conference wristbands, secure transit cards).
    // Pair one recipient in Settings and every tap of any tag works.
    const match = pairedTags[0];
    if (!match) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setPhase("no-pairing");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase("found");
    setTimeout(() => {
      const splToken = match.token === "USDC" ? USDC_MINT : undefined;
      router.replace({
        pathname: "/send",
        params: {
          recipient: match.recipient,
          amount: match.amount ? String(match.amount) : undefined,
          splToken,
          memo: match.memo ?? match.label,
          autoConfirm: match.amount && match.amount > 0 ? "1" : undefined,
        },
      });
    }, 700);
  };

  const ring1Style = useAnimatedStyle(() => ({
    opacity: 1 - ring1.value,
    transform: [{ scale: 1 + ring1.value * 1.6 }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: 1 - ring2.value,
    transform: [{ scale: 1 + ring2.value * 2.3 }],
  }));

  const matchedLabel =
    phase === "found" ? pairedTags[0]?.label ?? "Paired device" : null;

  return (
    <View className="flex-1 bg-ink-950 items-center justify-center px-6">
      <View className="items-center justify-center" style={{ height: 280 }}>
        {phase === "scanning" ? (
          <>
            <Animated.View
              className="absolute w-32 h-32 rounded-full bg-brand-400/20"
              style={ring2Style}
            />
            <Animated.View
              className="absolute w-32 h-32 rounded-full bg-brand-400/30"
              style={ring1Style}
            />
            <View className="w-32 h-32 rounded-full bg-brand-400 items-center justify-center">
              <Ionicons name="radio" size={56} color="#070912" />
            </View>
          </>
        ) : phase === "found" ? (
          <View className="w-32 h-32 rounded-full bg-brand-400 items-center justify-center">
            <Ionicons name="checkmark" size={64} color="#070912" />
          </View>
        ) : (
          <View className="w-32 h-32 rounded-full bg-accent-amber items-center justify-center">
            <Ionicons name="alert" size={64} color="#070912" />
          </View>
        )}
      </View>

      <View className="items-center mt-8">
        {phase === "scanning" ? (
          <>
            <Text className="text-white text-2xl font-bold">
              Hold near tag
            </Text>
            <Text className="text-ink-500 mt-2 text-center">
              Tap any NFC token — wristband, sticker, ring, card.
            </Text>
          </>
        ) : phase === "found" ? (
          <>
            <Text className="text-white text-2xl font-bold">
              {matchedLabel}
            </Text>
            <Text className="text-ink-500 mt-2">Authorising payment…</Text>
            {uid ? (
              <Text className="text-ink-500 mt-1 text-xs">
                Tag UID {formatUid(uid)}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <Text className="text-white text-2xl font-bold">
              No recipient paired
            </Text>
            <Text className="text-ink-500 mt-2 text-center">
              Pair a recipient in Settings first, then any NFC tap will route
              to them.
            </Text>
            {uid ? (
              <Text className="text-ink-500 mt-2 text-center text-xs">
                Detected tag UID {formatUid(uid)}
              </Text>
            ) : null}
          </>
        )}
      </View>

      {phase === "scanning" || phase === "no-pairing" ? (
        <View className="absolute bottom-12 left-6 right-6 gap-3">
          {phase === "no-pairing" ? (
            <Button onPress={() => router.replace("/settings")}>
              Open Settings
            </Button>
          ) : null}
          <Button
            variant="ghost"
            onPress={() => {
              cancelled.current = true;
              cancelTagRead();
              router.back();
            }}
          >
            {phase === "no-pairing" ? "Done" : "Cancel"}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
