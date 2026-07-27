import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

async function edgeErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body?.error) return body.error;
    } catch {
      /* ignore */
    }
  }
  return error instanceof Error ? error.message : fallback;
}

export type BookingHoldResult = {
  bookingReference: string;
  bookingId: string;
  clientSecret: string;
  paymentIntentId: string;
  holdAmountDollars: number;
  message: string;
};

export async function createBookingWithCardHold(input: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  zipCode: string;
  vehicleDescription: string;
  services: string[];
  holdAmountDollars: number;
  customerEmail?: string;
}): Promise<BookingHoldResult> {
  const { data, error } = await supabase.functions.invoke('create-booking-with-hold', {
    body: { ...input, locationType: 'mobile' },
  });
  if (error) throw new Error(await edgeErrorMessage(error, 'Failed to start booking'));
  if (data?.error) throw new Error(String(data.error));
  if (!data?.clientSecret) throw new Error('Missing payment authorization from server');
  return data as BookingHoldResult;
}
