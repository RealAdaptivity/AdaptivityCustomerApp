import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/colors';
import { supabase, upsertVehicle } from '../lib/supabase';

export interface Vehicle {
  id: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
  vin: string;
  licensePlate: string;
  mileage: string;
  healthStatus: 'good' | 'warning' | 'urgent';
  healthLabel: string;
}

interface GarageScreenProps {
  userId: string;
  vehicles: Vehicle[];
  onVehiclesChange: (vehicles: Vehicle[]) => void;
  onBookForVehicle: (vehicle: Vehicle) => void;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({
  userId,
  vehicles,
  onVehiclesChange,
  onBookForVehicle,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');
  const [plate, setPlate] = useState('');

  const handleAddVehicle = async () => {
    if (!make.trim() || !model.trim() || !year.trim()) {
      Alert.alert('Missing Details', 'Please specify Year, Make, and Model.');
      return;
    }

    setSaving(true);
    try {
      const id = await upsertVehicle(userId, {
        year: year.trim(),
        make: make.trim(),
        model: model.trim(),
        trim: null,
        vin: vin.trim().toUpperCase() || null,
        license_plate: plate.trim().toUpperCase() || null,
        mileage: mileage.trim() ? `${mileage.trim()} mi` : '0 mi',
        health_status: 'good',
        health_label: 'Initial Inspection Pending',
      });

      const newVehicle: Vehicle = {
        id,
        year: year.trim(),
        make: make.trim(),
        model: model.trim(),
        vin: vin.trim().toUpperCase() || 'VIN-NOT-PROVIDED',
        licensePlate: plate.trim().toUpperCase() || 'N/A',
        mileage: mileage.trim() ? `${mileage.trim()} mi` : '0 mi',
        healthStatus: 'good',
        healthLabel: 'Initial Inspection Pending',
      };

      onVehiclesChange([newVehicle, ...vehicles]);
      setShowAddModal(false);
      setYear('');
      setMake('');
      setModel('');
      setVin('');
      setMileage('');
      setPlate('');
      Alert.alert('Vehicle Added!', `${newVehicle.year} ${newVehicle.make} ${newVehicle.model} added to your garage.`);
    } catch (e: unknown) {
      Alert.alert('Could not save vehicle', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveVehicle = (id: string, name: string) => {
    Alert.alert(
      'Remove Vehicle',
      `Are you sure you want to remove ${name} from your garage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const { error } = await supabase.from('vehicles').delete().eq('id', id);
              if (error) {
                Alert.alert('Remove failed', error.message);
                return;
              }
              onVehiclesChange(vehicles.filter((v) => v.id !== id));
            })();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>My Garage</Text>
          <Text style={styles.screenSubtitle}>
            {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} registered for mobile dispatch
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add Vehicle</Text>
        </TouchableOpacity>
      </View>

      {vehicles.length === 0 && (
        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleName}>No vehicles yet</Text>
          <Text style={styles.vehicleTrim}>
            Add your car to book mobile service with a card hold.
          </Text>
        </View>
      )}

      {/* Vehicle Cards List */}
      {vehicles.map(v => {
        const isWarning = v.healthStatus === 'warning';
        const isUrgent = v.healthStatus === 'urgent';

        return (
          <View key={v.id} style={styles.vehicleCard}>
            <View style={styles.cardHeader}>
              <View style={styles.vehicleTitleBox}>
                <Text style={styles.vehicleName}>
                  {v.year} {v.make} {v.model}
                </Text>
                {v.trim && <Text style={styles.vehicleTrim}>{v.trim}</Text>}
              </View>

              <TouchableOpacity
                onPress={() => handleRemoveVehicle(v.id, `${v.year} ${v.make} ${v.model}`)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            </View>

            {/* Health Status Badge */}
            <View
              style={[
                styles.statusBadge,
                isWarning && styles.statusBadgeWarning,
                isUrgent && styles.statusBadgeUrgent,
              ]}
            >
              <Ionicons
                name={isUrgent ? 'alert-circle' : isWarning ? 'warning' : 'checkmark-circle'}
                size={14}
                color={
                  isUrgent
                    ? colors.status.error
                    : isWarning
                      ? colors.status.warning
                      : colors.status.success
                }
              />
              <Text
                style={[
                  styles.statusText,
                  isWarning && styles.statusTextWarning,
                  isUrgent && styles.statusTextUrgent,
                ]}
              >
                {v.healthLabel}
              </Text>
            </View>

            {/* Specs Grid */}
            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>VIN</Text>
                <Text style={styles.specValue}>{v.vin}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>PLATE</Text>
                <Text style={styles.specValue}>{v.licensePlate}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>MILEAGE</Text>
                <Text style={styles.specValue}>{v.mileage}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.bookServiceBtn}
                onPress={() => onBookForVehicle(v)}
                activeOpacity={0.8}
              >
                <Text style={styles.bookServiceText}>🔧 Request Service / Quote</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {vehicles.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>Your Garage is Empty</Text>
          <Text style={styles.emptyText}>
            Add your vehicle to start requesting quotes and booking mobile service appointments.
          </Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.emptyAddText}>+ Add First Vehicle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Vehicle Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚘 Add New Vehicle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Year *</Text>
              <TextInput
                style={styles.input}
                placeholder="2024"
                placeholderTextColor={colors.text.muted}
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Make *</Text>
              <TextInput
                style={styles.input}
                placeholder="Make (e.g. Ford)"
                placeholderTextColor={colors.text.muted}
                value={make}
                onChangeText={setMake}
              />

              <Text style={styles.inputLabel}>Model *</Text>
              <TextInput
                style={styles.input}
                placeholder="Model (e.g. F-150)"
                placeholderTextColor={colors.text.muted}
                value={model}
                onChangeText={setModel}
              />

              <Text style={styles.inputLabel}>VIN (Vehicle Identification Number)</Text>
              <TextInput
                style={styles.input}
                placeholder="17-Digit VIN Number"
                placeholderTextColor={colors.text.muted}
                value={vin}
                onChangeText={setVin}
                autoCapitalize="characters"
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Current Mileage</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="25,400"
                    placeholderTextColor={colors.text.muted}
                    value={mileage}
                    onChangeText={setMileage}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>License Plate</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="TX-8910"
                    placeholderTextColor={colors.text.muted}
                    value={plate}
                    onChangeText={setPlate}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveVehicleBtn, saving && { opacity: 0.6 }]}
                onPress={() => void handleAddVehicle()}
                activeOpacity={0.8}
                disabled={saving}
              >
                <Text style={styles.saveVehicleText}>
                  {saving ? 'Saving…' : 'Save to Garage'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { padding: spacing.lg, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  screenTitle: { fontSize: 22, fontWeight: '900', color: colors.text.primary },
  screenSubtitle: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  addBtn: {
    backgroundColor: colors.brand.orange,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  vehicleCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  vehicleTitleBox: { flex: 1 },
  vehicleName: { fontSize: 18, fontWeight: '800', color: colors.text.primary },
  vehicleTrim: { fontSize: 12, color: colors.brand.orange, fontWeight: '700', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusBadgeUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusText: { fontSize: 12, fontWeight: '700', color: colors.status.success },
  statusTextWarning: { color: colors.status.warning },
  statusTextUrgent: { color: colors.status.error },
  specsGrid: {
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  specItem: { flex: 1 },
  specLabel: { fontSize: 9, fontWeight: '800', color: colors.text.muted, letterSpacing: 0.5 },
  specValue: { fontSize: 11, fontWeight: '700', color: colors.text.secondary, marginTop: 2 },
  actionRow: { marginTop: 4 },
  bookServiceBtn: {
    backgroundColor: colors.brand.orangeGlow,
    borderWidth: 1,
    borderColor: colors.border.orange,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  bookServiceText: { color: colors.brand.orange, fontWeight: '800', fontSize: 13 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.xl,
  },
  emptyIcon: { fontSize: 44, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text.primary, marginBottom: 6 },
  emptyText: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  emptyAddBtn: {
    backgroundColor: colors.brand.orange,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
  },
  emptyAddText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text.primary },
  closeBtn: { fontSize: 20, color: colors.text.muted, padding: 4 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    color: colors.text.primary,
    fontSize: 14,
  },
  rowInputs: { flexDirection: 'row', gap: spacing.md },
  saveVehicleBtn: {
    backgroundColor: colors.brand.orange,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  saveVehicleText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
