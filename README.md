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

## Google Play (Android)

Package: `com.adaptivityperformance.customer`

Privacy policy (store listing): https://adaptivityperformance.com/privacy

### First-time Play Console (manual)

1. Sign up: https://play.google.com/apps/publish/signup/ (~$25 once).
2. **Create app** → name **Adaptivity Customer Portal** → App → Free.
3. Complete **Internal testing** setup (tester email list including yourself).
4. Build AAB (below), download it, then **Internal testing → Create release → Upload AAB**.
   Use **Google-managed Play App Signing**. First upload must be manual ([expo.fyi](https://expo.fyi/first-android-submission)).

### Service account (for later `eas submit`)

1. Google Cloud → create service account → JSON key (same key can be shared with the tech app).
2. Enable **Google Play Android Developer API**.
3. Play Console → Users and permissions → invite the service account email; grant access to **both** apps.
4. Save the real key as `google-play-service-account.json` in this repo root (gitignored). See `google-play-service-account.example.json`.

```bash
npx eas whoami
npx eas build --profile preview --platform ios
npx eas build --profile production --platform ios
npx eas build --profile production --platform android
npx eas submit --profile production --platform ios
npx eas submit --profile production --platform android --latest
```

Set EAS env (already configured for production/preview on this project via `eas env:create`):

```bash
npx eas env:list --environment production
```

Keep Stripe publishable mode aligned with Supabase Edge `STRIPE_SECRET_KEY` (both test or both live).
