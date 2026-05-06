import { useEffect, useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore, useWalletStore } from "@/lib/store";
import { getSolBalance, getSplBalance, USDC } from "@/lib/solana";
import { IS_EMULATOR } from "@/lib/constants";
import { shortAddress, formatAmount, formatRelativeTime } from "@/lib/format";
import { Button } from "@/components/Button";

export default function Home() {
  const router = useRouter();
  const wallet = useWalletStore((s) => s.wallet);
  const history = useAppStore((s) => s.history);
  const defaultToken = useAppStore((s) => s.defaultToken);

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!wallet) return;
    setRefreshing(true);
    const [sol, usdc] = await Promise.all([
      getSolBalance(wallet.publicKey),
      getSplBalance(wallet.publicKey, USDC.mint),
    ]);
    setSolBalance(sol);
    setUsdcBalance(usdc);
    setRefreshing(false);
  }, [wallet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recent = history.slice(0, 4);
  const primary = defaultToken === "SOL" ? solBalance : usdcBalance;

  return (
    <SafeAreaView className="flex-1 bg-ink-950" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl tintColor="#fff" refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-brand-400 text-base font-semibold tracking-tight">
              TapPay
            </Text>
            <Text className="text-ink-500 text-xs mt-0.5">
              {wallet ? shortAddress(wallet.publicKey.toBase58(), 5, 5) : "…"}
              {wallet?.kind === "local" ? " · local devnet" : " · MWA"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            className="w-10 h-10 rounded-full bg-ink-800 items-center justify-center"
          >
            <Ionicons name="settings-outline" size={18} color="#fff" />
          </Pressable>
        </View>

        {IS_EMULATOR ? (
          <View className="bg-accent-violet/10 border border-accent-violet/30 rounded-xl p-3 mt-4">
            <Text className="text-accent-violet text-xs font-semibold mb-1">
              DEMO MODE
            </Text>
            <Text className="text-ink-500 text-xs leading-4">
              Running on emulator. Using a local devnet keypair instead of
              Mobile Wallet Adapter. Drop a real Seeker / Android device for
              the full Seed Vault flow.
            </Text>
          </View>
        ) : wallet?.kind === "local" ? (
          <Pressable
            onPress={() => router.push("/settings")}
            className="bg-accent-amber/10 border border-accent-amber/30 rounded-xl p-3 mt-4 flex-row items-center justify-between"
          >
            <View className="flex-1 pr-3">
              <Text className="text-accent-amber text-xs font-semibold mb-1">
                Connect a wallet for the full flow
              </Text>
              <Text className="text-ink-500 text-xs leading-4">
                Tap here to link Phantom / Backpack / Seed Vault via Mobile
                Wallet Adapter.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FFC857" />
          </Pressable>
        ) : null}

        <View className="bg-ink-900 border border-ink-700 rounded-3xl p-6 mt-5">
          <Text className="text-ink-500 text-xs uppercase tracking-wider">
            Balance
          </Text>
          <View className="flex-row items-baseline gap-2 mt-2">
            <Text className="text-white text-5xl font-bold tracking-tight">
              {primary === null
                ? "—"
                : formatAmount(primary, defaultToken === "SOL" ? 4 : 2)}
            </Text>
            <Text className="text-ink-500 text-xl">{defaultToken}</Text>
          </View>
          <View className="flex-row gap-3 mt-1">
            {defaultToken !== "SOL" ? (
              <Text className="text-ink-500 text-xs">
                {solBalance === null ? "" : `${formatAmount(solBalance, 4)} SOL`}
              </Text>
            ) : (
              <Text className="text-ink-500 text-xs">
                {usdcBalance === null ? "" : `${formatAmount(usdcBalance, 2)} USDC`}
              </Text>
            )}
          </View>
        </View>

        <View className="flex-row gap-3 mt-5">
          <View className="flex-1">
            <Button size="lg" onPress={() => router.push("/scan")}>
              <Ionicons name="scan-outline" size={20} color="#070912" />
              {"  "}Pay
            </Button>
          </View>
          <View className="flex-1">
            <Button
              size="lg"
              variant="secondary"
              onPress={() => router.push("/receive")}
            >
              <Ionicons name="qr-code-outline" size={20} color="#fff" />
              {"  "}Receive
            </Button>
          </View>
        </View>

        <View className="flex-row gap-3 mt-3">
          <View className="flex-1">
            <Button variant="ghost" onPress={() => router.push("/send")}>
              Manual send
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="ghost" onPress={() => router.push("/history")}>
              Activity
            </Button>
          </View>
        </View>

        <View className="mt-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-base font-semibold">Recent</Text>
            <Pressable onPress={() => router.push("/history")}>
              <Text className="text-brand-400 text-xs">View all</Text>
            </Pressable>
          </View>
          {recent.length === 0 ? (
            <View className="bg-ink-900 border border-ink-700 rounded-2xl p-6 items-center">
              <Text className="text-ink-500 text-sm">
                No payments yet — try Receive on one phone, Pay on another.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {recent.map((t) => (
                <View
                  key={t.id}
                  className="bg-ink-900 border border-ink-700 rounded-2xl p-4 flex-row justify-between items-center"
                >
                  <View>
                    <Text className="text-white text-sm font-medium">
                      {t.direction === "out" ? "Sent" : "Received"} ·{" "}
                      {t.counterpartyLabel ?? shortAddress(t.counterparty)}
                    </Text>
                    <Text className="text-ink-500 text-xs mt-0.5">
                      {formatRelativeTime(t.ts)}
                      {t.memo ? ` · ${t.memo}` : ""}
                    </Text>
                  </View>
                  <Text
                    className={`text-base font-semibold ${
                      t.direction === "out" ? "text-white" : "text-brand-400"
                    }`}
                  >
                    {t.direction === "out" ? "−" : "+"}
                    {formatAmount(t.amount, t.token === "SOL" ? 4 : 2)} {t.token}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
