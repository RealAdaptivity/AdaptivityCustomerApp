import { supabase } from './supabase';

export async function ensureReferralCode(): Promise<string> {
  const { data, error } = await supabase.rpc('ensure_referral_code');
  if (error) throw error;
  if (!data || typeof data !== 'string') throw new Error('Could not create referral code');
  return data;
}

export async function getCreditBalance(): Promise<number> {
  const { data, error } = await supabase.rpc('customer_credit_balance_cents');
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}

export function applyReferralCodeOnBooking(code?: string | null): {
  referralCode?: string;
} {
  const trimmed = code?.trim().toUpperCase();
  if (!trimmed) return {};
  return { referralCode: trimmed };
}
