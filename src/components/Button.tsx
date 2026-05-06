import { Pressable, Text, View, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, { bg: string; text: string; border?: string }> =
  {
    primary: { bg: "bg-brand-500", text: "text-ink-950" },
    secondary: { bg: "bg-ink-700", text: "text-white" },
    ghost: { bg: "bg-transparent", text: "text-white", border: "border border-ink-600" },
    danger: { bg: "bg-accent-pink", text: "text-ink-950" },
  };

export function Button(props: {
  onPress?: () => void;
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const { variant = "primary", size = "md" } = props;
  const v = VARIANTS[variant];
  const padding = size === "lg" ? "px-6 py-5" : "px-5 py-3.5";
  const radius = size === "lg" ? "rounded-2xl" : "rounded-xl";

  return (
    <Pressable
      onPress={() => {
        if (props.disabled || props.loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        props.onPress?.();
      }}
      className={`${v.bg} ${v.border ?? ""} ${padding} ${radius} active:opacity-80 ${props.disabled ? "opacity-40" : ""}`}
    >
      <View className="flex-row items-center justify-center gap-2">
        {props.loading ? (
          <ActivityIndicator color={variant === "primary" ? "#070912" : "#fff"} />
        ) : null}
        <Text
          className={`${v.text} ${size === "lg" ? "text-lg" : "text-base"} font-semibold tracking-tight`}
        >
          {props.children as any}
        </Text>
      </View>
    </Pressable>
  );
}
