# 📲 TapPay

**The fastest way to send dollars on a phone — tap once, settle in a second, no bank required.**

A consumer-grade tap-to-pay app for Solana Mobile, built around the one moment crypto has always been bad at: actually paying someone.

<p align="center">
  <a href="https://www.youtube.com/watch?v=c5a9eZJ0JIs">
    <img src="https://img.youtube.com/vi/c5a9eZJ0JIs/maxresdefault.jpg" alt="Watch the TapPay demo" width="640">
  </a>
</p>
<p align="center">
  <a href="https://www.youtube.com/watch?v=c5a9eZJ0JIs"><b>▶ Watch the demo</b></a>
</p>

---

## 🌍 Why this matters

Stablecoins now move **over $30 trillion a year** — more than Visa. They're already how millions of people in Argentina, Nigeria, Turkey, Lebanon, and the Philippines hold real money. They're how freelancers across LATAM and Southeast Asia get paid. They're how families send remittances without losing 7% to Western Union.

But the way you actually *use* them on a phone today is broken:

- 📋 Open a wallet → paste a 44-character address → enter an amount → confirm a popup → wait for finality. **30 seconds, four screens, one wrong-character mistake away from a permanent loss.**
- 🔳 Solana Pay exists, but it's a protocol — not a product. There's no "Cash App" of stablecoins. No social layer. No tap.
- 🏪 For merchants, the alternative is Square at **2.6% + $0.10** plus **$300 hardware**. Crypto could undercut this by an order of magnitude — but only if the customer experience stops being a deal-breaker.

The rails are world-class. The interface hasn't caught up. **TapPay is the interface.**

---

## ✨ What it does

Two phones come close. The amount appears. A glance, a thumbprint, a glow. Done.

```
┌──────────────────┐         ┌──────────────────┐
│   📱 Customer    │         │   📱 Merchant    │
│                  │         │                  │
│   Tap to pay  →  │ ←  NFC  │  $24.50  ←──────│
│                  │         │  ✓ Received     │
└──────────────────┘         └──────────────────┘
                  ~1 second total
```

- 📡 **Tap to pay over NFC** — bring two phones together, the recipient + amount appear, biometric confirms, settles on Solana in ~400 ms. No address typing, no wallet popups, no chain selection.
- 📷 **QR fallback** — universal compatibility with every Solana Pay-enabled wallet on the planet, so customers without TapPay can still pay
- 🔐 **Hardware-grade signing** — on Seeker, the **Seed Vault** holds the key in silicon. Biometric replaces the popup-spam approval flow that makes today's wallets feel like 2015
- 🛡️ **Spend caps with a real safety net** — per-tap max, daily max, hardware-enforced "passwordless under $X." Even a stolen phone within the cap window stays bounded
- ⏪ **3-second cancel window** — even though Solana finalizes in 400 ms, the *app* holds the signed transaction for 3 seconds with a giant "Cancel" button. Fat-finger sends can be undone before broadcast — something Venmo doesn't even offer
- 🆕 **First-time-payee warning** — if you've never paid this address before, the confirmation screen surfaces it. Prevents the spoofing attacks crypto natives know all too well
- 📒 **Activity feed** — receipts with explorer links, memos, contacts you've paid before. Built like Cash App, not like a block explorer
- 🌐 **Works in any country** — no banks, no borders, no business-hour delays. Stablecoins settle on weekends and holidays, in places where Venmo, Zelle, and Wise don't

---

## 🧠 Why now

Three forces converged:

1. **Stablecoin payments are the fastest-growing segment in fintech.** Stripe paid $1.1B for Bridge specifically to get here. Visa, Mastercard, and PayPal are scrambling to integrate USDC. The on-ramp problem is solved.
2. **Solana's economics finally work.** Sub-cent fees and sub-second finality make true micropayments viable. A $2 coffee charge that costs $0.0001 to settle is no longer a thought experiment.
3. **Mobile-first crypto hardware exists.** Seeker shipped 150K+ units with **Seed Vault** silicon — the first phone where a wallet feels like a contactless card instead of a finicky app. The hardware is here. The app for it isn't.

TapPay is the consumer-facing app that turns these three rails into something a non-crypto user would actually download.

---

## 🪄 Why people will use it

**For consumers**
- Splitting dinner with a friend who also has it? One tap.
- Paying a freelancer overseas? No SWIFT, no Wise, no 4-day wait.
- Live in a country where the local currency is melting? You already hold USDC. Now you can spend it.

**For merchants**
- A coffee shop pays Square 2.6% + $0.10 + $300 for the terminal. TapPay charges **0.5%** with **no hardware**.
- Every transaction settles in under a second, on weekends, with no chargebacks (a feature, not a bug, for many merchants).
- The merchant dashboard works on the same phone — no separate POS terminal.

**For the unbanked**
- 1.4 billion adults globally don't have a bank account, but 90% of them have a smartphone. TapPay is a checking account with a tap-to-pay interface that doesn't require a checking account.

---

## 🏗️ How it's built

Built natively for the Solana Mobile stack:

| Layer | Tech |
|---|---|
| Mobile | Expo SDK 55 · React Native 0.83 · TypeScript · expo-router |
| Wallet | `@solana-mobile/mobile-wallet-adapter-protocol-web3js` (real device) · local devnet keypair (emulator) |
| Chain | `@solana/web3.js` · `@solana/spl-token` · Solana Pay URL spec |
| Pairing | NFC reader mode (`react-native-nfc-manager`) · paired-device registry mapping NFC UIDs to Solana Pay endpoints · camera QR (universal Solana Pay fallback) |
| Security | Seed Vault via MWA · biometric via `expo-local-authentication` · 3-second pre-broadcast cancel window · spend caps |
| UI | NativeWind 4 · Reanimated 3 motion · haptic-synced confirmation |

### How a tap actually works

1. **Sender** opens TapPay and hits **Tap to Pay**. The phone enters NFC reader mode.
2. **Receiver** is identified by the NFC handshake — a cryptographic device ID resolves to a Solana wallet address and (optional) preset amount.
3. The sender's app builds a **Solana Pay URL** with a unique reference key, constructs the SPL transfer instruction, and attaches the reference as a non-signer account so the receiver can subscribe to confirmation logs.
4. **Biometric** confirms (Seed Vault on Seeker, secure enclave elsewhere). The signed tx sits in a 3-second cancel window before it broadcasts.
5. The receiver's app sees the reference key in the chain logs within ~400 ms and flips to "✓ Received" — no polling, no hot reload, just a WebSocket subscription on the reference.

Every transaction uses the **Solana Pay URL spec**, so a TapPay request also works with Phantom, Backpack, Solflare, and every other Solana wallet on day one. Network effects start immediately — every TapPay user widens the merchant network for everyone else.

---

## 🛣️ What's next

The shipping product is the wedge. The roadmap is the moat:

- 📡 **Bidirectional NFC over HCE** — Seeker's Host Card Emulation lets the receiver phone broadcast its Solana Pay URL natively, removing the need for any pairing step at all
- 🪪 **`.skr` / `.sol` usernames** — pay friends by name, not by address
- 👥 **Group vaults** — Splitwise that actually settles. Hardware multisig where each member's key never leaves their Seed Vault
- 🤖 **Autopilot** — voice command: "DCA $25 of SOL every Friday." Runs on a Seed Vault delegated session key with hardware-enforced caps
- 🌎 **Local fiat ramps** — partner with Bridge / MoonPay so first-timers can fund TapPay from a local debit card in 3 taps
- 🧾 **Merchant tools** — invoicing, refunds, multi-staff, daily settlement reports. The Square layer everyone keeps trying to build on Solana Pay but never finishes

---

## 💚 The pitch in one line

> *Solana Pay made stablecoin payments **possible**. Wallets made them **technically usable**. TapPay makes them **the obvious choice** — one tap, one second, one app your friends already have.*

Tap. Done. That's it.

---

## 📲 Try it

Sideload the latest devnet build on any Android phone:

[**Download TapPay APK**](https://expo.dev/accounts/clai74/projects/tappay/builds/92652316-8319-4393-9812-cfbc0f607d22)

Open the link on the phone, download the APK, accept "install from unknown source" if prompted, and the app launches. Devnet only — no real funds at risk. NFC tap-to-pay, QR scan, and Solana Pay deep links all work out of the box.
