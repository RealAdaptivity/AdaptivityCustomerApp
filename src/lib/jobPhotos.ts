import { supabase } from './supabase';

export type JobPhotoKind = 'before' | 'after' | 'dvi' | 'other';

export type JobPhoto = {
  id: string;
  bookingId: string;
  storagePath: string;
  kind: string;
  caption: string | null;
  createdAt: string;
  publicUrl: string;
};

function publicUrlFor(path: string): string {
  const { data } = supabase.storage.from('job-photos').getPublicUrl(path);
  return data.publicUrl;
}

/** List photos when authenticated as customer (RLS). Reference-only guests get []. */
export async function fetchJobPhotosForTrackedBooking(
  referenceCode: string
): Promise<JobPhoto[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id')
    .eq('reference_code', referenceCode.trim())
    .maybeSingle();
  if (bErr || !booking?.id) return [];

  const { data, error } = await supabase
    .from('booking_job_photos')
    .select('id, booking_id, storage_path, kind, caption, created_at')
    .eq('booking_id', booking.id)
    .order('created_at', { ascending: true });
  if (error) return [];

  return (data || []).map((row) => ({
    id: row.id as string,
    bookingId: row.booking_id as string,
    storagePath: row.storage_path as string,
    kind: row.kind as string,
    caption: (row.caption as string | null) ?? null,
    createdAt: row.created_at as string,
    publicUrl: publicUrlFor(row.storage_path as string),
  }));
}

/** Customer "before" photo upload (RLS allows when UNASSIGNED / EN_ROUTE). */
export async function uploadJobPhotoUri(opts: {
  bookingId: string;
  uri: string;
  mimeType?: string;
  fileName?: string;
  kind?: JobPhotoKind;
  caption?: string;
}): Promise<JobPhoto> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required to upload photos');

  const ext =
    opts.fileName?.split('.').pop()?.toLowerCase() ||
    (opts.mimeType?.includes('png') ? 'png' : 'jpg');
  const path = `${opts.bookingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const response = await fetch(opts.uri);
  const blob = await response.blob();

  const { error: upErr } = await supabase.storage.from('job-photos').upload(path, blob, {
    contentType: opts.mimeType || blob.type || 'image/jpeg',
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data: row, error: insErr } = await supabase
    .from('booking_job_photos')
    .insert({
      booking_id: opts.bookingId,
      uploaded_by: user.id,
      storage_path: path,
      kind: opts.kind || 'before',
      caption: opts.caption?.trim() || null,
    })
    .select('id, booking_id, storage_path, kind, caption, created_at')
    .single();
  if (insErr) throw insErr;

  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    storagePath: row.storage_path as string,
    kind: row.kind as string,
    caption: (row.caption as string | null) ?? null,
    createdAt: row.created_at as string,
    publicUrl: publicUrlFor(row.storage_path as string),
  };
}
