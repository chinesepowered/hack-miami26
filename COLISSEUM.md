# TapPay — Colosseum Submission

## 1️⃣ What are you building, and who is it for?

**TapPay is the fastest way to send dollars on a phone.** Two phones come close, the amount appears, a glance, a thumbprint, a glow — done. One tap, ~1 second, settled on Solana. No banks, no addresses, no popups.

📡 **Tap to pay over NFC** — bring two phones together, biometric confirms, settles in ~400 ms
📷 **QR fallback** — universal compatibility with every Solana Pay-enabled wallet on day one
🔐 **Hardware-grade signing** — Seed Vault on Seeker, secure enclave elsewhere
🛡️ **Spend caps + 3-second cancel window** — fat-finger sends can be undone before broadcast
🆕 **First-time-payee warning** — protects against the spoofing attacks crypto natives know too well

**Who it's for:**

- 👥 **Consumers** splitting dinner, paying freelancers, sending money home — without SWIFT, Wise, or a 4-day wait. The "Cash App for stablecoins" that actually feels like Cash App.
- 🏪 **Merchants** drowning in Square's 2.6% + $0.10 + $300 hardware. TapPay charges **0.5%** with **no terminal**. Settles weekends, no chargebacks, dashboard runs on the same phone.
- 🌍 **The 1.4 billion unbanked adults** globally — 90% of whom have a smartphone. A checking account with a tap-to-pay interface that doesn't require a checking account.
- 💸 **Anyone in Argentina, Nigeria, Turkey, Lebanon, the Philippines** already holding USDC because their local currency is melting. They have the dollars. They need a way to spend them.

Built natively on Solana Mobile — Mobile Wallet Adapter for hardware-backed signing, Solana Pay URL spec for the payload (so every TapPay request also works with Phantom, Backpack, Solflare on day one).

---

## 2️⃣ Why did you decide to build this, and why build it now?

**Because stablecoins move $30 trillion a year — more than Visa — and spending them on a phone is still broken.** 📋 Open a wallet, paste a 44-character address, enter an amount, confirm a popup, wait. 30 seconds, four screens, one typo from a permanent loss. The rails are world-class. The interface hasn't caught up.

**Three forces converged right now, and the window is wide open:**

🚀 **1. Stablecoin payments are the fastest-growing segment in fintech.**
Stripe paid **$1.1B for Bridge** specifically to get here. Visa, Mastercard, and PayPal are scrambling to integrate USDC. The on-ramp problem is solved — but the spending experience is still 2015.

⚡ **2. Solana's economics finally make true micropayments viable.**
Sub-cent fees and sub-second finality. A $2 coffee charge that costs $0.0001 to settle is no longer a thought experiment. For the first time, a contactless payment on-chain is *cheaper* than a swipe.

📲 **3. Mobile-first crypto hardware exists.**
Seeker shipped 150K+ units with **Seed Vault** silicon — the first phone where a wallet feels like a contactless card instead of a finicky app. The hardware is here. The consumer app for it isn't. Whoever ships it first owns the on-ramp to a generation of users who will never paste an address again.

**The personal why:** I've shipped mobile apps with **100,000+ downloads** and a prior hackathon project doing **4 million mainnet transactions per month**. The stuff I build doesn't stay demos — it becomes live infrastructure. Solana Mobile gave us the hardware, the wallet protocol, and the payment spec. What's missing is the *product* — the thing your non-crypto friend would actually download. That's TapPay.

> *Solana Pay made stablecoin payments **possible**. Wallets made them **technically usable**. TapPay makes them **the obvious choice** — one tap, one second, one app your friends already have.* 💚

**Tap. Done. That's it.**
