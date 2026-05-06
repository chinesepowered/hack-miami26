import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/Button";
import { Keypad } from "@/components/Keypad";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { TapAnimation } from "@/components/TapAnimation";
import { useAppStore, useWalletStore } from "@/lib/store";
import { buildTransferTx, SOL, USDC, explorerUrl } from "@/lib/solana";
import { isUsdcMint, parsePaymentURL } from "@/lib/payment-url";
import { shortAddress, formatAmount } from "@/lib/format";

export default function Send() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    recipient?: string;
    amount?: string;
    splToken?: string;
    memo?: string;
    reference?: string;
    autoConfirm?: string;
  }>();

  const wallet = useWalletStore((s) => s.wallet);
  const contacts = useAppStore((s) => s.contacts);
  const history = useAppStore((s) => s.history);
  const addTx = useAppStore((s) => s.addTx);
  const updateTx = useAppStore((s) => s.updateTx);
  const perTapCap = useAppStore((s) => s.perTapCap);

  const [recipient, setRecipient] = useState(params.recipient ?? "");
  const [amount, setAmount] = useState(
    params.amount && Number(params.amount) > 0 ? params.amount : "0",
  );
  const [token, setToken] = useState<"SOL" | "USDC">(
    isUsdcMint(params.splToken) ? "USDC" : "SOL",
  );
  const [memo, setMemo] = useState(params.memo ?? "");
  const [reference, setReference] = useState(params.reference ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [phase, setPhase] = useState<
    "idle" | "tapping" | "confirmed" | "failed"
  >("idle");
  const [lastSig, setLastSig] = useState<string | null>(null);

  useEffect(() => {
    if (params.recipient) setRecipient(params.recipient);
    if (params.amount) setAmount(params.amount);
    if (params.reference) setReference(params.reference);
    if (params.memo) setMemo(params.memo);
    if (params.autoConfirm === "1" && params.recipient && Number(params.amount) > 0) {
      setConfirmOpen(true);
    }
  }, [params.recipient, params.amount, params.reference, params.memo, params.autoConfirm]);

  const numAmount = Number(amount) || 0;

  const validRecipient = useMemo(() => {
    if (!recipient) return false;
    try {
      new PublicKey(recipient);
      return true;
    } catch {
      return false;
    }
  }, [recipient]);

  const isNewRecipient = useMemo(() => {
    if (!validRecipient) return false;
    const inContacts = contacts.some((c) => c.address === recipient);
    if (inContacts) return false;
    const sentBefore = history.some(
      (t) => t.counterparty === recipient && t.direction === "out",
    );
    return !sentBefore;
  }, [recipient, contacts, history, validRecipient]);

  const recipientLabel = useMemo(
    () => contacts.find((c) => c.address === recipient)?.label,
    [contacts, recipient],
  );

  const overCap = numAmount > perTapCap;

  const pasteRecipient = async () => {
    try {
      const txt = (await Clipboard.getStringAsync()).trim();
      if (!txt) {
        Alert.alert("Clipboard is empty");
        return;
      }
      if (txt.startsWith("solana:")) {
        const parsed = parsePaymentURL(txt);
        setRecipient(parsed.recipient);
        if (parsed.amount) setAmount(String(parsed.amount));
        setToken(isUsdcMint(parsed.splToken) ? "USDC" : "SOL");
        if (parsed.message) setMemo(parsed.message);
        if (parsed.reference) setReference(parsed.reference);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      // Try as a raw address.
      new PublicKey(txt);
      setRecipient(txt);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Couldn't read clipboard", e?.message ?? String(e));
    }
  };

  const performSend = async () => {
    if (!wallet) return;
    setPhase("tapping");
    const id = `tx-${Date.now()}`;
    addTx({
      id,
      ts: Date.now(),
      direction: "out",
      counterparty: recipient,
      counterpartyLabel: recipientLabel,
      amount: numAmount,
      token,
      memo: memo || undefined,
      status: "pending",
    });
    try {
      const tx = await buildTransferTx({
        from: wallet.publicKey,
        to: new PublicKey(recipient),
        amount: numAmount,
        token: token === "SOL" ? SOL : USDC,
        memo: memo || undefined,
        reference: reference ? new PublicKey(reference) : undefined,
      });
      const sig = await wallet.signAndSend(tx);
      setLastSig(sig);
      updateTx(id, { signature: sig, status: "confirmed" });
      setPhase("confirmed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      updateTx(id, { status: "failed" });
      setPhase("failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Payment failed", e?.message ?? String(e));
    }
  };

  if (phase !== "idle") {
    return (
      <View className="flex-1 bg-ink-950 p-6 items-center justify-center">
        <TapAnimation state={phase} />
        <View className="items-center mt-6">
          <Text className="text-white text-3xl font-bold">
            {phase === "confirmed"
              ? "Sent"
              : phase === "failed"
                ? "Failed"
                : "Sending…"}
          </Text>
          <Text className="text-ink-500 mt-2">
            {formatAmount(numAmount, token === "SOL" ? 4 : 2)} {token} →{" "}
            {recipientLabel ?? shortAddress(recipient)}
          </Text>
          {phase === "confirmed" && lastSig ? (
            <Text className="text-ink-500 text-xs mt-3">
              {shortAddress(lastSig, 6, 6)}
            </Text>
          ) : null}
        </View>
        {phase !== "tapping" ? (
          <View className="mt-10 w-full gap-3">
            <Button onPress={() => router.replace("/")}>Done</Button>
            {phase === "confirmed" && lastSig ? (
              <Button
                variant="ghost"
                onPress={() => Linking.openURL(explorerUrl(lastSig))}
              >
                View on explorer
              </Button>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
      className="bg-ink-950"
    >
      <Text className="text-ink-500 text-xs uppercase tracking-wider mb-2">
        To
      </Text>
      <View className="bg-ink-900 border border-ink-700 rounded-2xl p-4 flex-row items-center">
        <Pressable
          onPress={() => router.push("/scan")}
          className="w-10 h-10 rounded-full bg-ink-700 items-center justify-center"
        >
          <Ionicons
            name={validRecipient ? "person" : "scan-outline"}
            size={18}
            color="#fff"
          />
        </Pressable>
        <View className="flex-1 ml-3">
          {validRecipient ? (
            <>
              <Text className="text-white font-medium">
                {recipientLabel ?? shortAddress(recipient, 6, 6)}
              </Text>
              {recipientLabel ? (
                <Text className="text-ink-500 text-xs mt-0.5">
                  {shortAddress(recipient, 6, 6)}
                </Text>
              ) : null}
            </>
          ) : (
            <Text className="text-ink-500">Scan or paste a payment code</Text>
          )}
        </View>
        <Pressable
          onPress={pasteRecipient}
          className="bg-ink-700 px-3 py-1.5 rounded-full"
        >
          <Text className="text-white text-xs font-medium">Paste</Text>
        </Pressable>
      </View>

      <Text className="text-ink-500 text-xs uppercase tracking-wider mt-6 mb-2">
        Amount
      </Text>
      <View className="items-center mt-2 mb-2">
        <Text className="text-white text-7xl font-bold tracking-tighter">
          {amount}
        </Text>
        <Text className="text-ink-500 text-lg mt-1">{token}</Text>
      </View>

      <View className="flex-row justify-center gap-2 mb-3">
        {(["SOL", "USDC"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setToken(t)}
            className={`px-4 py-2 rounded-full ${
              token === t
                ? "bg-ink-700"
                : "bg-ink-900 border border-ink-700"
            }`}
          >
            <Text className="text-white text-xs font-medium">{t}</Text>
          </Pressable>
        ))}
      </View>

      {overCap ? (
        <View className="bg-accent-pink/15 border border-accent-pink/30 rounded-xl p-3 mb-3">
          <Text className="text-accent-pink text-xs">
            Above your per-tap cap ({perTapCap} {token}). Adjust in Settings to
            send more.
          </Text>
        </View>
      ) : null}

      <Keypad value={amount} onChange={setAmount} />

      <View className="mt-4">
        <Button
          size="lg"
          disabled={!validRecipient || numAmount <= 0 || overCap}
          onPress={() => setConfirmOpen(true)}
        >
          Review · {formatAmount(numAmount, token === "SOL" ? 4 : 2)} {token}
        </Button>
      </View>

      <ConfirmSheet
        visible={confirmOpen}
        amount={numAmount}
        token={token}
        recipient={recipient}
        recipientLabel={recipientLabel}
        isNewRecipient={isNewRecipient}
        cancelWindowMs={3000}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          performSend();
        }}
      />
    </ScrollView>
  );
}
