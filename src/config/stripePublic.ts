/** Stripe publishable key — must match Supabase STRIPE_SECRET_KEY mode (test/live). */
const fromEnv = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || '';

export const STRIPE_PUBLISHABLE_KEY = fromEnv;

export const STRIPE_KEY_MODE: 'live' | 'test' | 'missing' = fromEnv.startsWith('pk_live_')
  ? 'live'
  : fromEnv.startsWith('pk_test_')
    ? 'test'
    : 'missing';

if (STRIPE_KEY_MODE === 'missing') {
  console.warn(
    '[Stripe] Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env (sync from adaptivity-performance).'
  );
}
