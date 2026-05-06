import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export function Keypad({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const press = (k: string) => {
    Haptics.selectionAsync();
    if (k === "⌫") {
      onChange(value.length <= 1 ? "0" : value.slice(0, -1));
      return;
    }
    if (k === ".") {
      if (value.includes(".")) return;
      onChange(value + ".");
      return;
    }
    if (value === "0") {
      onChange(k);
      return;
    }
    if (value.includes(".") && value.split(".")[1].length >= 6) return;
    if (!value.includes(".") && value.length >= 7) return;
    onChange(value + k);
  };

  return (
    <View className="flex-row flex-wrap">
      {KEYS.map((k) => (
        <Pressable
          key={k}
          onPress={() => press(k)}
          className="w-1/3 items-center justify-center py-5 active:opacity-60"
        >
          <Text className="text-white text-3xl font-medium">{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}
