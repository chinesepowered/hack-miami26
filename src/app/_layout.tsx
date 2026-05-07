import "@/lib/polyfills";
import "../../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useWalletStore } from "@/lib/store";
import { bootWallet } from "@/lib/wallet";
import { airdropIfNeeded } from "@/lib/solana";

export default function RootLayout() {
  const setWallet = useWalletStore((s) => s.setWallet);

  useEffect(() => {
    (async () => {
      // Prefer a cached MWA session if one exists, fall back to the local
      // devnet keypair. Means judges open the app and it's already connected.
      const w = await bootWallet();
      // Only airdrop the local wallet — MWA wallets are user-funded.
      if (w.kind === "local") {
        airdropIfNeeded(w.publicKey).catch(() => {});
      }
      setWallet(w);
    })();
  }, [setWallet]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#070912" }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#070912" },
            headerTintColor: "#fff",
            contentStyle: { backgroundColor: "#070912" },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="send" options={{ title: "Send" }} />
          <Stack.Screen name="scan" options={{ title: "Scan to pay" }} />
          <Stack.Screen name="receive" options={{ title: "Receive" }} />
          <Stack.Screen name="tap" options={{ title: "Tap to pay" }} />
          <Stack.Screen name="history" options={{ title: "Activity" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
