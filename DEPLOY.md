# DEPLOY — TapPay setup & demo guide

Practical, step-by-step doc for setting up TapPay and demoing it. Pick the path that matches your hardware.

---

## 0 · One-time machine setup

Required:

- **Node.js 20+** (`node -v`)
- **Java 17** (Android builds need it; `java -version` should say 17.x)
- **Android Studio** with API 35 + 36 platforms installed
- **Android SDK** environment variable: `ANDROID_HOME` should point at your SDK install (typically `C:\Users\<you>\AppData\Local\Android\Sdk` on Windows or `~/Library/Android/sdk` on macOS). On Windows, if `ANDROID_HOME` isn't set, the project's `android/local.properties` already hardcodes the path — leave it.

Verify:

```sh
adb --version          # should print Android Debug Bridge
emulator -list-avds    # should list at least one AVD if you've created one
```

Then in this directory:

```sh
npm install --legacy-peer-deps
npx expo prebuild --platform android --clean    # ⚠️ only if android/ doesn't exist yet
```

⚠️ **Don't re-run `prebuild --clean`** unless absolutely needed — it regenerates `android/` from scratch, which wipes the **Gradle 8.13** wrapper override and requires re-applying our `compileSdk 36` and `local.properties` patches. The current `android/` is set up correctly; only re-prebuild if you change a plugin in `app.json`.

---

## 1 · Pick your demo path

| Path | Hardware | Wallet UX | Pairing | Best for |
|---|---|---|---|---|
| **A** | One Android emulator | Local devnet keypair | Mock NFC tap (1.5s simulated) + clipboard paste | Quick iteration; presenting alone |
| **B** | Two Android emulators | Local devnet keypair (each) | Clipboard paste between AVDs | Full sender↔receiver flow without devices |
| **C** | One Android phone + one emulator | Phone uses MWA · emulator uses local | QR scan from phone camera | Most realistic single-presenter demo |
| **D** | Two Android phones (any) | Mobile Wallet Adapter | NFC tap or QR scan | Best non-Seeker demo |
| **E** | Two Solana Seekers | Seed Vault via MWA | NFC tap or QR scan | The full pitch — biometric + hardware key |
| **F** | One phone + one NFC tag (wristband, sticker, ring, transit card) | MWA or local | NFC tap | **Headline NFC demo without two phones** |

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
5. Tap **Tap to Pay** — on the emulator the NFC reader is mocked: it auto-fires a synthetic UID after ~1.5 s. Pair that mock UID once in **Settings → Pair a new tag** (recipient = your wallet address, amount = 0.01) and the next Tap → Pay flow runs end-to-end through the confirm sheet.
6. For full sender↔receiver flow on a single laptop, jump to Path B.

---

## Path B — Two emulators (full flow, no devices needed)

**Recommended path if you don't have two phones handy.**

1. In Android Studio Device Manager, **start two AVDs** (e.g. `Pixel_7_API_35` and `Pixel_6a_API_35`).
2. Confirm `adb devices` lists both:
   ```sh
   adb devices
   # emulator-5554   device
   # emulator-5556   device
   ```
3. Build and install on **both** sequentially:
   ```sh
   npx expo run:android --device emulator-5554
   npx expo run:android --device emulator-5556
   ```
4. On both phones, wait for the airdrop on first launch (or **Settings → Request devnet airdrop**). You only need balance on the *sender*.
5. **The pairing flow:**
   - Phone B (receiver): tap **Receive** → `0.05` → **Show payment code** → **Copy URL**.
   - Get the URL from B to A. Two ways:
     - **Easy:** [scrcpy](https://github.com/Genymobile/scrcpy) shares clipboard with the host, just paste.
     - **Manual:** read the URL from the Receive screen (it's printed under the QR), type it into A.
   - Phone A (sender): tap **Scan** → **Paste from clipboard** → review → **Confirm with biometric** → 3-second cancel window → ✅
6. Phone B's Receive screen flips to "Received" via the WebSocket subscription on the reference key. The transaction is real on Solana devnet — verifiable on https://explorer.solana.com (linked from Activity).

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
   - Your phone (in your hand) is the **customer**. Run **Scan**.
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
   - Get devnet SOL on the wallet via https://faucet.solana.com.
6. **Open TapPay → Settings → tap "Connect Mobile Wallet Adapter".** This flips the app from the local devnet keypair (boot default) to your installed wallet. The address chip on Home will switch from "local devnet" to "MWA".
7. **Demo flow (QR variant):**
   - Phone B: **Receive** → enter amount → **Show payment code**.
   - Phone A: **Scan** → camera opens → point at B's QR → confirm → ✅ in ~1 second.

Phone-to-phone NFC tap on two Android phones requires Host Card Emulation on the receiver side, which is **v1.5** (see *NFC notes* below). For two-phone demos today, use **QR** between phones, or use **Path F** (phone + NFC tag) to demo the tap UX.

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
5. **Open TapPay → Settings → tap "Connect Mobile Wallet Adapter".** On Seeker, this surfaces Seed Vault directly. Authorize once; subsequent payments use cached authorization and only need the biometric.
6. Demo identical to Path D, except the biometric prompt is hardware-native.

---

## Path F — Phone + NFC tag (the headline tap demo) ⭐

**Use this when you want the tap-to-pay narrative but don't have phone-to-phone HCE wired.**

The pitch is phone-to-phone NFC. To make that landable in the demo without shipping HCE, we use any NFC tag (a wristband, a sticker, a transit card, a hotel keycard, even a ring) as a stand-in for the receiver phone. The tag's UID is mapped locally to a recipient wallet address. To the audience the tap looks identical to a phone-to-phone tap — same biometric, same green check, same 1-second settlement. **Don't mention "wristband" in the pitch** — just say "tap to pay" and tap it.

### One-time setup

1. Install the app on your phone (`npx expo run:android --device <serial>`).
2. **Settings → Connect Mobile Wallet Adapter** so signing is via Seed Vault / Phantom (skip on emulator).
3. **Settings → Paired NFC devices → Pair a new tag.**
4. Hold your NFC tag (wristband, sticker, etc.) near the back of the phone. The UID populates the form.
5. Fill in:
   - **Label:** something believable like `Demo Coffee Shop` or `Alice's phone`
   - **Recipient:** the Solana address you want the payment to land at — use a *different* wallet than the sender so the demo shows real balance movement (a second TapPay install, a Phantom mobile wallet, or a desktop wallet)
   - **Amount:** `0.05` (or whatever) — preset amount makes the demo flow zero-friction
   - **Token:** SOL or USDC
6. Save. The tag now sits in the Paired NFC devices list.

### Demo flow

1. Home → **Tap to Pay** (the big primary button).
2. The full-screen tap UI appears with pulsing radio waves: *"Hold near tag."*
3. Tap the wristband to the back of the phone.
4. The app recognizes the UID, shows the matched label briefly, then routes straight to the confirm sheet with the preset amount + recipient.
5. Biometric prompt fires (or skips silently on devices without enrollment).
6. 3-second cancel countdown.
7. Broadcast → green check on sender. Receiver app (or wallet on a second device) shows balance bumped.

### What to say while demoing

> *"Two phones tap. The amount appears. Biometric confirms. One second, $0.0001 fee, real on-chain settlement on Solana devnet."*

You don't need to explain the wristband. Just tap it.

If a judge asks how the receiver phone broadcasts its address — that's Host Card Emulation, and it's the v1.5 milestone. The protocol layer above NFC (Solana Pay URL spec, reference key, biometric, broadcast) is identical whether the URL comes from HCE on a phone or a paired tag in the registry.

### NFC tag compatibility

Works with anything that exposes a stable UID over ISO 14443A (which is virtually every consumer NFC token):
- ✅ NTAG21x stickers/wristbands (most common)
- ✅ MIFARE Classic / Ultralight (transit cards, hotel keys)
- ✅ ISO-DEP cards (some bank cards expose a UID; some don't)
- ⚠️ Bank credit cards with PayPass/PayWave often randomize the UID per session — won't work
- ❌ FeliCa-only tags (Japan transit) — would need a separate tech filter

If a tag taps and shows "Unknown tag" with a UID, that means we read it correctly but it's not paired yet. Tap "Pair this tag" to register it on the spot.

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

**Build fails with `IBM_SEMERU` not found**
Gradle 9 incompatibility with Kotlin Gradle Plugin 2.1.20. Confirm `android/gradle/wrapper/gradle-wrapper.properties` says `gradle-8.13-bin.zip`. Don't re-run `expo prebuild --clean` — it'll reset this.

**Build fails with "compileSdk needs 36"**
Confirm `android/gradle.properties` has `android.compileSdkVersion=36`.

**Build fails with `SDK location not found`**
Confirm `android/local.properties` exists and has `sdk.dir=...` pointing at your Android SDK.

**`crypto.getRandomValues must be defined` at runtime**
The `react-native-get-random-values` polyfill needs to be linked. If you see this after re-installing, do `npm install react-native-get-random-values --legacy-peer-deps` and rebuild. The import is the first line of `src/lib/polyfills.ts`.

**"NFC is not enabled" on Tap screen**
The phone has NFC but it's turned off. Settings → Connected devices → NFC.

**Camera permission denied**
First Scan action prompts for camera. If denied: phone Settings → Apps → TapPay → Permissions → Camera → Allow.

**Devnet airdrop returns 429**
You've hit the rate limit. Wait 10 min, or use https://faucet.solana.com (more generous), or switch RPC by editing `.env`:
```
EXPO_PUBLIC_RPC_URL=https://api.devnet.solana.com
```
to a Helius/QuickNode devnet endpoint.

**MWA bridge says "no wallet found"**
On a regular Android device, install Phantom or Backpack. On Seeker, Seed Vault is preinstalled — if MWA still can't find it, restart the phone.

**Two emulators can't share clipboard**
Use [scrcpy](https://github.com/Genymobile/scrcpy) or pull/push the clipboard via `adb shell`. Or use Path C (one emulator + one real phone) instead.

**NFC tap on emulator fails with "Unknown tag"**
The emulator simulates a UID on tap. Pair that mock UID in Settings first (Path A step 5), or run on a real device (Path F).

---

## 4 · Pre-demo smoke test (run this 30 min before going live)

The TypeScript and Metro bundle validate at build time, but a **real device run is the only way to catch runtime issues.** Do this once before you stand in front of judges:

1. Build and install via `npx expo run:android --device <serial>`.
2. **Home screen loads** with a balance card (may say `—` until airdrop completes — wait 20 s or hit Settings → Request devnet airdrop).
3. **Settings → Connect Mobile Wallet Adapter** — confirm the address line on Home flips to `· MWA`.
4. **Settings → Paired NFC devices → Pair a new tag** — tap your demo tag, fill recipient + amount, Save.
5. Home → **Tap to Pay** → tap your demo tag → confirm sheet should auto-open with the preset amount and recipient.
6. **Cancel the confirm sheet** (don't broadcast yet — you want the live tx for the demo, not pre-fired).
7. Tap **Receive** → `0.01` → **Show payment code** — QR renders, "Listening for payment…" pulse appears.
8. Re-do the Tap to Pay, this time let the 3-second countdown elapse and broadcast.
9. **Activity → tap the latest tx → View on explorer** — the Solana Explorer URL should open and show Confirmed.

If any step fails, fix it before demo day. Common failures and fixes are in §3.

---

## 5 · Demo script (cheat sheet)

For when you're up there with 30 seconds to land it:

1. Phone in hand: *"This is TapPay. Tap-to-pay stablecoins on Solana."*
2. *"Watch."*
3. Tap **Tap to Pay**. Tap the demo tag.
4. Confirm sheet pops with the merchant + amount. Biometric. 3-2-1.
5. ✅ flashes green.
6. *"$24.50. One second. Zero fees to either of us. Works in any country, on any weekend, no bank required."*
7. *(Optional)* Show **Activity → View on explorer** — the tx is live on Solana devnet.
8. Drop the mic.

### Backup if NFC misbehaves on stage

- Have a **QR fallback** ready: another phone or laptop showing a Solana Pay QR. Pivot: *"Same payment, scan instead of tap."*
- Tap **Scan** → camera at QR → biometric → ✅. Story is the same.
