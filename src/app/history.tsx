import { ScrollView, Text, View, Pressable } from "react-native";
import * as Linking from "expo-linking";
import { useAppStore } from "@/lib/store";
import { shortAddress, formatAmount, formatRelativeTime } from "@/lib/format";
import { explorerUrl } from "@/lib/solana";

export default function History() {
  const history = useAppStore((s) => s.history);

  return (
    <ScrollView className="bg-ink-950" contentContainerStyle={{ padding: 20 }}>
      {history.length === 0 ? (
        <View className="bg-ink-900 border border-ink-700 rounded-2xl p-8 items-center">
          <Text className="text-ink-500 text-sm text-center">
            No payments yet.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {history.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => {
                if (!t.signature) return;
                Linking.openURL(explorerUrl(t.signature));
              }}
              className="bg-ink-900 border border-ink-700 rounded-2xl p-4"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-white text-sm font-medium">
                    {t.direction === "out" ? "Sent" : "Received"}
                  </Text>
                  <Text className="text-ink-500 text-xs mt-0.5">
                    {t.counterpartyLabel
                      ? `${t.counterpartyLabel} · ${shortAddress(t.counterparty)}`
                      : shortAddress(t.counterparty, 6, 6)}
                  </Text>
                  {t.memo ? (
                    <Text className="text-ink-500 text-xs mt-1 italic">
                      “{t.memo}”
                    </Text>
                  ) : null}
                </View>
                <View className="items-end">
                  <Text
                    className={`text-base font-semibold ${
                      t.direction === "out" ? "text-white" : "text-brand-400"
                    }`}
                  >
                    {t.direction === "out" ? "−" : "+"}
                    {formatAmount(t.amount, t.token === "SOL" ? 4 : 2)} {t.token}
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      t.status === "confirmed"
                        ? "text-brand-400"
                        : t.status === "failed"
                          ? "text-accent-pink"
                          : t.status === "cancelled"
                            ? "text-ink-500"
                            : "text-accent-amber"
                    }`}
                  >
                    {t.status} · {formatRelativeTime(t.ts)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
