import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { useState } from "react";
import { Button } from "@/components/Button";
import { useAppStore, useWalletStore } from "@/lib/store";
import { CAN_USE_MWA, IS_EMULATOR, RPC_URL, CLUSTER } from "@/lib/constants";
import { airdropIfNeeded } from "@/lib/solana";
import { shortAddress } from "@/lib/format";
import { connectWallet, getOrCreateLocalWallet } from "@/lib/wallet";

export default function Settings() {
  const wallet = useWalletStore((s) => s.wallet);
  const setWallet = useWalletStore((s) => s.setWallet);
  const perTapCap = useAppStore((s) => s.perTapCap);
  const dailyCap = useAppStore((s) => s.dailyCap);
  const microThreshold = useAppStore((s) => s.microThreshold);
  const defaultToken = useAppStore((s) => s.defaultToken);
  const setCaps = useAppStore((s) => s.setCaps);
  const setDefaultToken = useAppStore((s) => s.setDefaultToken);

  const [perTap, setPerTap] = useState(String(perTapCap));
  const [daily, setDaily] = useState(String(dailyCap));
  const [micro, setMicro] = useState(String(microThreshold));
  const [connecting, setConnecting] = useState(false);

  const onConnectMwa = async () => {
    setConnecting(true);
    try {
      const w = await connectWallet();
      setWallet(w);
      Alert.alert(
        w.kind === "mwa" ? "Mobile Wallet connected" : "Using local wallet",
        w.kind === "mwa"
          ? `Signing now uses ${w.label ?? "your installed wallet"}.`
          : "No external wallet was found. Install Phantom, Backpack, or use a Seeker.",
      );
    } catch (e: any) {
      Alert.alert("Could not connect", e?.message ?? String(e));
    } finally {
      setConnecting(false);
    }
  };

  const onUseLocal = async () => {
    const w = await getOrCreateLocalWallet();
    setWallet(w);
    Alert.alert("Using local wallet", "Switched back to the devnet keypair.");
  };

  const save = () => {
    setCaps({
      perTapCap: Number(perTap) || 0,
      dailyCap: Number(daily) || 0,
      microThreshold: Number(micro) || 0,
    });
    Alert.alert("Saved", "Spend caps updated.");
  };

  return (
    <ScrollView
      className="bg-ink-950"
      contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
    >
      <Text className="text-ink-500 text-xs uppercase tracking-wider">
        Wallet
      </Text>
      <View className="bg-ink-900 border border-ink-700 rounded-2xl p-4 mt-2">
        <Text className="text-white">
          {wallet ? shortAddress(wallet.publicKey.toBase58(), 8, 8) : "—"}
        </Text>
        <Text className="text-ink-500 text-xs mt-1">
          {wallet?.kind === "mwa"
            ? `Mobile Wallet Adapter${wallet.label ? ` · ${wallet.label}` : ""}`
            : "Local devnet keypair"}
          {" · "}
          {CLUSTER}
        </Text>
        <Text className="text-ink-500 text-xs mt-0.5">{RPC_URL}</Text>

        {wallet && wallet.kind === "local" ? (
          <View className="mt-3 gap-2">
            <Button
              variant="primary"
              loading={connecting}
              onPress={onConnectMwa}
            >
              Connect Mobile Wallet Adapter
            </Button>
            <Button
              variant="secondary"
              onPress={async () => {
                await airdropIfNeeded(wallet.publicKey, 999);
                Alert.alert("Airdrop requested", "1 SOL inbound on devnet.");
              }}
            >
              Request devnet airdrop
            </Button>
          </View>
        ) : null}

        {wallet && wallet.kind === "mwa" ? (
          <View className="mt-3">
            <Button variant="ghost" onPress={onUseLocal}>
              Switch back to local wallet
            </Button>
          </View>
        ) : null}
      </View>

      <Text className="text-ink-500 text-xs uppercase tracking-wider mt-6">
        Default token
      </Text>
      <View className="flex-row gap-2 mt-2">
        {(["SOL", "USDC"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setDefaultToken(t)}
            className={`flex-1 py-3 rounded-xl items-center ${defaultToken === t ? "bg-ink-700 border border-ink-600" : "bg-ink-900 border border-ink-700"}`}
          >
            <Text className="text-white">{t}</Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-ink-500 text-xs uppercase tracking-wider mt-6">
        Spend caps
      </Text>
      <View className="bg-ink-900 border border-ink-700 rounded-2xl p-4 mt-2 gap-4">
        <Field
          label="Per-tap max"
          suffix={defaultToken}
          value={perTap}
          onChange={setPerTap}
        />
        <Field
          label="Daily max"
          suffix={defaultToken}
          value={daily}
          onChange={setDaily}
        />
        <Field
          label="Passwordless under"
          suffix={defaultToken}
          value={micro}
          onChange={setMicro}
        />
      </View>

      <View className="mt-5">
        <Button onPress={save}>Save caps</Button>
      </View>

      <View className="mt-8 bg-ink-900/60 border border-ink-700 rounded-2xl p-4">
        <Text className="text-ink-500 text-xs">
          {CAN_USE_MWA
            ? "Mobile Wallet Adapter active — Seed Vault provides hardware-backed signing on Seeker."
            : IS_EMULATOR
              ? "Emulator detected. Using a local keypair for demo. Run on a real device for the full Seed Vault flow."
              : "MWA unavailable on this device. Falling back to a local keypair."}
        </Text>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: string;
  suffix: string;
  onChange: (s: string) => void;
}) {
  return (
    <View>
      <Text className="text-ink-500 text-xs">{label}</Text>
      <View className="flex-row items-center mt-1.5">
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#475063"
          className="flex-1 text-white text-lg py-2 border-b border-ink-700"
        />
        <Text className="text-ink-500 ml-3">{suffix}</Text>
      </View>
    </View>
  );
}
