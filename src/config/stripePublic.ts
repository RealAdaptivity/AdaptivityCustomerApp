/** Stripe publishable key (test or live) — must match Supabase STRIPE_SECRET_KEY account */
export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
  'pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY';
