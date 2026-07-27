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
      <Text style={styles.subtitle}>Enter the job reference from your booking confirmation (e.g. AP-8492).</Text>

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
          <Text style={styles.pay}>Payment: {booking.paymentStatus}</Text>
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
    fontSize: 16,
    fontWeight: '700',
  },
  primaryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand.orange,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  error: { color: '#f87171', marginTop: spacing.md, fontSize: 13 },
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  ref: { color: colors.brand.orange, fontWeight: '900', fontSize: 18 },
  status: { color: colors.text.primary, fontWeight: '800', fontSize: 16, marginTop: 8 },
  line: { color: colors.text.secondary, marginTop: 8 },
  lineMuted: { color: colors.text.muted, fontSize: 12, marginTop: 4 },
  eta: { color: colors.text.secondary, marginTop: 8, fontWeight: '600' },
  pay: { color: colors.text.muted, fontSize: 11, marginTop: 8 },
  link: { color: colors.brand.orange, marginTop: 10, fontWeight: '700', fontSize: 13 },
});
