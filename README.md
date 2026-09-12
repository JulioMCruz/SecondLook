# SecondLook

Personal hackathon product for Burning Token (NERDCONF). Paste a market claim, keep the receipt.

Not affiliated with other products. UI copy is English.

## What it does

1. Sign in (email code or **Try with demo**).
2. First look: Linkup search 1, findings saved.
3. Paywall: RevenueCat Test Store entitlement `second_look`.
4. Second look: Linkup follow-up on the gap + Nebius Token Factory brief.
5. Brief stays in the account. Copy / print PDF. Time and token cost shown.

Tracks: Linkup · Nebius · RevenueCat.

## Run

```bash
cd /Users/zknexus/Projects/Hackathons/Burning-Token-26/secondlook
cp .env.example .env.local
# fill LINKUP_API_KEY, NEBIUS_API_KEY, NEXT_PUBLIC_REVENUECAT_TEST_STORE_API_KEY, AUTH_SECRET
npm run dev
```

Open http://localhost:3000

Demo login: `/login` → Try with demo.

## Env

See `.env.example`. Never put PerkOS Stripe keys in this repo.

## Test purchase

Create a new RevenueCat project (personal). Use **Test Store** API key. Entitlement id: `second_look`.

Fail path: **Simulate fail** keeps nodes 03–05 locked.
