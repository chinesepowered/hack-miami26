import { useMemo, useState, useEffect } from "react";
import { Text, View, ScrollView, Pressable, Alert, Share } from "react-native";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { Button } from "@/components/Button";
import { Keypad } from "@/components/Keypad";
import { useAppStore, useWalletStore } from "@/lib/store";
import { buildPaymentURL } from "@/lib/payment-url";
import { USDC, connection } from "@/lib/solana";
import { shortAddress, formatAmount } from "@/lib/format";
import { broadcastNdefStub } from "@/lib/nfc";
import { Keypair, PublicKey } from "@solana/web3.js";

export default function Receive() {
  const router = useRouter();
  const wallet = useWalletStore((s) => s.wallet);
  const defaultToken = useAppStore((s) => s.defaultToken);
  const addTx = useAppStore((s) => s.addTx);

  const [amount, setAmount] = useState("0");
  const [token, setToken] = useState<"SOL" | "USDC">(defaultToken);
  const [memo] = useState<string | undefined>(undefined);
  const [reference] = useState(() => Keypair.generate().publicKey.toBase58());
  const [armed, setArmed] = useState(false);
  const [received, setReceived] = useState(false);
  const [copied, setCopied] = useState(false);

  const numAmount = Number(amount) || 0;

  const url = useMemo(() => {
    if (!wallet) return null;
    return buildPaymentURL({
      recipient: wallet.publicKey.toBase58(),
      amount: numAmount > 0 ? numAmount : undefined,
      splToken: token === "USDC" ? USDC.mint.toBase58() : undefined,
      label: "TapPay",
      message: memo,
      reference,
    });
  }, [wallet, numAmount, token, memo, reference]);

  // Stub NDEF broadcast (real HCE wired in v1.5).
  useEffect(() => {
    if (!armed || !url) return;
    broadcastNdefStub(url);
  }, [armed, url]);

  // Watch for incoming payment matching our reference key.
  useEffect(() => {
    if (!armed || !wallet) return;
    const refPk = new PublicKey(reference);
    const id = connection.onLogs(
      refPk,
      (logs) => {
        if (logs.err) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addTx({
          id: logs.signature,
          ts: Date.now(),
          direction: "in",
          counterparty: "—",
          amount: numAmount,
          token,
          memo,
          signature: logs.signature,
          status: "confirmed",
        });
        setReceived(true);
      },
      "confirmed",
    );
    return () => {
      connection.removeOnLogsListener(id).catch(() => {});
    };
  }, [armed, wallet, reference, numAmount, token, memo, addTx]);

  const copyUrl = async () => {
    if (!url) return;
    await Clipboard.setStringAsync(url);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareUrl = async () => {
    if (!url) return;
    try {
      await Share.share({ message: url });
    } catch {}
  };

  if (!wallet) return null;

  if (received) {
    return (
      <View className="flex-1 bg-ink-950 items-center justify-center p-8">
        <View className="w-32 h-32 rounded-full bg-brand-500/20 border-2 border-brand-500 items-center justify-center">
          <Text className="text-brand-400 text-7xl">✓</Text>
        </View>
        <Text className="text-white text-3xl font-bold mt-8">Received</Text>
        <Text className="text-ink-500 mt-2 text-lg">
          +{formatAmount(numAmount, token === "SOL" ? 4 : 2)} {token}
        </Text>
        <View className="mt-12 w-full gap-3">
          <Button onPress={() => router.replace("/")}>Done</Button>
          <Button
            variant="ghost"
            onPress={() => {
              setReceived(false);
              setArmed(false);
              setAmount("0");
            }}
          >
            New request
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
      className="bg-ink-950"
    >
      {!armed ? (
        <>
          <Text className="text-ink-500 text-xs uppercase tracking-wider mb-2">
            Request amount
          </Text>
          <View className="items-center mt-2 mb-2">
            <Text className="text-white text-7xl font-bold tracking-tighter">
              {amount}
            </Text>
            <Text className="text-ink-500 text-lg mt-1">{token}</Text>
          </View>

          <View className="flex-row justify-center gap-2 mb-3">
            <Pressable
              onPress={() => setToken("SOL")}
              className={`px-4 py-2 rounded-full ${
                token === "SOL"
                  ? "bg-ink-700"
                  : "bg-ink-900 border border-ink-700"
              }`}
            >
              <Text className="text-white text-xs font-medium">SOL</Text>
            </Pressable>
            <Pressable
              onPress={() => setToken("USDC")}
              className={`px-4 py-2 rounded-full ${
                token === "USDC"
                  ? "bg-ink-700"
                  : "bg-ink-900 border border-ink-700"
              }`}
            >
              <Text className="text-white text-xs font-medium">USDC</Text>
            </Pressable>
          </View>

          <Keypad value={amount} onChange={setAmount} />

          <View className="mt-4">
            <Button
              size="lg"
              disabled={numAmount <= 0}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setArmed(true);
              }}
            >
              Show payment code →
            </Button>
          </View>
        </>
      ) : (
        <View className="items-center">
          <Text className="text-ink-500 text-xs uppercase tracking-wider">
            Tap or scan to pay
          </Text>
          <View className="mt-2 mb-1 items-center">
            <Text className="text-white text-6xl font-bold tracking-tighter">
              {formatAmount(numAmount, token === "SOL" ? 4 : 2)}
            </Text>
            <Text className="text-ink-500 text-lg mt-1">{token}</Text>
          </View>

          <View className="bg-white p-5 rounded-3xl mt-5">
            {url ? (
              <QRCode
                value={url}
                size={260}
                backgroundColor="#fff"
                color="#070912"
              />
            ) : null}
          </View>

          <Text className="text-ink-500 text-xs mt-4">
            {shortAddress(wallet.publicKey.toBase58(), 8, 8)}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-3">
            <View className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <Text className="text-brand-400 text-xs">
              Listening for payment…
            </Text>
          </View>

          <View className="flex-row gap-2 mt-6 w-full">
            <View className="flex-1">
              <Button variant="secondary" onPress={copyUrl}>
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={16}
                  color="#fff"
                />
                {"  "}
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </View>
            <View className="flex-1">
              <Button variant="secondary" onPress={shareUrl}>
                <Ionicons name="share-outline" size={16} color="#fff" />
                {"  "}Share
              </Button>
            </View>
          </View>

          <View className="mt-3 w-full">
            <Button variant="ghost" onPress={() => setArmed(false)}>
              <Ionicons name="chevron-back" size={16} color="#fff" /> Change
              amount
            </Button>
          </View>
          <View className="mt-2 w-full">
            <Button variant="ghost" onPress={() => router.back()}>
              Done
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
