import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';

interface ServiceHistoryItem {
  id: string;
  date: string;
  vehicleName: string;
  services: string[];
  techName: string;
  techRig: string;
  totalCost: number;
  status: 'completed' | 'in_progress';
  receiptId: string;
}

interface RecommendedWorkItem {
  id: string;
  vehicleName: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  estimatedCost: number;
  reason: string;
}

const PAST_SERVICES: ServiceHistoryItem[] = [
  {
    id: 'h1',
    date: 'June 14, 2026',
    vehicleName: '2023 Porsche 911 GT3',
    services: ['Full Synthetic Euro Oil Change', '21-Point Mobile Inspection', 'Brake Fluid Flush'],
    techName: 'Alex Vance',
    techRig: 'Rig #4 (Austin Central)',
    totalCost: 284.00,
    status: 'completed',
    receiptId: 'REC-9104-2026',
  },
  {
    id: 'h2',
    date: 'April 02, 2026',
    vehicleName: '2021 BMW M3 Competition',
    services: ['Brembo Front Ceramic Brake Pads', 'Rotor Resurfacing'],
    techName: 'Jordan Reed',
    techRig: 'Rig #2 (Round Rock)',
    totalCost: 389.50,
    status: 'completed',
    receiptId: 'REC-4910-2026',
  },
];

const RECOMMENDED_ITEMS: RecommendedWorkItem[] = [
  {
    id: 'r1',
    vehicleName: '2021 BMW M3 Competition',
    title: 'Rear Brake Pad Replacement & Sensor',
    severity: 'high',
    estimatedCost: 240,
    reason: 'Technician Alex Vance measured rear pad friction material at 3mm during June inspection (Below 4mm safety threshold).',
  },
  {
    id: 'r2',
    vehicleName: '2023 Porsche 911 GT3',
    title: 'Engine Air Intake Filters (Twin Pack)',
    severity: 'medium',
    estimatedCost: 110,
    reason: 'Dust buildup detected in airbox intake during 12,000 mile maintenance interval.',
  },
];

interface HistoryScreenProps {
  onQuickBookRecommended: (title: string, cost: number) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onQuickBookRecommended }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'receipts' | 'recommended'>('history');
  const [selectedReceipt, setSelectedReceipt] = useState<ServiceHistoryItem | null>(null);

  const handleDownloadPDF = (receiptId: string) => {
    Alert.alert('PDF Receipt Generated', `Digital invoice ${receiptId} has been exported to your downloads.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.screenTitle}>📜 History & Receipts</Text>
      <Text style={styles.screenSubtitle}>
        Review previous mobile work, download itemized receipts & view recommended service notes.
      </Text>

      {/* Navigation Sub-Tabs */}
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
            Receipts ({PAST_SERVICES.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommended' && styles.tabActive]}
          onPress={() => setActiveTab('recommended')}
        >
          <Text style={[styles.tabText, activeTab === 'recommended' && styles.tabTextActive]}>
            Recommended ({RECOMMENDED_ITEMS.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: WORK HISTORY */}
      {activeTab === 'history' && (
        <View style={styles.section}>
          {PAST_SERVICES.map(item => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <Text style={styles.historyVehicle}>{item.vehicleName}</Text>
                </View>
                <View style={styles.statusCompletedBadge}>
                  <Text style={styles.statusCompletedText}>✓ Completed</Text>
                </View>
              </View>

              <View style={styles.serviceList}>
                {item.services.map((s, idx) => (
                  <Text key={idx} style={styles.serviceBullet}>
                    • {s}
                  </Text>
                ))}
              </View>

              <View style={styles.techBar}>
                <Text style={styles.techText}>
                  👨‍🔧 Tech: <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{item.techName}</Text> ({item.techRig})
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.costText}>${item.totalCost.toFixed(2)}</Text>
                <TouchableOpacity
                  style={styles.viewReceiptBtn}
                  onPress={() => setSelectedReceipt(item)}
                >
                  <Text style={styles.viewReceiptText}>📄 View Receipt</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* TAB 2: RECEIPTS */}
      {activeTab === 'receipts' && (
        <View style={styles.section}>
          {PAST_SERVICES.map(item => (
            <View key={item.id} style={styles.receiptCard}>
              <View style={styles.receiptRow}>
                <View>
                  <Text style={styles.receiptIdTitle}>{item.receiptId}</Text>
                  <Text style={styles.receiptSub}>{item.date} • {item.vehicleName}</Text>
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
                  onPress={() => handleDownloadPDF(item.receiptId)}
                >
                  <Text style={styles.pdfDownloadText}>📥 Download PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* TAB 3: RECOMMENDED WORK */}
      {activeTab === 'recommended' && (
        <View style={styles.section}>
          {RECOMMENDED_ITEMS.map(rec => {
            const isHigh = rec.severity === 'high';
            return (
              <View key={rec.id} style={styles.recCard}>
                <View style={styles.recHeader}>
                  <View style={[styles.severityBadge, isHigh && styles.severityHigh]}>
                    <Text style={[styles.severityText, isHigh && styles.severityHighText]}>
                      {isHigh ? '⚠️ HIGH PRIORITY' : 'ℹ️ RECOMMENDED'}
                    </Text>
                  </View>
                  <Text style={styles.recVehicle}>{rec.vehicleName}</Text>
                </View>

                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recReason}>{rec.reason}</Text>

                <View style={styles.recFooter}>
                  <Text style={styles.recCost}>Est. ${rec.estimatedCost}.00</Text>
                  <TouchableOpacity
                    style={styles.bookRecBtn}
                    onPress={() => onQuickBookRecommended(rec.title, rec.estimatedCost)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bookRecText}>⚡ Schedule & Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Receipt Detail Modal */}
      <Modal visible={!!selectedReceipt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReceipt && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>📄 Official Digital Receipt</Text>
                  <TouchableOpacity onPress={() => setSelectedReceipt(null)}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.receiptDetailCard}>
                  <Text style={styles.receiptNumber}>{selectedReceipt.receiptId}</Text>
                  <Text style={styles.receiptDate}>{selectedReceipt.date}</Text>
                  <Text style={styles.receiptVehicle}>{selectedReceipt.vehicleName}</Text>

                  <View style={styles.modalDivider} />

                  <Text style={styles.lineItemsHeader}>ITEMIZED SERVICE BREAKDOWN</Text>
                  {selectedReceipt.services.map((s, i) => (
                    <View key={i} style={styles.lineItemRow}>
                      <Text style={styles.lineItemText}>{s}</Text>
                      <Text style={styles.lineItemCost}>Included</Text>
                    </View>
                  ))}

                  <View style={styles.modalDivider} />

                  <View style={styles.modalTotalRow}>
                    <Text style={styles.totalLabel}>TOTAL PAID</Text>
                    <Text style={styles.totalVal}>${selectedReceipt.totalCost.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.paidMethodText}>Payment Method: Visa ending in •••• 4910</Text>
                </View>

                <TouchableOpacity
                  style={styles.modalPdfBtn}
                  onPress={() => {
                    handleDownloadPDF(selectedReceipt.receiptId);
                    setSelectedReceipt(null);
                  }}
                >
                  <Text style={styles.modalPdfText}>📥 Export Official PDF Receipt</Text>
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
  content: { padding: spacing.lg, paddingBottom: 50 },
  screenTitle: { fontSize: 22, fontWeight: '900', color: colors.text.primary },
  screenSubtitle: { fontSize: 12, color: colors.text.muted, marginTop: 2, marginBottom: spacing.lg },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: { backgroundColor: colors.brand.orange },
  tabText: { fontSize: 11, fontWeight: '700', color: colors.text.muted },
  tabTextActive: { color: '#ffffff' },
  section: { gap: spacing.md },
  historyCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.lg,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  historyDate: { fontSize: 11, fontWeight: '700', color: colors.brand.orange },
  historyVehicle: { fontSize: 16, fontWeight: '800', color: colors.text.primary },
  statusCompletedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusCompletedText: { fontSize: 10, fontWeight: '700', color: colors.status.success },
  serviceList: { marginVertical: spacing.sm },
  serviceBullet: { fontSize: 12, color: colors.text.secondary, lineHeight: 18 },
  techBar: {
    backgroundColor: colors.bg.input,
    padding: 8,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
  },
  techText: { fontSize: 11, color: colors.text.muted },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  costText: { fontSize: 18, fontWeight: '900', color: colors.text.primary },
  viewReceiptBtn: {
    backgroundColor: colors.bg.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  viewReceiptText: { fontSize: 12, fontWeight: '700', color: colors.text.secondary },
  receiptCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.lg,
  },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  receiptIdTitle: { fontSize: 15, fontWeight: '800', color: colors.text.primary },
  receiptSub: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  receiptAmount: { fontSize: 16, fontWeight: '900', color: colors.brand.orange },
  receiptActionRow: { flexDirection: 'row', gap: spacing.md },
  receiptModalBtn: {
    flex: 1,
    backgroundColor: colors.bg.input,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  receiptModalText: { fontSize: 12, fontWeight: '700', color: colors.text.secondary },
  pdfDownloadBtn: {
    flex: 1,
    backgroundColor: colors.brand.orangeGlow,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.orange,
  },
  pdfDownloadText: { fontSize: 12, fontWeight: '700', color: colors.brand.orange },
  recCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.lg,
  },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  severityBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  severityHigh: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  severityText: { fontSize: 9, fontWeight: '800', color: colors.status.info },
  severityHighText: { color: colors.status.error },
  recVehicle: { fontSize: 11, color: colors.text.muted, fontWeight: '700' },
  recTitle: { fontSize: 15, fontWeight: '800', color: colors.text.primary, marginBottom: 4 },
  recReason: { fontSize: 12, color: colors.text.secondary, lineHeight: 17, marginBottom: spacing.md },
  recFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recCost: { fontSize: 16, fontWeight: '900', color: colors.brand.orange },
  bookRecBtn: {
    backgroundColor: colors.brand.orange,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  bookRecText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text.primary },
  closeBtn: { fontSize: 20, color: colors.text.muted, padding: 4 },
  receiptDetailCard: {
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  receiptNumber: { fontSize: 18, fontWeight: '900', color: colors.brand.orange },
  receiptDate: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  receiptVehicle: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginTop: 4 },
  modalDivider: { height: 1, backgroundColor: colors.border.primary, marginVertical: spacing.md },
  lineItemsHeader: { fontSize: 10, fontWeight: '800', color: colors.text.muted, letterSpacing: 0.5, marginBottom: 6 },
  lineItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  lineItemText: { fontSize: 12, color: colors.text.secondary },
  lineItemCost: { fontSize: 12, fontWeight: '700', color: colors.status.success },
  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 12, fontWeight: '900', color: colors.text.primary },
  totalVal: { fontSize: 20, fontWeight: '900', color: colors.brand.orange },
  paidMethodText: { fontSize: 10, color: colors.text.muted, marginTop: 4 },
  modalPdfBtn: {
    backgroundColor: colors.brand.orange,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalPdfText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
