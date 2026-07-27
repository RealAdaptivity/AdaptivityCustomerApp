import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/supabasePublic';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function signInCustomer(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpCustomer(email: string, password: string, fullName: string, phone?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: 'customer', full_name: fullName, phone },
    },
  });
}

export async function createServiceBooking(input: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  zipCode: string;
  vehicleDescription: string;
  services: string[];
  totalEstimate: number;
  customerId?: string | null;
}) {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: input.customerId ?? null,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_address: input.customerAddress,
      zip_code: input.zipCode,
      vehicle_description: input.vehicleDescription,
      services: input.services,
      total_estimate: input.totalEstimate,
      location_type: 'mobile',
      reference_code: '',
    })
    .select('reference_code')
    .single();
  if (error) throw error;
  return data.reference_code as string;
}

export type VehicleRow = {
  id: string;
  year: string | null;
  make: string;
  model: string;
  trim: string | null;
  vin: string | null;
  license_plate: string | null;
  mileage: string | null;
  health_status: 'good' | 'warning' | 'urgent' | null;
  health_label: string | null;
};

export async function fetchMyVehicles(userId: string): Promise<VehicleRow[]> {
  const { data, error } = await supabase.from('vehicles').select('*').eq('owner_id', userId);
  if (error) throw error;
  return (data || []) as VehicleRow[];
}

export async function upsertVehicle(userId: string, vehicle: Omit<VehicleRow, 'id'> & { id?: string }) {
  const payload = {
    owner_id: userId,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    vin: vehicle.vin,
    license_plate: vehicle.license_plate,
    mileage: vehicle.mileage,
    health_status: vehicle.health_status,
    health_label: vehicle.health_label,
  };
  if (vehicle.id) {
    const { error } = await supabase.from('vehicles').update(payload).eq('id', vehicle.id);
    if (error) throw error;
    return vehicle.id;
  }
  const { data, error } = await supabase.from('vehicles').insert(payload).select('id').single();
  if (error) throw error;
  return data.id as string;
}

export async function fetchMyBookings(userId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
