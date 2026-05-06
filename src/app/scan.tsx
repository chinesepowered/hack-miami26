import { useState, useEffect } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { parsePaymentURL } from "@/lib/payment-url";
import { IS_EMULATOR } from "@/lib/constants";
import { readNdefOnce } from "@/lib/nfc";

export default function Scan() {
  const [perm, requestPerm] = useCameraPermissions();
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [pasted, setPasted] = useState("");

  useEffect(() => {
    if (!perm) return;
    if (!perm.granted && perm.canAskAgain) requestPerm();
  }, [perm, requestPerm]);

  const handleUrl = (raw: string) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const parsed = parsePaymentURL(raw);
      router.replace({
        pathname: "/send",
        params: {
          recipient: parsed.recipient,
          amount: parsed.amount?.toString() ?? "",
          splToken: parsed.splToken ?? "",
          memo: parsed.message ?? "",
          reference: parsed.reference ?? "",
        },
      });
    } catch (e) {
      Alert.alert("Not a payment code", String(e));
      setScanned(false);
    }
  };

  const tryNfc = async () => {
    const data = await readNdefOnce();
    if (!data) {
      Alert.alert("No NFC tag detected", "Try scanning the QR instead.");
      return;
    }
    handleUrl(data);
  };

  const pasteFromClipboard = async () => {
    const txt = await Clipboard.getStringAsync();
    setPasted(txt);
  };

  if (IS_EMULATOR || !perm?.granted) {
    return (
      <View className="flex-1 bg-ink-950 p-5 justify-center">
        <View className="bg-ink-900 border border-ink-700 rounded-2xl p-5">
          <Text className="text-white font-semibold text-lg">
            {IS_EMULATOR ? "Emulator pairing" : "Camera permission needed"}
          </Text>
          <Text className="text-ink-500 mt-2 text-sm leading-5">
            {IS_EMULATOR
              ? "Camera scanning isn't reliable in emulators. Paste the solana: URL from the Receive screen."
              : "Grant camera access to scan a payment QR."}
          </Text>
          {IS_EMULATOR ? (
            <>
              <View className="bg-ink-800 rounded-xl p-3 mt-4">
                <Text
                  selectable
                  className="text-ink-500 text-xs"
                  style={{ fontFamily: "monospace" }}
                >
                  {pasted || "solana:…"}
                </Text>
              </View>
              <View className="mt-4 gap-2">
                <Button onPress={() => handleUrl(pasted)} disabled={!pasted}>
                  Continue with pasted URL
                </Button>
                <Button variant="secondary" onPress={pasteFromClipboard}>
                  Paste from clipboard
                </Button>
              </View>
            </>
          ) : (
            <View className="mt-4">
              <Button onPress={requestPerm}>Allow camera</Button>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink-950">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => handleUrl(data)}
      />
      <View className="absolute inset-0 items-center justify-center pointer-events-none">
        <View className="w-72 h-72 border-2 border-brand-500/70 rounded-3xl" />
      </View>
      <View className="absolute top-0 left-0 right-0 p-6">
        <Text className="text-white text-center text-base font-medium">
          Point at the recipient's code
        </Text>
      </View>
      <View className="absolute bottom-10 left-0 right-0 px-6 gap-3">
        <Pressable
          onPress={tryNfc}
          className="bg-ink-900/90 border border-ink-700 rounded-2xl py-4 flex-row items-center justify-center gap-2"
        >
          <Ionicons name="radio-outline" size={18} color="#fff" />
          <Text className="text-white font-medium">Tap NFC instead</Text>
        </Pressable>
      </View>
    </View>
  );
}
