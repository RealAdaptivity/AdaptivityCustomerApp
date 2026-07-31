import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  StatusBar, KeyboardAvoidingView, Platform, StyleSheet, Alert, Modal, ScrollView, Image,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { signInCustomer, signUpCustomer, supabase } from '../lib/supabase';

interface AuthScreenProps {
  onLogin: (customerName: string, email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both email and password.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name for your customer account.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUpCustomer(email.trim(), password, fullName.trim(), phone.trim() || undefined);
        if (error) throw error;
        Alert.alert('Account Created', 'Check your email to confirm, then sign in.');
        setIsSignUp(false);
        return;
      }
      const { data, error } = await signInCustomer(email.trim(), password);
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials')) {
          throw new Error(
            'Email or password is incorrect. Create an account with Sign Up if you haven’t yet, or use Forgot Password.'
          );
        }
        throw error;
      }
      const nameToUse =
        data.user?.user_metadata?.full_name ||
        fullName.trim() ||
        email.split('@')[0] ||
        'Valued Customer';
      onLogin(nameToUse, email.trim());
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Authentication failed.';
      Alert.alert('Auth Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address to receive a password reset link.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
    if (error) {
      Alert.alert('Reset Failed', error.message);
      return;
    }
    setResetSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setResetSent(false);
      setResetEmail('');
      Alert.alert('Password Reset Sent', `A reset link has been dispatched to ${resetEmail}`);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo Header */}
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logoIcon} />
            <Text style={styles.logoTitle}>
              ADAPTIVITY <Text style={styles.logoAccent}>PERFORMANCE</Text>
            </Text>
            <Text style={styles.logoSubtitle}>MOBILE DISPATCH & GARAGE PORTAL</Text>
          </View>

          {/* Auth Switcher Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.authTab, !isSignUp && styles.authTabActive]}
              onPress={() => setIsSignUp(false)}
            >
              <Text style={[styles.authTabText, !isSignUp && styles.authTabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authTab, isSignUp && styles.authTabActive]}
              onPress={() => setIsSignUp(true)}
            >
              <Text style={[styles.authTabText, isSignUp && styles.authTabTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Auth Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isSignUp ? 'Join Adaptivity Garage' : 'Welcome Back'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {isSignUp
                ? 'Create your customer account to track services, manage your garage & book mobile mechanics.'
                : 'Access your vehicle health, booking history & mobile dispatch updates.'}
            </Text>

            {isSignUp && (
              <>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor={colors.text.muted}
                  value={fullName}
                  onChangeText={setFullName}
                />

                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(214) 555-0100"
                  placeholderTextColor={colors.text.muted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            )}

            {/* Email Input */}
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@email.com"
              placeholderTextColor={colors.text.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password Input */}
            <View style={styles.passwordHeaderRow}>
              <Text style={styles.inputLabel}>Password</Text>
              {!isSignUp && (
                <TouchableOpacity onPress={() => setShowForgotModal(true)}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor={colors.text.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.submitText}>
                {loading
                  ? '⏳ Authenticating...'
                  : isSignUp
                  ? '🚀 Create Account & Enter Garage'
                  : '🔓 Sign In to Mobile Portal'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgotModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔑 Reset Your Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your customer email and we will send you a secure verification link to reset your account password.
            </Text>

            <Text style={styles.inputLabel}>Account Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              placeholderTextColor={colors.text.muted}
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowForgotModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={handleSendReset}
                disabled={resetSent}
              >
                <Text style={styles.modalResetText}>
                  {resetSent ? 'Sending...' : 'Send Link'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  logoIcon: {
    width: 72,
    height: 72,
    marginBottom: spacing.sm,
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  logoAccent: { color: colors.brand.orange },
  logoSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 2,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    padding: 4,
    width: '100%',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  authTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  authTabActive: {
    backgroundColor: colors.brand.orange,
  },
  authTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.muted,
  },
  authTabTextActive: {
    color: '#ffffff',
  },
  card: {
    width: '100%',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.xl,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  passwordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand.orange,
  },
  input: {
    width: '100%',
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.text.primary,
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: colors.brand.orange,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing['2xl'],
    shadowColor: colors.brand.orange,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  modalCancelText: {
    color: colors.text.secondary,
    fontWeight: '700',
  },
  modalResetBtn: {
    flex: 1,
    backgroundColor: colors.brand.orange,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  modalResetText: {
    color: '#fff',
    fontWeight: '800',
  },
});
