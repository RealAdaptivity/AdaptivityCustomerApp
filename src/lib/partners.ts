import { supabase } from './supabase';

export type PartnerLocation = {
  id: string;
  businessName: string;
  contactName: string | null;
  contactPhone: string | null;
  address: string;
  city: string | null;
  zipCode: string | null;
  hasLift: boolean;
  bayCount: number | null;
  hoursNote: string | null;
  isAdaptivityOwned: boolean;
};

function mapPartner(row: Record<string, unknown>): PartnerLocation {
  return {
    id: row.id as string,
    businessName: row.business_name as string,
    contactName: (row.contact_name as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    address: row.address as string,
    city: (row.city as string | null) ?? null,
    zipCode: (row.zip_code as string | null) ?? null,
    hasLift: Boolean(row.has_lift),
    bayCount: (row.bay_count as number | null) ?? null,
    hoursNote: (row.hours_note as string | null) ?? null,
    isAdaptivityOwned: Boolean(row.is_adaptivity_owned),
  };
}

/** Approved partner shops / garages that can host jobs. */
export async function fetchApprovedPartners(): Promise<PartnerLocation[]> {
  const { data, error } = await supabase
    .from('partner_locations')
    .select(
      'id, business_name, contact_name, contact_phone, address, city, zip_code, has_lift, bay_count, hours_note, is_adaptivity_owned'
    )
    .eq('status', 'approved')
    .eq('host_jobs', true)
    .order('is_adaptivity_owned', { ascending: false })
    .order('business_name', { ascending: true });

  if (error) throw error;
  return (data || []).map((row) => mapPartner(row as Record<string, unknown>));
}
