import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

import { authService } from '../services/authService';
import type { User } from '../types';

const SESSION_KEY = 'coneic.session.user';
const ONBOARDING_KEY = 'coneic.onboarding.complete';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isRestoring: boolean;
  error: string | null;
  restoreSession: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  login: (email: string, passcode: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  isRestoring: true,
  error: null,

  async restoreSession() {
    const [storedUser, onboarding] = await Promise.all([
      AsyncStorage.getItem(SESSION_KEY),
      AsyncStorage.getItem(ONBOARDING_KEY),
    ]);

    set({
      user: storedUser ? JSON.parse(storedUser) : null,
      isAuthenticated: Boolean(storedUser),
      hasCompletedOnboarding: onboarding === 'true',
      isRestoring: false,
      error: null,
    });
  },

  async completeOnboarding() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ hasCompletedOnboarding: true });
  },

  async login(email: string, passcode: string) {
    set({ error: null });
    const user = await authService.login(email, passcode);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    set({ user, isAuthenticated: true, error: null });
  },

  async logout() {
    await authService.logout();
    await AsyncStorage.removeItem(SESSION_KEY);
    set({ user: null, isAuthenticated: false, error: null });
  },
}));
