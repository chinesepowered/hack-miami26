# DEPLOY — TapPay setup & demo guide

This is the practical, step-by-step doc for setting up TapPay and demoing it. Pick the path that matches your hardware.

---

## 0 · One-time machine setup

Required:

- **Node.js 20+** (`node -v`)
- **Java 17** (Android builds need it; `java -version` should say 17.x)
- **Android Studio** with at least one SDK platform installed (API 35 recommended)
- **Android SDK** environment variable: `ANDROID_HOME` should point at your SDK install (typically `C:\Users\<you>\AppData\Local\Android\Sdk` on Windows or `~/Library/Android/sdk` on macOS)

Verify:

```sh
adb --version          # should print Android Debug Bridge
emulator -list-avds    # should list at least one AVD if you've created one
```

Then in this directory:

```sh
npm install --legacy-peer-deps
npx expo prebuild --platform android --clean
```

The `prebuild` step generates the `android/` folder with all native config baked in. Run it once; only re-run if you change `app.json` or add new native deps.

---

## 1 · Pick your demo path

| Path | Hardware | Wallet UX | Pairing | Best for |
|---|---|---|---|---|
| **A** | One Android emulator | Local devnet keypair | Clipboard paste | Quick iteration; presenting alone |
| **B** | Two Android emulators | Local devnet keypair (each) | Clipboard paste between AVDs | Full sender↔receiver flow without devices |
| **C** | One Android phone + one emulator | Phone uses MWA · emulator uses local | QR scan from phone camera | Most realistic single-presenter demo |
| **D** | Two Android phones (any) | Mobile Wallet Adapter | NFC tap or QR scan | Best non-Seeker demo |
| **E** | Two Solana Seekers | Seed Vault via MWA | NFC tap or QR scan | The full pitch — biometric + hardware key |

---

## Path A — Single emulator (fastest sanity check)

**Time to first transaction: ~5 minutes**

1. In Android Studio, open Device Manager → start any AVD (Pixel 7 with API 35 works well).
2. From this directory:
   ```sh
   npx expo run:android
   ```
3. Wait for the build (~3–5 min first time, ~30 sec subsequent runs). The app launches automatically.
4. The home screen shows `DEMO MODE` and a tiny SOL balance once the devnet airdrop confirms (10–30 seconds).
   - If the balance stays at 0, tap **Settings → Request devnet airdrop**. If devnet rate-limits you, paste your address into https://faucet.solana.com.
5. Tap **Receive** → enter `0.01` → **Show payment code**.
6. Long-press the QR — there's no "scan myself" path on a single emulator, so the demo here is the *Receive* screen and the *Settings* spend caps. To do a full send, jump to Path B.

---

## Path B — Two emulators (full flow, no devices needed)

**This is the recommended path if you don't have two phones handy.**

1. In Android Studio Device Manager, **start two AVDs** (e.g. `Pixel_7_API_35` and `Pixel_6a_API_35`).
2. Confirm `adb devices` lists both:
   ```sh
   adb devices
   # List of devices attached
   # emulator-5554   device
   # emulator-5556   device
   ```
3. Build and install on **both** at once:
   ```sh
   npx expo run:android --device emulator-5554
   npx expo run:android --device emulator-5556
   ```
   (Run them sequentially — second invocation will be much faster since the JS bundle is reused.)
4. On both phones, wait for the airdrop on first launch (or go to **Settings → Request devnet airdrop**). You only need balance on the *sender*.
5. **The pairing flow:**
   - On phone B (receiver): tap **Receive** → `0.05` → **Show payment code**.
   - Tap **Copy URL** on phone B.
   - The clipboard between AVDs is **not shared** by default. Two ways to fix this:
     - **Easy:** open Android Studio's "Logcat" pane filtered to the `tappay` tag — the URL is logged on copy. Highlight + copy from logcat, then on phone A go to **Pay → Paste**.
     - **Easier:** run this in your terminal to forward the clipboard:
       ```sh
       # Read URL from receiver's clipboard
       adb -s emulator-5556 shell service call clipboard 2 i32 1 i32 0 i32 0 \
         | head -2 | tail -1 | sed 's/[^"]*"\([^"]*\)".*/\1/' \
         | xargs -I {} adb -s emulator-5554 shell input text {}
       ```
       (You can also use [scrcpy](https://github.com/Genymobile/scrcpy) which shares clipboard with the host machine automatically — recommended.)
   - On phone A (sender): tap **Pay** → **Paste from clipboard** → **Continue with pasted URL** → review → **Confirm with biometric** → 3-second cancel window → ✅
6. Phone B's Receive screen flips to "Received" via WebSocket subscription on the reference key. The transaction is real on Solana devnet — verifiable on https://explorer.solana.com (linked from Activity).

---

## Path C — One Android phone + emulator (clean presenter demo)

If you have one Android phone and don't want to bring two:

1. Start the emulator and run `npx expo run:android` (Path A).
2. Connect your real phone via USB (USB debugging on; trust the computer when prompted).
3. `adb devices` should show both. Run again with `--device <serial>`:
   ```sh
   npx expo run:android --device <your-phone-serial>
   ```
4. **Demo on stage:**
   - The emulator (projected) is the **merchant**. Run **Receive → Show payment code**.
   - Your phone (in your hand) is the **customer**. Run **Pay → Scan**.
   - Point your phone's camera at the laptop screen showing the QR. Confirm with biometric.
   - Both screens update simultaneously.

This is the demo that reads cleanest to a room.

---

## Path D — Two regular Android phones

The full mobile experience without Seeker hardware.

1. Both phones: enable Developer Options → USB Debugging.
2. Connect both via USB (or use Wi-Fi ADB if you have it set up).
3. `adb devices` should list both.
4. Install on both:
   ```sh
   npx expo run:android --device <serial-A>
   npx expo run:android --device <serial-B>
   ```
5. **Wallet setup (one time, on each phone):**
   - Install **Phantom** or **Backpack** from Google Play.
   - Open it, create a new wallet, switch network to **Devnet** (Phantom: Settings → Developer Settings → Devnet).
   - Get devnet SOL on the *sender* via https://faucet.solana.com.
6. Open TapPay, tap **Pay** for the first time. The Mobile Wallet Adapter bridge will prompt to authorize Phantom/Backpack. Approve.
7. **Demo:**
   - Phone B: **Receive** → enter amount → **Show payment code**.
   - Phone A: **Pay** → camera opens → point at B's QR → confirm → ✅ in ~1 second.
   - For the NFC tap variant: have Phone A on the **Pay** screen, tap **Tap NFC instead**, hold the phones back-to-back. (Bidirectional NFC needs HCE; in v1 the customer reads, the merchant displays QR + an NDEF tag if available.)

---

## Path E — Two Solana Seekers (the full pitch)

Identical to Path D but with two key differences:

- The wallet is **Seed Vault** — already preinstalled on every Seeker. No Phantom install needed.
- Biometric signing is hardware-bound. The confirm step uses the device's secure element, not a software keystore.

1. Enable Developer Options on each Seeker (Settings → About → tap build number 7 times).
2. Plug in via USB-C, accept the debugging prompt.
3. `adb devices` lists both Seekers.
4. Install on both:
   ```sh
   npx expo run:android --device <seeker-A-serial>
   npx expo run:android --device <seeker-B-serial>
   ```
5. On first **Pay**, MWA will surface the Seed Vault. Authorize once; subsequent payments use cached authorization.
6. Demo identical to Path D, except the biometric prompt feels native (because it is).

For the cleanest stage moment: both Seekers face the audience. One taps **Receive**, the other **Pay**. Tap them together. The receiver's screen flips to ✅ before you can finish saying "and that's it."

---

## 2 · Building a release APK (for app-store submission later)

```sh
cd android
./gradlew assembleRelease         # macOS/Linux
gradlew.bat assembleRelease       # Windows
```

Output APK lands at `android/app/build/outputs/apk/release/app-release.apk`. Sign it with your own keystore before distribution.

For the **Solana dApp Store**, follow https://github.com/solana-mobile/dapp-publishing — they wrap the APK in a publisher manifest and submit on-chain.

For the Google Play Store: build an AAB (`./gradlew bundleRelease`) and upload via the Play Console.

---

## 3 · Common issues

**Build fails with `Unable to determine event arguments for "onModeChange"`**
Means React Native version is mismatched against the Expo SDK. Run `npx expo install --fix` to realign every package, then `npx expo prebuild --clean`.

**"NFC is not enabled" on Pay screen**
The phone has NFC but it's turned off. Settings → Connected devices → NFC.

**Camera permission denied**
First Pay action prompts for camera. If denied: Settings → Apps → TapPay → Permissions → Camera → Allow.

**Devnet airdrop returns 429**
You've hit the rate limit. Either wait 10 min, or use https://faucet.solana.com which is more generous, or switch RPC by editing `.env`:
```
EXPO_PUBLIC_RPC_URL=https://api.devnet.solana.com
```
to a Helius/QuickNode devnet endpoint.

**MWA bridge says "no wallet found"**
On a regular Android device, install Phantom or Backpack. On Seeker, Seed Vault is preinstalled — if MWA still can't find it, restart the phone.

**Two emulators can't share clipboard**
Use [scrcpy](https://github.com/Genymobile/scrcpy) or pull/push the clipboard via `adb shell` (sample script in Path B). Or just use one emulator + one real phone (Path C) which is easier.

**Bundle is huge / slow Hermes startup**
The 7 MB Hermes bundle is normal for this stack. First startup on a low-end phone is ~3 sec; subsequent launches are <1 sec.

---

## 4 · Demo script (cheat sheet)

For when you're up there with 30 seconds to land it:

1. Hold up phone A: *"This is the customer."*
2. Hold up phone B: *"This is the coffee shop."*
3. Phone B: tap Receive → `4.50` → Show payment code.
4. Phone A: tap Pay → tap B's QR → biometric → 3-2-1 → ✅
5. Both screens flash green.
6. *"Four-fifty. One second. Zero fees to either of us. Works in any country."*
7. Drop the mic.
