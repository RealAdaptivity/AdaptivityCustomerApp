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
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import {
  fetchBookingByReference,
  subscribeBookingReference,
  type TrackedBooking,
} from '../lib/trackBooking';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (ref: string) => {
    setLoading(true);
    setError(null);
    try {
      const row = await fetchBookingByReference(ref);
      if (!row) {
        setError('No booking found for that reference.');
        setBooking(null);
      } else {
        setBooking(row);
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
          {booking.status === 'EN_ROUTE' && (
            <Text style={styles.eta}>
              ETA ~{booking.etaMinutes} min · {booking.distanceMiles.toFixed(1)} mi
            </Text>
          )}
          <Text style={styles.pay}>Payment: {booking.paymentStatus.replace(/_/g, ' ')}</Text>

          {(booking.quoteStatus === 'awaiting_diagnostic' || booking.status === 'ON_SITE') &&
            booking.paymentStatus !== 'captured' && (
              <Text style={styles.diag}>
                Tech is diagnosing on site and will agree labor + parts with you before charging.
              </Text>
            )}

          {booking.quoteLineItems.length > 0 && booking.paymentStatus === 'captured' && (
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
              <Text style={styles.total}>Total: {dollars(booking.quoteTotalCents)}</Text>
            </View>
          )}

          {booking.quoteStatus === 'quote_approved' && (
            <Text style={styles.diag}>Payment captured. Thanks!</Text>
          )}
          {booking.quoteStatus === 'quote_declined' && (
            <Text style={styles.lineMuted}>Diagnostic visit only — $100 applied.</Text>
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
  pay: { color: colors.text.muted, fontSize: 12, marginTop: 4 },
  diag: { color: '#7dd3fc', fontSize: 12, marginTop: 8, lineHeight: 18 },
  quoteBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.bg.input,
  },
  quoteTitle: {
    color: colors.text.primary,
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  quoteAmt: { color: colors.text.primary, fontWeight: '700', marginTop: 8 },
  total: { color: colors.text.primary, fontWeight: '900', marginTop: 8 },
  link: { color: colors.brand.orange, marginTop: 10, fontSize: 12, textDecorationLine: 'underline' },
});
