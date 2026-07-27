import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Switch,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { supabase } from '../lib/supabase';

interface SettingsScreenProps {
  customerName: string;
  customerEmail: string;
  onLogout: () => void;
  onUpdateProfile: (name: string, email: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  customerName,
  customerEmail,
  onLogout,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(customerName);
  const [email, setEmail] = useState(customerEmail);
  const [phone, setPhone] = useState('(555) 234-8910');

  // Change Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences state
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [serviceReminders, setServiceReminders] = useState(true);

  const handleSaveProfile = () => {
    onUpdateProfile(name, email);
    Alert.alert('Profile Updated', 'Your customer account details have been saved.');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please complete all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: customerEmail,
      password: currentPassword,
    });
    if (reauthError) {
      Alert.alert('Incorrect Password', 'Your current password is not correct.');
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      Alert.alert('Update Failed', updateError.message);
      return;
    }

    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Password Changed', 'Your password has been updated.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>⚙️ Customer Settings</Text>
      <Text style={styles.screenSubtitle}>
        Manage your profile, update email & password, and configure dispatch notifications.
      </Text>

      {/* Account Profile Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>👤</Text>
          <Text style={styles.cardTitle}>Account Profile</Text>
        </View>

        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full Name"
          placeholderTextColor={colors.text.muted}
        />

        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email Address"
          placeholderTextColor={colors.text.muted}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Phone Number (For SMS Dispatch Tracking)</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone Number"
          placeholderTextColor={colors.text.muted}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveProfile}>
          <Text style={styles.saveProfileText}>💾 Save Profile Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Security & Password Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>🔒</Text>
          <Text style={styles.cardTitle}>Security & Login</Text>
        </View>

        <View style={styles.securityRow}>
          <View>
            <Text style={styles.securityLabel}>Account Password</Text>
            <Text style={styles.securitySub}>Last updated 30 days ago</Text>
          </View>
          <TouchableOpacity
            style={styles.changePasswordBtn}
            onPress={() => setShowPasswordModal(true)}
          >
            <Text style={styles.changePasswordText}>🔑 Change Password</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Saved Payment Methods (Stripe) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>💳</Text>
          <Text style={styles.cardTitle}>Payment Methods</Text>
        </View>

        <View style={styles.cardItemRow}>
          <View style={styles.cardIconBox}>
            <Text style={{ fontSize: 18 }}>💳</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardItemTitle}>Visa ending in •••• 4910</Text>
            <Text style={styles.cardItemSub}>Primary Payment • Expires 08/28</Text>
          </View>
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addPaymentBtn}
          onPress={() => Alert.alert('Stripe Integration', 'Redirecting to Stripe secure card vault...')}
        >
          <Text style={styles.addPaymentText}>+ Add New Credit/Debit Card</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications Preferences */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>🔔</Text>
          <Text style={styles.cardTitle}>Dispatch Notifications</Text>
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>SMS Dispatch Alerts</Text>
            <Text style={styles.switchSub}>Real-time SMS when your mobile technician is en route.</Text>
          </View>
          <Switch
            value={smsAlerts}
            onValueChange={setSmsAlerts}
            trackColor={{ false: colors.bg.input, true: colors.brand.orange }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Email Receipts & DVI Reports</Text>
            <Text style={styles.switchSub}>Receive digital invoices & vehicle diagnostic logs.</Text>
          </View>
          <Switch
            value={emailReceipts}
            onValueChange={setEmailReceipts}
            trackColor={{ false: colors.bg.input, true: colors.brand.orange }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Maintenance Reminders</Text>
            <Text style={styles.switchSub}>Alerts when oil service or brake inspection is due.</Text>
          </View>
          <Switch
            value={serviceReminders}
            onValueChange={setServiceReminders}
            trackColor={{ false: colors.bg.input, true: colors.brand.orange }}
          />
        </View>
      </View>

      {/* Log Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>🚪 Log Out of Customer Account</Text>
      </TouchableOpacity>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔑 Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="••••••••••••"
              placeholderTextColor={colors.text.muted}
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="At least 6 characters"
              placeholderTextColor={colors.text.muted}
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Re-enter new password"
              placeholderTextColor={colors.text.muted}
            />

            <TouchableOpacity style={styles.savePasswordBtn} onPress={() => void handleChangePassword()}>
              <Text style={styles.savePasswordText}>🔒 Update Password</Text>
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
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  cardEmoji: { fontSize: 18 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text.primary },
  inputLabel: { fontSize: 11, fontWeight: '700', color: colors.text.secondary, marginBottom: 4, marginTop: spacing.sm },
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
  saveProfileBtn: {
    backgroundColor: colors.brand.orange,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveProfileText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  securityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  securityLabel: { fontSize: 13, fontWeight: '700', color: colors.text.primary },
  securitySub: { fontSize: 11, color: colors.text.muted },
  changePasswordBtn: {
    backgroundColor: colors.brand.orangeGlow,
    borderWidth: 1,
    borderColor: colors.border.orange,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  changePasswordText: { fontSize: 12, fontWeight: '800', color: colors.brand.orange },
  cardItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bg.input,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardItemTitle: { fontSize: 13, fontWeight: '700', color: colors.text.primary },
  cardItemSub: { fontSize: 10, color: colors.text.muted, marginTop: 2 },
  defaultBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  defaultText: { fontSize: 9, fontWeight: '700', color: colors.status.success },
  addPaymentBtn: {
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addPaymentText: { fontSize: 12, color: colors.text.secondary, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  switchTitle: { fontSize: 13, fontWeight: '700', color: colors.text.primary },
  switchSub: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: borderRadius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  logoutText: { color: colors.status.error, fontSize: 14, fontWeight: '800' },
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
  savePasswordBtn: {
    backgroundColor: colors.brand.orange,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  savePasswordText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
