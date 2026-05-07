# TapPay — Hackathon Pitch Deck

5 slides. ~2 min pitch + video demo + close. Each slide has the headline (big text), body (terse bullets), visual suggestion, and speaker notes.

Suggested color palette to match the app:
- Background: deep navy `#070912`
- Primary accent (TapPay green): `#34D399`
- Secondary accent (violet): `#A78BFA`
- Warning amber: `#FFC857`
- Text: white `#FFFFFF` and a muted gray `#9DA9C8`

Font pairing: **Space Grotesk** (headers) + **Inter** (body) — clean, modern, crypto-native feel. Or all-Inter if you want simpler.

---

## Slide 1 — Title

**Headline:** TapPay

**Subhead:** The fastest way to send dollars on a phone.

**Tagline (small, bottom):** Tap. Done. · Built on Solana Mobile

**Visual:** Phone with the TapPay home screen mockup or a clean lockup of the wordmark. NFC waves emanating from a phone icon. Dark navy background, green NFC waves (use brand `#34D399`).

**Speaker notes:**
> Hi, I'm Nelson. This is TapPay — the fastest way to send dollars on a phone. Tap once, settles in a second, no bank required.

---

## Slide 2 — The Problem

**Headline:** Stablecoins move $30T a year. Spending them is broken.

**Body:**
- 📋 Open wallet → paste 44-char address → enter amount → confirm popup → wait
- 30 seconds. Four screens. One typo from a permanent loss.
- Solana Pay is a *protocol*. There's no Cash App for stablecoins.
- Merchants pay Square 2.6% + $0.10 + $300 hardware. There's no alternative.

**Visual:** Side-by-side. Left: a frustrated user with stacked wallet popup screens. Right: a Square POS terminal with dollar bills flying out (representing fees). Or: a single huge "$30T" with broken/glitchy wallet UI fragments around it.

**Speaker notes:**
> Stablecoins now move more money each year than Visa. Real money, real adoption — Argentina, Nigeria, the Philippines, freelancers across LATAM. But the way you actually use them on a phone is broken. Paste a 44-character address, enter an amount, confirm a popup. 30 seconds, four screens, one typo from a permanent loss. The rails are world-class. The interface hasn't caught up.

---

## Slide 3 — The Solution

**Headline:** Two phones come close. Done.

**Body:** *(this slide is mostly visual)*
- 📡 **Tap** — NFC pairs the receiver, Solana Pay URL exchanged at the protocol layer
- 🔐 **Sign** — biometric → Mobile Wallet Adapter → Seed Vault hardware-backs the signature
- ⚡ **Settle** — Solana confirms in ~400 ms, receiver's screen flips to ✓ via reference key

**Visual:** The big diagram from the README — two phones with `→ NFC ←` between them, "$24.50" on one, "✓ Received" on the other. Caption underneath: "~1 second total." Use the brand-green for the checkmark. Below the diagram, three small icons left-to-right (📡 → 🔐 → ⚡) corresponding to the three bullets above.

**Speaker notes:**
> TapPay is the interface. Two phones come close. The amount appears. A glance, a thumbprint, a glow. Done. Built natively on Solana Mobile — NFC reader for tap, Mobile Wallet Adapter for hardware-backed signing, Solana Pay for the payload. One second total, including on-chain settlement. And because we use the Solana Pay URL spec, every TapPay request also works with Phantom, Backpack, and every other Solana wallet on day one.

---

## Slide 4 — Demo

**Headline:** *(leave blank or minimal — video carries the slide)*

**Body:** *(intentionally empty — drop in video)*

**Visual:** **Embed your demo video here.** Full-bleed, fills the slide. Mute the slide background, let the video do the work.

**Speaker notes:**
> *(While video plays, narrate over it):* This is real, on Solana devnet. Watch — tap, fingerprint, three-second cancel window, broadcast. Receiver confirms. End to end, about a second. Real on-chain transaction, verifiable on Solana Explorer.

**If video glitches:** have the live phone in hand as backup — you can do the actual demo on stage. Same effect.

---

## Slide 5 — Team

**Headline:** Pick me. I ship.

**Subhead:** Nelson · Software Engineer

**Body:**

📱 **Built mobile apps with 100,000+ downloads.**
Real users, real production scale, real App Store track record.

⛓️ **Last hackathon project: 4 million mainnet transactions per month.**
Past wins didn't stay demos. They became live infrastructure on chain.

🚀 **TapPay won't either.**
If you back this, you're backing distribution. Solana Mobile gets a consumer app that drives real usage onto Seeker — the same way I've driven real usage onto every chain I've shipped on.

**Visual:** Headshot (or just a clean monogram if no headshot) on the left. Three big numbers on the right, stacked:
- **100K+** downloads on prior apps
- **4M / month** mainnet transactions on prior hackathon project
- **TapPay** ← next

Use the brand green for the numbers. Keep the "← next" subtle but readable.

**Speaker notes:**
> One last thing. I'm Nelson — I build mobile apps. My past apps have over a hundred thousand downloads. My last hackathon project is doing four million mainnet transactions a month, in production. The stuff I build doesn't stay demos — it becomes live infrastructure. So if you pick TapPay, you're not picking a deck. You're picking distribution. Solana Mobile gets a consumer app that drives real usage onto Seeker, the same way every other chain I've shipped on has gotten real usage. Thank you.

---

# Getting it into Canva fast

1. Open Canva → search **"Pitch Deck Tech"** or **"Startup Investor Deck"** → pick a dark-themed template.
2. **If your account has Magic Switch / Docs-to-Deck**: paste this entire markdown file into a new Canva Doc → hit "Convert to deck." It'll auto-structure the slides from the headers. Then refine visuals.
3. **Otherwise, manual paste** — for each slide, drop the headline in the title area, body in content. ~20 minutes start to finish for 5 slides.
4. Useful Canva icon searches: `nfc`, `tap`, `fingerprint`, `solana`, `usdc`, `lightning`, `phone tap`, `wallet`.
5. Time check during rehearsal: 20–30 sec on slides 1, 2, 3, 5. Slide 4 is video duration. Total target: ~3 min.

# Pitch sequencing tips

- **Open with the punchline**: "fastest way to send dollars on a phone." Don't bury the lede.
- **Slide 4 is the moment**. The video should be tight (under 60 sec, ideally 30–45). End on the green ✓ and the explorer link.
- **Slide 5 is the close.** The "I ship" line is the conviction-buy. Lean into the numbers — they're concrete, defensible, and rare for a hackathon team.
- **Skip "Why now" / "Roadmap"** in this version — for a 3-min pitch, conviction beats comprehensiveness. Save those for Q&A if asked.
