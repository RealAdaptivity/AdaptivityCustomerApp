# Adaptivity Customer Portal (Expo)

Native customer app for booking ($100 diagnostic hold), garage, job tracking, and receipts. Final repair price is set by the tech on site.

## Stack

- Expo SDK 57 / React Native
- Supabase Auth
- Stripe React Native (card hold)
- EAS Build / Submit (`owner`: `adaptivityperformance`, slug: `adaptivity-customer-app`)

## Setup

```bash
npm install
# From adaptivity-performance:
node scripts/sync-expo-env.mjs
npm start
```

Copy `.env.example` → `.env` if you are not using the sync script. Never commit `.env`.

## GitHub

```text
https://github.com/RealAdaptivity/AdaptivityCustomerApp
```

## EAS

Project ID is in `app.json` → `extra.eas.projectId`. `app.config.js` injects `EXPO_PUBLIC_*` into `extra` for builds.

```bash
npx eas whoami
npx eas build --profile preview --platform ios
npx eas build --profile production --platform ios
npx eas submit --profile production --platform ios
```

Set EAS secrets for cloud builds:

```bash
npx eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://qqyairzymqpkbfxobztx.supabase.co" --scope project
npx eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "…" --scope project
npx eas secret:create --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_…" --scope project
```

Keep Stripe publishable mode aligned with Supabase Edge `STRIPE_SECRET_KEY` (both test or both live).
