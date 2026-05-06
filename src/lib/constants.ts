import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Device from "expo-device";

const env = (k: string, fallback = "") =>
  (Constants.expoConfig?.extra?.[k] as string | undefined) ??
  process.env[k] ??
  fallback;

export const RPC_URL = env(
  "EXPO_PUBLIC_RPC_URL",
  "https://api.devnet.solana.com",
);
export const CLUSTER = env("EXPO_PUBLIC_CLUSTER", "devnet");
export const USDC_MINT_DEVNET = env(
  "EXPO_PUBLIC_USDC_MINT_DEVNET",
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
);
export const DEFAULT_TOKEN = (env("EXPO_PUBLIC_DEFAULT_TOKEN", "SOL") as
  | "SOL"
  | "USDC");

export const APP_IDENTITY = {
  name: "TapPay",
  uri: "https://tappay.app",
  icon: "favicon.ico",
};

export const IS_ANDROID = Platform.OS === "android";
export const IS_IOS = Platform.OS === "ios";

export const IS_PHYSICAL_DEVICE = Device.isDevice === true;
export const IS_EMULATOR = !IS_PHYSICAL_DEVICE;

export const CAN_USE_MWA = IS_ANDROID && IS_PHYSICAL_DEVICE;
