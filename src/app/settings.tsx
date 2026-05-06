import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { useAppStore, useWalletStore } from "@/lib/store";
import { CAN_USE_MWA, IS_EMULATOR, IS_PHYSICAL_DEVICE, RPC_URL, CLUSTER } from "@/lib/constants";
import { airdropIfNeeded } from "@/lib/solana";
import { shortAddress } from "@/lib/format";
import { connectWallet, getOrCreateLocalWallet } from "@/lib/wallet";
import { readTagUid, cancelTagRead, formatUid } from "@/lib/nfc";

type PairPhase = "idle" | "scanning" | "editing";

export default function Settings() {
  const params = useLocalSearchParams<{ pairUid?: string }>();
  const wallet = useWalletStore((s) => s.wallet);
  const setWallet = useWalletStore((s) => s.setWallet);
  const perTapCap = useAppStore((s) => s.perTapCap);
  const dailyCap = useAppStore((s) => s.dailyCap);
  const microThreshold = useAppStore((s) => s.microThreshold);
  const defaultToken = useAppStore((s) => s.defaultToken);
  const pairedTags = useAppStore((s) => s.pairedTags);
  const setCaps = useAppStore((s) => s.setCaps);
  const setDefaultToken = useAppStore((s) => s.setDefaultToken);
  const pairTag = useAppStore((s) => s.pairTag);
  const unpairTag = useAppStore((s) => s.unpairTag);

  const [perTap, setPerTap] = useState(String(perTapCap));
  const [daily, setDaily] = useState(String(dailyCap));
  const [micro, setMicro] = useState(String(microThreshold));
  const [connecting, setConnecting] = useState(false);

  const [pairPhase, setPairPhase] = useState<PairPhase>("idle");
  const [pairUid, setPairUid] = useState("");
  const [pairLabel, setPairLabel] = useState("");
  const [pairRecipient, setPairRecipient] = useState("");
  const [pairAmount, setPairAmount] = useState("");
  const [pairToken, setPairToken] = useState<"SOL" | "USDC">(defaultToken);

  useEffect(() => {
    if (params.pairUid && pairPhase === "idle") {
      setPairUid(params.pairUid);
      setPairLabel("");
      setPairRecipient(wallet?.publicKey.toBase58() ?? "");
      setPairAmount("");
      setPairToken(defaultToken);
      setPairPhase("editing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pairUid]);

  const startPair = async () => {
    setPairUid("");
    setPairLabel("");
    setPairRecipient(wallet?.publicKey.toBase58() ?? "");
    setPairAmount("");
    setPairToken(defaultToken);
    setPairPhase("scanning");
    if (!IS_PHYSICAL_DEVICE) {
      // Emulator: simulate the same fixed UID that tap.tsx generates,
      // so pairing once on emulator means the Tap to Pay flow finds a match.
      setTimeout(() => {
        setPairUid("emulator-mock-uid-0001");
        setPairPhase("editing");
      }, 1200);
      return;
    }
    const uid = await readTagUid();
    if (!uid) {
      setPairPhase("idle");
      return;
    }
    setPairUid(uid);
    setPairPhase("editing");
  };

  const cancelPair = () => {
    cancelTagRead();
    setPairPhase("idle");
  };

  const savePair = () => {
    const trimmed = pairRecipient.trim();
    if (!pairLabel.trim()) {
      Alert.alert("Add a label", "e.g. 'Alice's phone' or 'Demo merchant'.");
      return;
    }
    if (!trimmed || trimmed.length < 32) {
      Alert.alert("Invalid recipient", "Paste a valid Solana address.");
      return;
    }
    const amt = pairAmount ? Number(pairAmount) : undefined;
    pairTag({
      uid: pairUid,
      label: pairLabel.trim(),
      recipient: trimmed,
      amount: amt && amt > 0 ? amt : undefined,
      token: pairToken,
      pairedAt: Date.now(),
    });
    setPairPhase("idle");
  };

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
        <Text className="text-ink-500 text-xs mt-0.5">
          {(() => {
            try {
              return new URL(RPC_URL).host;
            } catch {
              return "RPC configured";
            }
          })()}
        </Text>

        {wallet && wallet.kind === "local" ? (
          <View className="mt-3 gap-2">
            <Button variant="primary" loading={connecting} onPress={onConnectMwa}>
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
        Paired NFC devices
      </Text>
      <View className="bg-ink-900 border border-ink-700 rounded-2xl p-4 mt-2">
        <Text className="text-ink-500 text-xs leading-4">
          Each tag stands in for a paired phone in tap-to-pay. In production
          this would be the receiver's HCE-backed TapPay app — for the demo we
          map a wristband / sticker UID to a recipient address.
        </Text>

        {pairedTags.length > 0 ? (
          <View className="mt-3 gap-2">
            {pairedTags.map((t) => (
              <View
                key={t.uid}
                className="bg-ink-800 rounded-xl p-3 flex-row items-center"
              >
                <View className="flex-1">
                  <Text className="text-white font-medium">{t.label}</Text>
                  <Text className="text-ink-500 text-xs mt-0.5">
                    {shortAddress(t.recipient, 6, 6)}
                    {t.amount ? ` · ${t.amount} ${t.token ?? "SOL"}` : ""}
                  </Text>
                  <Text className="text-ink-500 text-xs mt-0.5">
                    UID {formatUid(t.uid)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => unpairTag(t.uid)}
                  className="bg-ink-700 px-3 py-1.5 rounded-full"
                >
                  <Ionicons name="trash-outline" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {pairPhase === "idle" ? (
          <View className="mt-3">
            <Button variant="secondary" onPress={startPair}>
              <Ionicons name="add-outline" size={18} color="#fff" />
              {"  "}Pair a new tag
            </Button>
          </View>
        ) : null}

        {pairPhase === "scanning" ? (
          <View className="mt-3 bg-ink-800 rounded-xl p-4 items-center">
            <Ionicons name="radio-outline" size={32} color="#9DA9C8" />
            <Text className="text-white mt-2">Hold tag near phone…</Text>
            <View className="mt-3 w-full">
              <Button variant="ghost" onPress={cancelPair}>
                Cancel
              </Button>
            </View>
          </View>
        ) : null}

        {pairPhase === "editing" ? (
          <View className="mt-3 bg-ink-800 rounded-xl p-4 gap-3">
            <View>
              <Text className="text-ink-500 text-xs">UID</Text>
              <Text className="text-white text-sm mt-1">
                {formatUid(pairUid)}
              </Text>
            </View>
            <View>
              <Text className="text-ink-500 text-xs">Label</Text>
              <TextInput
                value={pairLabel}
                onChangeText={setPairLabel}
                placeholder="Alice's phone"
                placeholderTextColor="#475063"
                className="text-white text-base py-2 border-b border-ink-700"
              />
            </View>
            <View>
              <Text className="text-ink-500 text-xs">Recipient address</Text>
              <TextInput
                value={pairRecipient}
                onChangeText={setPairRecipient}
                placeholder="Solana address"
                placeholderTextColor="#475063"
                multiline
                className="text-white text-sm py-2 border-b border-ink-700"
              />
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-ink-500 text-xs">Amount (optional)</Text>
                <TextInput
                  value={pairAmount}
                  onChangeText={setPairAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#475063"
                  className="text-white text-base py-2 border-b border-ink-700"
                />
              </View>
              <View>
                <Text className="text-ink-500 text-xs">Token</Text>
                <View className="flex-row mt-1.5 gap-1.5">
                  {(["SOL", "USDC"] as const).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setPairToken(t)}
                      className={`px-3 py-2 rounded-lg ${
                        pairToken === t
                          ? "bg-ink-600"
                          : "bg-ink-700 border border-ink-600"
                      }`}
                    >
                      <Text className="text-white text-xs">{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
            <View className="flex-row gap-2 mt-1">
              <View className="flex-1">
                <Button variant="ghost" onPress={cancelPair}>
                  Cancel
                </Button>
              </View>
              <View className="flex-1">
                <Button onPress={savePair}>Save</Button>
              </View>
            </View>
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
