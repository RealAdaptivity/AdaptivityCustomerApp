import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import {
  addBookingTip,
  cancelCustomerBooking,
  fetchBookingByReference,
  rescheduleCustomerBooking,
  subscribeBookingReference,
  type TrackedBooking,
} from '../lib/trackBooking';
import { fetchJobPhotosForTrackedBooking, uploadJobPhotoUri, type JobPhoto } from '../lib/jobPhotos';
import {
  formatPreferredSchedule,
  PREFERRED_TIME_WINDOWS,
  todayISODate,
} from '../lib/scheduleWindows';
import { GOOGLE_REVIEW_URL } from '../lib/reviews';
import * as ImagePicker from 'expo-image-picker';
import { etaMinutesFromGps, formatLiveEta } from '../lib/liveEta';
import {
  fetchJobMessages,
  sendJobMessage,
  subscribeJobMessages,
  type JobMessage,
} from '../lib/jobChat';
import { addFavoriteTech } from '../lib/customerExtras';
import { supabase } from '../lib/supabase';

const STATUS_LABEL: Record<string, string> = {
  UNASSIGNED: 'Finding your technician',
  EN_ROUTE: 'Technician en route',
  ON_SITE: 'Technician on site',
  COMPLETED: 'Job completed',
  CANCELED: 'Booking canceled',
};

function dollars(cents: number | null | undefined) {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

export const TrackJobScreen: React.FC = () => {
  const [reference, setReference] = useState('');
  const [trackedRef, setTrackedRef] = useState<string | null>(null);
  const [booking, setBooking] = useState<TrackedBooking | null>(null);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [customTip, setCustomTip] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(todayISODate());
  const [rescheduleWindow, setRescheduleWindow] = useState<string>(PREFERRED_TIME_WINDOWS[0]);
  const [userId, setUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<JobMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
  }, []);

  const load = useCallback(async (ref: string) => {
    setLoading(true);
    setError(null);
    try {
      const row = await fetchBookingByReference(ref);
      if (!row) {
        setError('No booking found for that reference.');
        setBooking(null);
        setPhotos([]);
      } else {
        setBooking(row);
        const pics = await fetchJobPhotosForTrackedBooking(ref);
        setPhotos(pics);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!trackedRef) return;
    void load(trackedRef);
    const channel = subscribeBookingReference(trackedRef, () => {
      void load(trackedRef);
    });
    return () => {
      channel.unsubscribe();
    };
  }, [trackedRef, load]);

  const chatActive =
    Boolean(booking?.id) &&
    Boolean(userId) &&
    booking?.status !== 'COMPLETED' &&
    booking?.status !== 'CANCELED';

  useEffect(() => {
    if (!chatActive || !booking?.id) {
      setChatMessages([]);
      return;
    }
    const bookingId = booking.id;
    const loadChat = async () => {
      try {
        setChatMessages(await fetchJobMessages(bookingId));
      } catch {
        /* optional table */
      }
    };
    void loadChat();
    const channel = subscribeJobMessages(bookingId, () => void loadChat());
    return () => {
      channel.unsubscribe();
    };
  }, [chatActive, booking?.id]);

  const handleSendChat = async () => {
    if (!booking?.id || !chatDraft.trim()) return;
    setChatBusy(true);
    try {
      await sendJobMessage(booking.id, chatDraft);
      setChatDraft('');
      setChatMessages(await fetchJobMessages(booking.id));
    } catch (e: unknown) {
      Alert.alert('Chat', e instanceof Error ? e.message : 'Could not send');
    } finally {
      setChatBusy(false);
    }
  };

  const handleSaveTech = async () => {
    if (!booking?.mechanicId) return;
    setFavBusy(true);
    try {
      await addFavoriteTech(booking.mechanicId);
      Alert.alert('Saved', 'This technician was added to your favorites.');
    } catch (e: unknown) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setFavBusy(false);
    }
  };

  const handleTrack = () => {
    const ref = reference.trim().toUpperCase();
    if (!ref) return;
    setTrackedRef(ref);
  };

  const openMaps = () => {
    if (!booking) return;
    const q = encodeURIComponent(booking.customerAddress);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const openTechMaps = () => {
    if (!booking?.dispatchLat || !booking?.dispatchLng) return;
    void Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${booking.dispatchLat},${booking.dispatchLng}`
    );
  };

  const canCancel =
    booking &&
    (booking.status === 'UNASSIGNED' || booking.status === 'EN_ROUTE') &&
    booking.paymentStatus !== 'captured' &&
    booking.paymentStatus !== 'canceled' &&
    booking.paymentStatus !== 'refunded';

  const canReschedule = Boolean(canCancel);
  const canAddBeforePhoto =
    Boolean(booking?.id) &&
    (booking?.status === 'UNASSIGNED' || booking?.status === 'EN_ROUTE');

  const handleAddBeforePhoto = async () => {
    if (!booking?.id) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', 'Allow photo library access to share a picture with your tech.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    setBusy(true);
    try {
      await uploadJobPhotoUri({
        bookingId: booking.id,
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || undefined,
        kind: 'before',
        caption: 'Customer photo',
      });
      const pics = await fetchJobPhotosForTrackedBooking(booking.referenceCode);
      setPhotos(pics);
      Alert.alert('Photo shared', 'Your technician can see this before arriving.');
    } catch (e: unknown) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not upload photo');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    if (!booking) return;
    Alert.alert('Cancel booking?', 'This releases the card hold if payment was not captured.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await cancelCustomerBooking(booking.referenceCode);
            await load(booking.referenceCode);
            Alert.alert('Canceled', 'Booking canceled and hold released.');
          } catch (e: unknown) {
            Alert.alert('Cancel failed', e instanceof Error ? e.message : 'Could not cancel');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const handleReschedule = async () => {
    if (!booking) return;
    const run = async () => {
      setBusy(true);
      try {
        const result = await rescheduleCustomerBooking({
          referenceCode: booking.referenceCode,
          preferredDate: rescheduleDate,
          preferredTimeWindow: rescheduleWindow,
        });
        setShowReschedule(false);
        await load(booking.referenceCode);
        Alert.alert('Rescheduled', result.message || 'Card hold kept.');
      } catch (e: unknown) {
        Alert.alert('Reschedule failed', e instanceof Error ? e.message : 'Could not reschedule');
      } finally {
        setBusy(false);
      }
    };
    if (booking.status === 'EN_ROUTE') {
      Alert.alert(
        'Release tech?',
        'A tech is en route. Rescheduling keeps your card hold but returns the job to the open pool.',
        [
          { text: 'Back', style: 'cancel' },
          { text: 'Reschedule', onPress: () => void run() },
        ]
      );
      return;
    }
    await run();
  };

  const handleTip = async (amount: number) => {
    if (!booking) return;
    setBusy(true);
    try {
      await addBookingTip(booking.referenceCode, amount);
      Alert.alert('Thank you', `$${amount.toFixed(2)} tip sent to your technician.`);
      setCustomTip('');
    } catch (e: unknown) {
      Alert.alert('Tip failed', e instanceof Error ? e.message : 'Could not tip');
    } finally {
      setBusy(false);
    }
  };

  const liveEta = booking
    ? etaMinutesFromGps({
        techLat: booking.dispatchLat,
        techLng: booking.dispatchLng,
        knownMiles:
          booking.dispatchLat != null &&
          booking.dispatchLng != null &&
          Number.isFinite(booking.distanceMiles) &&
          booking.distanceMiles > 0
            ? booking.distanceMiles
            : null,
        fallbackEtaMinutes: booking.etaMinutes,
      })
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Track your repair</Text>
      <Text style={styles.subtitle}>
        Enter the job reference from your booking confirmation. Your tech diagnoses on site and sets labor +
        parts pricing before charging your card on file.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="AP-1234"
        placeholderTextColor={colors.text.muted}
        autoCapitalize="characters"
        value={reference}
        onChangeText={setReference}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleTrack}>
        <Text style={styles.primaryBtnText}>Track status</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={colors.brand.orange} style={{ marginTop: spacing.md }} />}

      {error && <Text style={styles.error}>{error}</Text>}

      {booking && (
        <View style={styles.card}>
          <Text style={styles.ref}>{booking.referenceCode}</Text>
          <Text style={styles.status}>{STATUS_LABEL[booking.status] || booking.status}</Text>
          <Text style={styles.line}>{booking.vehicle}</Text>
          <Text style={styles.lineMuted}>{booking.customerAddress}</Text>
          {!!formatPreferredSchedule(booking.preferredDate, booking.preferredTimeWindow) && (
            <Text style={styles.sched}>
              Scheduled: {formatPreferredSchedule(booking.preferredDate, booking.preferredTimeWindow)}
            </Text>
          )}
          {(booking.status === 'EN_ROUTE' ||
            (booking.dispatchLat != null && booking.dispatchLng != null)) &&
            liveEta && (
            <Text style={styles.eta}>
              {formatLiveEta(liveEta.minutes, liveEta.source)}
              {liveEta.miles != null
                ? ` · ${liveEta.miles.toFixed(1)} mi`
                : booking.distanceMiles
                  ? ` · ${booking.distanceMiles.toFixed(1)} mi`
                  : ''}
            </Text>
          )}
          <Text style={styles.pay}>Payment: {booking.paymentStatus.replace(/_/g, ' ')}</Text>

          {booking.dispatchLat != null && booking.dispatchLng != null && liveEta && (
            <View style={styles.mapBox}>
              <Text style={styles.eta}>{formatLiveEta(liveEta.minutes, liveEta.source)}</Text>
              <TouchableOpacity style={styles.mapBtn} onPress={openTechMaps}>
                <Text style={styles.primaryBtnText}>Open live tech map</Text>
              </TouchableOpacity>
            </View>
          )}

          {(booking.quoteStatus === 'awaiting_diagnostic' || booking.status === 'ON_SITE') &&
            booking.paymentStatus !== 'captured' && (
              <Text style={styles.diag}>
                Tech is diagnosing on site and will agree labor + parts with you before charging.
              </Text>
            )}

          {(booking.quoteLineItems.length > 0 || booking.capturedAmountCents != null) &&
            booking.paymentStatus === 'captured' && (
              <View style={styles.quoteBox}>
                <Text style={styles.quoteTitle}>Receipt</Text>
                {booking.quoteLineItems.map((item, i) => (
                  <View key={i} style={styles.quoteRow}>
                    <Text style={styles.line}>{item.title}</Text>
                    <Text style={styles.quoteAmt}>
                      {dollars((item.labor_cents || 0) + (item.parts_cents || 0))}
                    </Text>
                  </View>
                ))}
                <Text style={styles.total}>
                  Total: {dollars(booking.capturedAmountCents ?? booking.quoteTotalCents)}
                </Text>
              </View>
            )}

          {booking.status === 'COMPLETED' && (
            <>
              {booking.mechanicId && userId ? (
                <TouchableOpacity
                  style={styles.favBtn}
                  disabled={favBusy}
                  onPress={() => void handleSaveTech()}
                >
                  <Text style={styles.favBtnText}>
                    {favBusy ? 'Saving…' : 'Save this tech'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => void Linking.openURL(GOOGLE_REVIEW_URL)}
              >
                <Text style={styles.reviewBtnText}>★ Leave a Google review</Text>
              </TouchableOpacity>
            </>
          )}

          {chatActive && (
            <View style={styles.chatBox}>
              <Text style={styles.quoteTitle}>Job chat</Text>
              {chatMessages.length === 0 ? (
                <Text style={styles.lineMuted}>No messages yet — ask about ETA or parking.</Text>
              ) : (
                chatMessages.map((m) => {
                  const mine = userId && m.senderId === userId;
                  return (
                    <View
                      key={m.id}
                      style={[styles.chatBubble, mine ? styles.chatBubbleMine : styles.chatBubbleTheirs]}
                    >
                      <Text style={styles.line}>{m.body}</Text>
                      <Text style={styles.chatTime}>
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  );
                })
              )}
              <View style={styles.chatRow}>
                <TextInput
                  style={[styles.input, { flex: 1, fontFamily: undefined }]}
                  placeholder="Message…"
                  placeholderTextColor={colors.text.muted}
                  value={chatDraft}
                  onChangeText={setChatDraft}
                  maxLength={2000}
                />
                <TouchableOpacity
                  style={[styles.tipBtn, (chatBusy || !chatDraft.trim()) && { opacity: 0.5 }]}
                  disabled={chatBusy || !chatDraft.trim()}
                  onPress={() => void handleSendChat()}
                >
                  <Text style={styles.tipBtnText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {booking.paymentStatus === 'captured' && booking.status !== 'CANCELED' && (
            <View style={styles.tipBox}>
              <Text style={styles.quoteTitle}>Tip your technician</Text>
              <View style={styles.tipRow}>
                {[5, 10, 15].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.tipBtn}
                    disabled={busy}
                    onPress={() => void handleTip(amt)}
                  >
                    <Text style={styles.tipBtnText}>${amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.tipRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Custom $"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="decimal-pad"
                  value={customTip}
                  onChangeText={setCustomTip}
                />
                <TouchableOpacity
                  style={styles.tipBtn}
                  disabled={busy || !customTip || Number(customTip) < 1}
                  onPress={() => void handleTip(Number(customTip))}
                >
                  <Text style={styles.tipBtnText}>Tip</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {canReschedule && (
            <View style={styles.rescheduleBox}>
              {!showReschedule ? (
                <TouchableOpacity
                  style={styles.rescheduleBtn}
                  disabled={busy}
                  onPress={() => {
                    setRescheduleDate(booking.preferredDate || todayISODate());
                    setRescheduleWindow(booking.preferredTimeWindow || PREFERRED_TIME_WINDOWS[0]);
                    setShowReschedule(true);
                  }}
                >
                  <Text style={styles.rescheduleBtnText}>Reschedule appointment</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={styles.lineMuted}>
                    Card hold stays. En-route jobs return to the open pool for the new slot.
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={rescheduleDate}
                    onChangeText={setRescheduleDate}
                    placeholder={todayISODate()}
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="none"
                  />
                  <View style={styles.slotsRow}>
                    {PREFERRED_TIME_WINDOWS.map((w) => (
                      <TouchableOpacity
                        key={w}
                        style={[styles.slotChip, rescheduleWindow === w && styles.slotChipOn]}
                        onPress={() => setRescheduleWindow(w)}
                      >
                        <Text
                          style={[styles.slotChipText, rescheduleWindow === w && styles.slotChipTextOn]}
                        >
                          {w}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    disabled={busy}
                    onPress={() => void handleReschedule()}
                  >
                    <Text style={styles.primaryBtnText}>Save new slot</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowReschedule(false)}>
                    <Text style={styles.link}>Back</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              disabled={busy}
              onPress={handleCancel}
            >
              <Text style={styles.cancelBtnText}>Cancel booking & release hold</Text>
            </TouchableOpacity>
          )}

          {booking.quoteStatus === 'quote_approved' && (
            <Text style={styles.diag}>Payment captured. Thanks!</Text>
          )}
          {booking.quoteStatus === 'quote_declined' && (
            <Text style={styles.lineMuted}>Diagnostic visit only — booking hold applied.</Text>
          )}

          {(canAddBeforePhoto || photos.length > 0) && (
            <View style={{ marginTop: 10, gap: 8 }}>
              <Text style={styles.quoteTitle}>Job photos</Text>
              {canAddBeforePhoto && (
                <TouchableOpacity
                  style={styles.photoUploadBtn}
                  disabled={busy}
                  onPress={() => void handleAddBeforePhoto()}
                >
                  <Text style={styles.photoUploadText}>
                    {busy ? 'Uploading…' : 'Add photo for tech'}
                  </Text>
                </TouchableOpacity>
              )}
              {photos.map((p) => (
                <TouchableOpacity key={p.id} onPress={() => void Linking.openURL(p.publicUrl)}>
                  <Image source={{ uri: p.publicUrl }} style={styles.photo} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={openMaps}>
            <Text style={styles.link}>Open service address in Maps</Text>
          </TouchableOpacity>
          {booking.dispatchLat != null && booking.dispatchLng != null && (
            <TouchableOpacity onPress={openTechMaps}>
              <Text style={styles.link}>View last tech GPS ping</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { padding: spacing.md },
  title: { color: colors.text.primary, fontSize: 20, fontWeight: '900' },
  subtitle: { color: colors.text.muted, fontSize: 12, marginTop: 6, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  primaryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand.orange,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  error: { color: colors.status.error, marginTop: spacing.sm, fontSize: 12 },
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.md,
    gap: 6,
  },
  ref: { color: colors.brand.orange, fontFamily: 'monospace', fontWeight: '800' },
  status: { color: colors.text.primary, fontWeight: '800', fontSize: 16 },
  line: { color: colors.text.secondary, fontSize: 13 },
  lineMuted: { color: colors.text.muted, fontSize: 12 },
  eta: { color: colors.status.success, fontSize: 12, marginTop: 4 },
  sched: { color: colors.brand.orange, fontSize: 12, fontWeight: '700', marginTop: 4 },
  pay: { color: colors.text.muted, fontSize: 12, marginTop: 4 },
  diag: { color: '#7dd3fc', fontSize: 12, marginTop: 8, lineHeight: 18 },
  mapBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.bg.input,
    gap: 8,
  },
  mapBtn: {
    backgroundColor: colors.brand.orange,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quoteBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.bg.input,
  },
  tipBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    gap: 8,
  },
  tipRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tipBtn: {
    backgroundColor: 'rgba(249,115,22,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.4)',
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tipBtnText: { color: colors.brand.orange, fontWeight: '800', fontSize: 13 },
  cancelBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.4)',
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#fda4af', fontWeight: '700', fontSize: 12 },
  rescheduleBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.35)',
    gap: 8,
  },
  rescheduleBtn: {
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.45)',
    alignItems: 'center',
  },
  rescheduleBtnText: { color: colors.brand.orange, fontWeight: '800', fontSize: 12 },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slotChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  slotChipOn: { borderColor: colors.brand.orange, backgroundColor: 'rgba(251,146,60,0.15)' },
  slotChipText: { color: colors.text.muted, fontSize: 10, fontWeight: '700' },
  slotChipTextOn: { color: colors.brand.orange },
  quoteTitle: {
    color: colors.text.primary,
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  reviewBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.45)',
    backgroundColor: 'rgba(251,191,36,0.12)',
    alignItems: 'center',
  },
  reviewBtnText: { color: '#fcd34d', fontWeight: '800', fontSize: 13 },
  favBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.45)',
    alignItems: 'center',
  },
  favBtnText: { color: colors.brand.orange, fontWeight: '800', fontSize: 12 },
  chatBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.bg.input,
    gap: 6,
  },
  chatBubble: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '90%',
  },
  chatBubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(249,115,22,0.2)',
  },
  chatBubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chatTime: { color: colors.text.muted, fontSize: 9, marginTop: 2 },
  chatRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  photoUploadBtn: {
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.45)',
    alignItems: 'center',
  },
  photoUploadText: { color: colors.brand.orange, fontWeight: '800', fontSize: 12 },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  quoteAmt: { color: colors.text.primary, fontWeight: '700', marginTop: 8 },
  total: { color: colors.text.primary, fontWeight: '900', marginTop: 8 },
  photo: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.input,
  },
  link: { color: colors.brand.orange, marginTop: 10, fontSize: 12, textDecorationLine: 'underline' },
});
