import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { fetchMyBookings, supabase } from '../lib/supabase';
import { shareReceipt } from '../lib/receiptPdf';

interface ServiceHistoryItem {
  id: string;
  date: string;
  vehicleName: string;
  services: string[];
  totalCost: number;
  status: string;
  receiptId: string;
  paymentStatus: string;
  customerName: string;
  address: string;
}

interface HistoryScreenProps {
  onQuickBookRecommended: (title: string, cost: number) => void;
}

function mapBooking(row: Record<string, unknown>): ServiceHistoryItem {
  const services = Array.isArray(row.services) ? (row.services as string[]) : [];
  const captured = row.captured_amount_cents != null ? Number(row.captured_amount_cents) / 100 : null;
  return {
    id: row.id as string,
    date: new Date(row.created_at as string).toLocaleDateString(),
    vehicleName: (row.vehicle_description as string) || 'Vehicle',
    services,
    totalCost: captured ?? Number(row.total_estimate) || 0,
    status: (row.status as string) || 'unknown',
    receiptId: (row.reference_code as string) || '—',
    paymentStatus: (row.payment_status as string) || 'none',
    customerName: (row.customer_name as string) || 'Customer',
    address: (row.customer_address as string) || '',
  };
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onQuickBookRecommended }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'receipts'>('history');
  const [selectedReceipt, setSelectedReceipt] = useState<ServiceHistoryItem | null>(null);
  const [items, setItems] = useState<ServiceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) {
        setItems([]);
        return;
      }
      const rows = await fetchMyBookings(uid);
      setItems(rows.map((r) => mapBooking(r as Record<string, unknown>)));
    } catch (e) {
      Alert.alert('History', e instanceof Error ? e.message : 'Could not load bookings');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDownloadPDF = async (item: ServiceHistoryItem) => {
    try {
      await shareReceipt({
        referenceCode: item.receiptId,
        customerName: item.customerName,
        vehicle: item.vehicleName,
        services: item.services,
        totalDollars: item.totalCost,
        paymentStatus: item.paymentStatus,
        dateLabel: item.date,
        address: item.address,
      });
    } catch (e) {
      Alert.alert('Share failed', e instanceof Error ? e.message : 'Could not share receipt');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>📜 History & Receipts</Text>
      <Text style={styles.screenSubtitle}>
        Your real bookings from Adaptivity. Share a receipt anytime.
      </Text>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Work History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'receipts' && styles.tabActive]}
          onPress={() => setActiveTab('receipts')}
        >
          <Text style={[styles.tabText, activeTab === 'receipts' && styles.tabTextActive]}>
            Receipts
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand.orange} style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No jobs yet</Text>
          <Text style={styles.emptyBody}>Completed and in-progress bookings will show here.</Text>
          <TouchableOpacity
            style={styles.bookAgainBtn}
            onPress={() => onQuickBookRecommended('Mobile service', 0)}
          >
            <Text style={styles.bookAgainText}>Book a service →</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'history' ? (
        items.map((item) => (
          <View key={item.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyVehicle}>{item.vehicleName}</Text>
              <Text style={styles.historyAmount}>${item.totalCost.toFixed(2)}</Text>
            </View>
            <Text style={styles.historyMeta}>
              {item.date} · {item.receiptId} · {item.status.replace('_', ' ')}
            </Text>
            <Text style={styles.historyServices} numberOfLines={2}>
              {item.services.join(' · ') || 'Service'}
            </Text>
          </View>
        ))
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.receiptCard}>
            <View style={styles.receiptRow}>
              <View>
                <Text style={styles.receiptIdTitle}>{item.receiptId}</Text>
                <Text style={styles.receiptSub}>
                  {item.date} • {item.vehicleName}
                </Text>
              </View>
              <Text style={styles.receiptAmount}>${item.totalCost.toFixed(2)}</Text>
            </View>
            <View style={styles.receiptActionRow}>
              <TouchableOpacity
                style={styles.receiptModalBtn}
                onPress={() => setSelectedReceipt(item)}
              >
                <Text style={styles.receiptModalText}>👁️ Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pdfDownloadBtn}
                onPress={() => void handleDownloadPDF(item)}
              >
                <Text style={styles.pdfDownloadText}>📤 Share receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Modal visible={!!selectedReceipt} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedReceipt && (
              <>
                <Text style={styles.receiptNumber}>{selectedReceipt.receiptId}</Text>
                <Text style={styles.receiptDate}>{selectedReceipt.date}</Text>
                <Text style={styles.receiptVehicle}>{selectedReceipt.vehicleName}</Text>
                <Text style={styles.modalServices}>
                  {selectedReceipt.services.join('\n') || 'Service'}
                </Text>
                <Text style={styles.modalTotal}>${selectedReceipt.totalCost.toFixed(2)}</Text>
                <TouchableOpacity
                  style={styles.modalPdfBtn}
                  onPress={() => {
                    void handleDownloadPDF(selectedReceipt);
                  }}
                >
                  <Text style={styles.modalPdfText}>📤 Share official receipt</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedReceipt(null)}>
                  <Text style={styles.modalClose}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { padding: spacing.lg, paddingBottom: 100 },
  screenTitle: { fontSize: 22, fontWeight: '900', color: colors.text.primary },
  screenSubtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 4, marginBottom: spacing.lg },
  tabBar: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
  },
  tabActive: { borderColor: colors.brand.orange, backgroundColor: 'rgba(249,115,22,0.12)' },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.text.muted },
  tabTextActive: { color: colors.brand.orange },
  emptyCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.lg,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text.primary },
  emptyBody: { fontSize: 13, color: colors.text.muted, marginTop: 6 },
  bookAgainBtn: { marginTop: spacing.md },
  bookAgainText: { fontSize: 13, fontWeight: '800', color: colors.brand.orange },
  historyCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  historyVehicle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text.primary },
  historyAmount: { fontSize: 14, fontWeight: '900', color: colors.status.success },
  historyMeta: { fontSize: 11, color: colors.text.muted, marginTop: 4 },
  historyServices: { fontSize: 12, color: colors.text.secondary, marginTop: 6 },
  receiptCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  receiptIdTitle: { fontSize: 15, fontWeight: '800', color: colors.text.primary },
  receiptSub: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  receiptAmount: { fontSize: 16, fontWeight: '900', color: colors.brand.orange },
  receiptActionRow: { flexDirection: 'row', gap: spacing.md },
  receiptModalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.input,
    alignItems: 'center',
  },
  receiptModalText: { fontSize: 12, fontWeight: '700', color: colors.text.secondary },
  pdfDownloadBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.brand.orange,
    alignItems: 'center',
  },
  pdfDownloadText: { fontSize: 12, fontWeight: '700', color: colors.brand.orange },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  receiptNumber: { fontSize: 18, fontWeight: '900', color: colors.brand.orange },
  receiptDate: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  receiptVehicle: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginTop: 4 },
  modalServices: { fontSize: 13, color: colors.text.secondary, marginTop: spacing.md, lineHeight: 20 },
  modalTotal: { fontSize: 22, fontWeight: '900', color: colors.text.primary, marginTop: spacing.md },
  modalPdfBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.brand.orange,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalPdfText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  modalClose: {
    textAlign: 'center',
    marginTop: spacing.md,
    color: colors.text.muted,
    fontWeight: '600',
  },
});
