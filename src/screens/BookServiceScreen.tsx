import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { Vehicle } from './GarageScreen';
import { supabase } from '../lib/supabase';
import { createBookingWithCardHold } from '../lib/bookingPayments';
import { SERVICE_CATALOG } from '../lib/serviceCatalog';
import { computeHoldQuote } from '../lib/holdPricing';
import { CUSTOMER_TECH_LIABILITY_NOTICE } from '../lib/contractorLiability';

const SERVICES = SERVICE_CATALOG;

const TIME_SLOTS = [
  '08:00 AM', '10:30 AM', '01:00 PM', '03:30 PM', '05:30 PM',
];

interface BookServiceScreenProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  onBookingSuccess: () => void;
}

export const BookServiceScreen: React.FC<BookServiceScreenProps> = ({
  vehicles,
  selectedVehicleId,
  onBookingSuccess,
}) => {
  const [activeVehicleId, setActiveVehicleId] = useState<string>(
    selectedVehicleId || (vehicles[0]?.id || '')
  );
  const [selectedServices, setSelectedServices] = useState<string[]>(['diagnostic']);
  const [dispatchAddress, setDispatchAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:30 AM');
  const [notes, setNotes] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [dispatchReference, setDispatchReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];

  const toggleService = (id: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id);
        return next.length ? next : ['diagnostic'];
      }
      return [...prev, id];
    });
  };

  const selectedServicesList = SERVICES.filter((s) => selectedServices.includes(s.id));
  const quote = computeHoldQuote(selectedServices);
  const grandTotal = quote.holdDollars;

  const handleConfirmBooking = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('No Services Selected', 'Please select at least one service to request a quote or booking.');
      return;
    }
    if (!dispatchAddress.trim()) {
      Alert.alert('Missing Address', 'Please provide a mobile dispatch address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        Alert.alert('Sign in required', 'Please sign in again to save your card and book.');
        return;
      }
      const userId = sessionData.session.user.id;
      const userMeta = sessionData.session.user.user_metadata;
      const email = sessionData.session.user.email ?? undefined;

      const hold = await createBookingWithCardHold({
        customerName: userMeta?.full_name || 'Adaptivity Customer',
        customerPhone: userMeta?.phone || '(214) 620-3244',
        customerAddress: `${dispatchAddress.trim()} • ${selectedDate} ${selectedTime}`,
        zipCode: '76247',
        vehicleDescription: activeVehicle
          ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`
          : 'Customer vehicle',
        services: selectedServicesList.map(s => s.title),
        holdAmountDollars: grandTotal,
        customerEmail: email,
      });

      const init = await initPaymentSheet({
        merchantDisplayName: 'Adaptivity Performance',
        paymentIntentClientSecret: hold.clientSecret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: userMeta?.full_name || undefined,
          email,
        },
      });
      if (init.error) {
        throw new Error(init.error.message);
      }

      const pay = await presentPaymentSheet();
      if (pay.error) {
        if (pay.error.code === 'Canceled') {
          Alert.alert('Booking not confirmed', 'Add a card to place the diagnostic hold and confirm your appointment.');
          return;
        }
        throw new Error(pay.error.message);
      }

      setDispatchReference(hold.bookingReference);
      setBookingConfirmed(true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not create booking.';
      Alert.alert('Booking Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.screenTitle}>⚡ Instant Quote & Dispatch</Text>
      <Text style={styles.screenSubtitle}>
        Most visits start with a $100 diagnostic — then we recommend repairs. Oil, brakes,
        transmission fluid, and differential service book directly (no diagnostic fee).
      </Text>

      {/* Step 1: Select Vehicle */}
      <Text style={styles.sectionHeader}>1. SELECT VEHICLE FROM GARAGE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehiclePickerScroll}>
        {vehicles.map(v => {
          const isSelected = v.id === activeVehicleId;
          return (
            <TouchableOpacity
              key={v.id}
              style={[styles.vehicleChip, isSelected && styles.vehicleChipSelected]}
              onPress={() => setActiveVehicleId(v.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.vehicleChipEmoji}>🏎️</Text>
              <View>
                <Text style={[styles.vehicleChipTitle, isSelected && styles.vehicleChipTitleSelected]}>
                  {v.year} {v.make} {v.model}
                </Text>
                <Text style={styles.vehicleChipSub}>{v.licensePlate || v.vin.slice(0, 8)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Step 2: Select Services */}
      <Text style={styles.sectionHeader}>2. CHOOSE REQUIRED SERVICES</Text>
      {SERVICES.map(s => {
        const isChecked = selectedServices.includes(s.id);
        return (
          <TouchableOpacity
            key={s.id}
            style={[styles.serviceCard, isChecked && styles.serviceCardSelected]}
            onPress={() => toggleService(s.id)}
            activeOpacity={0.8}
          >
            <View style={styles.serviceHeaderRow}>
              <View style={styles.serviceTitleBox}>
                <Text style={styles.serviceIcon}>{s.icon}</Text>
                <Text style={styles.serviceTitle}>{s.title}</Text>
              </View>
              <Text style={styles.servicePrice}>
                {s.directBook ? `$${s.price}` : '$100'}
              </Text>
            </View>

            <Text style={styles.serviceDescription}>
              {s.directBook ? 'DIRECT BOOK · ' : 'DIAGNOSTIC PATH · '}
              {s.description}
            </Text>

            <View style={styles.serviceFooter}>
              <Text style={styles.serviceDuration}>⏱️ Est. {s.duration}</Text>
              <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                {isChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Step 3: Dispatch Address & Slot */}
      <Text style={styles.sectionHeader}>3. DISPATCH LOCATION & TIME</Text>
      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>Mobile Dispatch Address</Text>
        <TextInput
          style={styles.input}
          value={dispatchAddress}
          onChangeText={setDispatchAddress}
          placeholder="Enter Home / Office Address"
          placeholderTextColor={colors.text.muted}
        />

        <Text style={styles.inputLabel}>Preferred Date</Text>
        <TextInput
          style={styles.input}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="e.g. Tomorrow, 10 AM"
          placeholderTextColor={colors.text.muted}
        />

        <Text style={styles.inputLabel}>Select Time Slot</Text>
        <View style={styles.slotsRow}>
          {TIME_SLOTS.map(slot => {
            const isSlotSelected = selectedTime === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.slotBtn, isSlotSelected && styles.slotBtnSelected]}
                onPress={() => setSelectedTime(slot)}
              >
                <Text style={[styles.slotText, isSlotSelected && styles.slotTextSelected]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.inputLabel}>Technician Notes / Specific Concerns (Optional)</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Squeaking noise when braking slowly, park in driveway."
          placeholderTextColor={colors.text.muted}
          multiline
        />
      </View>

      {/* Step 4: Quote Summary */}
      <Text style={styles.sectionHeader}>4. CARD HOLD BREAKDOWN</Text>
      <View style={styles.quoteCard}>
        {selectedServicesList.map((s) => (
          <View key={s.id} style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>{s.title}</Text>
            <Text style={styles.quoteVal}>
              {quote.mode === 'direct' ? `$${s.price}` : s.directBook ? `$${s.price}*` : '$100'}
            </Text>
          </View>
        ))}

        {quote.mode === 'diagnostic' && (
          <Text style={[styles.quoteLabel, { marginBottom: spacing.sm, lineHeight: 18 }]}>
            {quote.explanation}
            {selectedServicesList.some((s) => s.directBook)
              ? ' (*Service menu items — final labor + parts are set by your tech on site.)'
              : ''}
          </Text>
        )}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.totalTitle}>
              {quote.mode === 'direct' ? 'SERVICE HOLD' : 'DIAGNOSTIC HOLD'}
            </Text>
            <Text style={styles.totalSubtitle}>{quote.explanation}</Text>
          </View>
          <Text style={styles.totalAmount}>${grandTotal}</Text>
        </View>

        <Text style={[styles.quoteLabel, { marginTop: spacing.sm, lineHeight: 18 }]}>
          {CUSTOMER_TECH_LIABILITY_NOTICE}
        </Text>

        <TouchableOpacity
          style={[styles.confirmBookingBtn, isSubmitting && styles.confirmBookingBtnDisabled]}
          onPress={handleConfirmBooking}
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBookingText}>
              💳 Confirm & Hold ${grandTotal} on Card
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal visible={bookingConfirmed} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.modalSuccessTitle}>Mobile Service Booked!</Text>
            <Text style={styles.modalSuccessText}>
              Your card is on file and we placed a hold of{' '}
              <Text style={{ color: colors.brand.orange, fontWeight: '800' }}>${grandTotal}</Text>
              {quote.mode === 'diagnostic'
                ? '. After the diagnostic we will recommend any repairs before additional charges.'
                : ' for your direct-book service.'}{' '}
              You are charged when the job is completed. Appointment:{' '}
              <Text style={{ color: colors.brand.orange, fontWeight: '800' }}>
                {selectedDate} at {selectedTime}
              </Text>
              .
            </Text>

            <View style={styles.receiptBox}>
              <Text style={styles.receiptLabel}>DISPATCH APPOINTMENT ID</Text>
              <Text style={styles.receiptId}>#{dispatchReference || 'PENDING'}</Text>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                setBookingConfirmed(false);
                onBookingSuccess();
              }}
            >
              <Text style={styles.doneBtnText}>View Service History & Status</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { padding: spacing.lg, paddingBottom: 50 },
  screenTitle: { fontSize: 22, fontWeight: '900', color: colors.text.primary },
  screenSubtitle: { fontSize: 12, color: colors.text.muted, marginTop: 2, marginBottom: spacing.xl },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand.orange,
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  vehiclePickerScroll: { flexDirection: 'row', marginBottom: spacing.md },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginRight: spacing.md,
  },
  vehicleChipSelected: {
    borderColor: colors.brand.orange,
    backgroundColor: colors.brand.orangeGlow,
  },
  vehicleChipEmoji: { fontSize: 18 },
  vehicleChipTitle: { fontSize: 13, fontWeight: '700', color: colors.text.secondary },
  vehicleChipTitleSelected: { color: colors.text.primary },
  vehicleChipSub: { fontSize: 10, color: colors.text.muted },
  serviceCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  serviceCardSelected: {
    borderColor: colors.brand.orange,
    backgroundColor: 'rgba(249,115,22,0.06)',
  },
  serviceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  serviceIcon: { fontSize: 16 },
  serviceTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary, flex: 1 },
  servicePrice: { fontSize: 16, fontWeight: '800', color: colors.brand.orange },
  serviceDescription: { fontSize: 11, color: colors.text.muted, lineHeight: 16, marginBottom: spacing.sm },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  serviceDuration: { fontSize: 11, color: colors.text.secondary, fontWeight: '600' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: colors.brand.orange, borderColor: colors.brand.orange },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  formCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 13,
  },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  slotBtn: {
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  slotBtnSelected: {
    backgroundColor: colors.brand.orange,
    borderColor: colors.brand.orange,
  },
  slotText: { fontSize: 11, fontWeight: '700', color: colors.text.secondary },
  slotTextSelected: { color: '#fff' },
  quoteCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.lg,
  },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  quoteLabel: { fontSize: 12, color: colors.text.secondary },
  quoteVal: { fontSize: 12, fontWeight: '700', color: colors.text.primary },
  divider: { height: 1, backgroundColor: colors.border.primary, marginVertical: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  totalTitle: { fontSize: 12, fontWeight: '900', color: colors.text.primary, letterSpacing: 0.5 },
  totalSubtitle: { fontSize: 10, color: colors.text.muted, marginTop: 2 },
  totalAmount: { fontSize: 24, fontWeight: '900', color: colors.brand.orange },
  confirmBookingBtn: {
    backgroundColor: colors.brand.orange,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBookingBtnDisabled: { opacity: 0.75 },
  confirmBookingText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  successEmoji: { fontSize: 44, marginBottom: spacing.sm },
  modalSuccessTitle: { fontSize: 20, fontWeight: '900', color: colors.text.primary, marginBottom: 8 },
  modalSuccessText: { fontSize: 13, color: colors.text.secondary, textAlign: 'center', lineHeight: 19, marginBottom: spacing.xl },
  receiptBox: {
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  receiptLabel: { fontSize: 9, fontWeight: '800', color: colors.text.muted, letterSpacing: 1 },
  receiptId: { fontSize: 16, fontWeight: '900', color: colors.brand.orange, marginTop: 2 },
  doneBtn: {
    backgroundColor: colors.brand.orange,
    paddingVertical: 14,
    paddingHorizontal: spacing['2xl'],
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
