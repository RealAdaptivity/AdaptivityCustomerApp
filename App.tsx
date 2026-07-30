import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthScreen } from './src/screens/AuthScreen';
import { GarageScreen, Vehicle } from './src/screens/GarageScreen';
import { BookServiceScreen } from './src/screens/BookServiceScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { TrackJobScreen } from './src/screens/TrackJobScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme/colors';
import { STRIPE_PUBLISHABLE_KEY } from './src/config/stripePublic';
import { fetchMyVehicles, supabase, type VehicleRow } from './src/lib/supabase';
import { registerDevicePushToken } from './src/lib/pushNotifications';

type TabId = 'garage' | 'book' | 'track' | 'history' | 'settings';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'garage', label: 'Garage', icon: '🏎️' },
  { id: 'book', label: 'Book Service', icon: '⚡' },
  { id: 'track', label: 'Track', icon: '📍' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function mapVehicleRow(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    year: row.year || '',
    make: row.make,
    model: row.model,
    trim: row.trim || undefined,
    vin: row.vin || 'VIN-NOT-PROVIDED',
    licensePlate: row.license_plate || 'N/A',
    mileage: row.mileage || '0 mi',
    healthStatus: row.health_status || 'good',
    healthLabel: row.health_label || 'Initial Inspection Pending',
  };
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('garage');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<string | undefined>();
  const [bookPrefillServices, setBookPrefillServices] = useState<string[] | undefined>();
  const [bookPrefillVehicle, setBookPrefillVehicle] = useState<string | undefined>();

  const applyUser = useCallback((user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  } | null) => {
    if (!user) {
      setIsAuthenticated(false);
      setUserId(null);
      setCustomerName('');
      setCustomerEmail('');
      setVehicles([]);
      return;
    }
    const meta = user.user_metadata || {};
    setUserId(user.id);
    setCustomerEmail(user.email || '');
    setCustomerName(
      (typeof meta.full_name === 'string' && meta.full_name) ||
        user.email?.split('@')[0] ||
        'Customer'
    );
    setIsAuthenticated(true);
  }, []);

  const refreshVehicles = useCallback(async (uid: string) => {
    try {
      const rows = await fetchMyVehicles(uid);
      setVehicles(rows.map(mapVehicleRow));
    } catch (e) {
      console.warn('[vehicles]', e);
      setVehicles([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      applyUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [applyUser]);

  useEffect(() => {
    if (userId) {
      void refreshVehicles(userId);
      void registerDevicePushToken('customer');
    }
  }, [userId, refreshVehicles]);

  const handleLogin = (_name: string, _email: string) => {
    void supabase.auth.getSession().then(({ data }) => {
      applyUser(data.session?.user ?? null);
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserId(null);
    setVehicles([]);
    setActiveTab('garage');
  };

  const handleBookForVehicle = (vehicle: Vehicle) => {
    setSelectedVehicleForBooking(vehicle.id);
    setBookPrefillServices(undefined);
    setBookPrefillVehicle(undefined);
    setActiveTab('book');
  };

  const handleQuickBookRecommended = (
    title: string,
    cost: number,
    opts?: { services?: string[]; vehicleName?: string }
  ) => {
    const services = opts?.services?.length ? opts.services : title ? [title] : undefined;
    setBookPrefillServices(services);
    setBookPrefillVehicle(opts?.vehicleName);
    if (opts?.vehicleName) {
      const match = vehicles.find(
        (v) => `${v.year} ${v.make} ${v.model}`.toLowerCase() === opts.vehicleName!.toLowerCase()
      );
      setSelectedVehicleForBooking(match?.id);
    } else {
      setSelectedVehicleForBooking(undefined);
    }
    Alert.alert(
      'Ready to rebook',
      cost > 0
        ? `Prefilling "${title}" from your history. Confirm services and card hold on the Book tab.`
        : 'Opening booking — pick services and confirm your card hold.'
    );
    setActiveTab('book');
  };

  if (!authReady) {
    return (
      <SafeAreaView style={[styles.container, styles.boot]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />
        <ActivityIndicator color={colors.brand.orange} size="large" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (!STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    return (
      <SafeAreaView style={[styles.container, styles.boot]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />
        <Text style={{ color: colors.text.primary, padding: 24, textAlign: 'center' }}>
          Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY. Sync from adaptivity-performance with
          scripts/sync-expo-env.mjs, then restart Expo.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogo}>
              <Text style={styles.headerLogoEmoji}>🏎️</Text>
            </View>
            <View>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle}>ADAPTIVITY</Text>
                <View style={styles.customerBadge}>
                  <Text style={styles.customerBadgeText}>CLIENT PORTAL</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>
                Welcome back,{' '}
                <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{customerName}</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.activeVehicleBadge} onPress={() => setActiveTab('garage')}>
            <Text style={styles.activeVehicleText}>
              {vehicles.length} Vehicle{vehicles.length === 1 ? '' : 's'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.screenContainer}>
          {activeTab === 'garage' && userId && (
            <GarageScreen
              userId={userId}
              vehicles={vehicles}
              onVehiclesChange={setVehicles}
              onBookForVehicle={handleBookForVehicle}
            />
          )}
          {activeTab === 'book' && (
            <BookServiceScreen
              key={`${selectedVehicleForBooking || 'none'}-${(bookPrefillServices || []).join(',')}`}
              vehicles={vehicles}
              selectedVehicleId={selectedVehicleForBooking}
              prefillServices={bookPrefillServices}
              prefillVehicleName={bookPrefillVehicle}
              onBookingSuccess={() => setActiveTab('track')}
            />
          )}
          {activeTab === 'track' && <TrackJobScreen />}
          {activeTab === 'history' && (
            <HistoryScreen onQuickBookRecommended={handleQuickBookRecommended} />
          )}
          {activeTab === 'settings' && (
            <SettingsScreen
              customerName={customerName}
              customerEmail={customerEmail}
              onLogout={() => void handleLogout()}
              onUpdateProfile={(name, email) => {
                setCustomerName(name);
                setCustomerEmail(email);
              }}
            />
          )}
        </View>

        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => {
                  if (tab.id !== 'book') {
                    setSelectedVehicleForBooking(undefined);
                    setBookPrefillServices(undefined);
                    setBookPrefillVehicle(undefined);
                  }
                  setActiveTab(tab.id);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                {isActive && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  boot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bg.primary,
    borderWidth: 2,
    borderColor: colors.brand.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoEmoji: { fontSize: 16 },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  customerBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customerBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.brand.orange,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  activeVehicleBadge: {
    backgroundColor: colors.bg.input,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  activeVehicleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  screenContainer: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  tabItemActive: {},
  tabIcon: { fontSize: 18, marginBottom: 2 },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.muted,
  },
  tabLabelActive: { color: colors.brand.orange },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.brand.orange,
  },
});
