import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Bot, CalendarDays, Home, Map, QrCode } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { AgendaScreen } from '../screens/agenda/AgendaScreen';
import { EventDetailScreen } from '../screens/agenda/EventDetailScreen';
import { AssistantScreen } from '../screens/assistant/AssistantScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { CertificatesScreen } from '../screens/certificates/CertificatesScreen';
import { CheckInScreen } from '../screens/checkin/CheckInScreen';
import { ContestsScreen } from '../screens/contests/ContestsScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { StatsScreen } from '../screens/stats/StatsScreen';
import { SpeakerDetailScreen } from '../screens/talks/SpeakerDetailScreen';
import { TalksScreen } from '../screens/talks/TalksScreen';
import { VisitsScreen } from '../screens/visits/VisitsScreen';
import { useAuthStore } from '../store/authStore';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.navyDeep,
    card: colors.navy,
    text: colors.white,
    border: colors.border,
    primary: colors.gold,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, focused }) => {
          const size = route.name === 'ProfileTab' ? 26 : 21;
          const iconColor = route.name === 'ProfileTab' ? colors.navyDeep : color;
          const Icon =
            route.name === 'HomeTab'
              ? Home
              : route.name === 'AgendaTab'
                ? CalendarDays
                : route.name === 'ProfileTab'
                  ? QrCode
                  : route.name === 'MapTab'
                    ? Map
                    : Bot;

          if (route.name === 'ProfileTab') {
            return (
              <View style={[styles.qrTab, focused && styles.qrTabFocused]}>
                <Icon color={iconColor} size={size} />
              </View>
            );
          }

          return <Icon color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="AgendaTab" component={AgendaScreen} options={{ title: 'Agenda' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'QR' }} />
      <Tab.Screen name="MapTab" component={MapScreen} options={{ title: 'Mapa' }} />
      <Tab.Screen name="AssistantTab" component={AssistantScreen} options={{ title: 'Asistente' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    restoreSession();
    const timer = setTimeout(() => setBootReady(true), 900);
    return () => clearTimeout(timer);
  }, [restoreSession]);

  if (!bootReady || isRestoring) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="SpeakerDetail" component={SpeakerDetailScreen} />
            <Stack.Screen name="Talks" component={TalksScreen} />
            <Stack.Screen name="Contests" component={ContestsScreen} />
            <Stack.Screen name="Visits" component={VisitsScreen} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="Certificates" component={CertificatesScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    minHeight: 72,
    borderRadius: radius.xl,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(11,26,53,0.96)',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  tabLabel: {
    fontSize: typography.tiny,
    fontWeight: '800',
  },
  qrTab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 4,
    borderColor: colors.navyDeep,
  },
  qrTabFocused: {
    backgroundColor: '#FFE07A',
  },
});
