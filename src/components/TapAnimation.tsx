import { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
} from "react-native-reanimated";

type State = "idle" | "tapping" | "confirmed" | "failed";

export function TapAnimation({ state = "idle" }: { state?: State }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (state === "tapping") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(2.4, { duration: 1400, easing: Easing.out(Easing.quad) }),
        ),
        -1,
        false,
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 0 }),
          withTiming(0, { duration: 1400 }),
        ),
        -1,
        false,
      );
    } else if (state === "confirmed") {
      scale.value = withTiming(1, { duration: 200 });
      ringOpacity.value = withTiming(0, { duration: 200 });
      checkScale.value = withSequence(
        withTiming(1.2, { duration: 240, easing: Easing.out(Easing.back(1.6)) }),
        withTiming(1, { duration: 160 }),
      );
    } else if (state === "idle") {
      scale.value = withTiming(1);
      ringOpacity.value = withTiming(0);
      checkScale.value = withTiming(0);
    } else if (state === "failed") {
      scale.value = withSequence(
        withTiming(1.05, { duration: 100 }),
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 }),
      );
    }
  }, [state]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const color =
    state === "confirmed"
      ? "#19F58A"
      : state === "failed"
        ? "#FF6BB1"
        : "#7CFFB2";

  return (
    <View className="items-center justify-center" style={{ height: 280 }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: color,
          },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 180,
            height: 180,
            borderRadius: 999,
            backgroundColor: color + "26",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: color,
          },
          coreStyle,
        ]}
      >
        {state === "confirmed" ? (
          <Animated.View style={checkStyle}>
            <Text style={{ fontSize: 86, color }}>✓</Text>
          </Animated.View>
        ) : state === "failed" ? (
          <Text style={{ fontSize: 80, color }}>!</Text>
        ) : (
          <Text style={{ fontSize: 64 }}>📱</Text>
        )}
      </Animated.View>
    </View>
  );
}
