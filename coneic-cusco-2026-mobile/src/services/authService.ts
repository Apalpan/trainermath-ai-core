import { mockUser, validCredentials } from '../mocks/users';
import type { User } from '../types';
import { delay, rejectAfter } from './delay';

export const authService = {
  async login(email: string, passcode: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === validCredentials.email && passcode.trim() === validCredentials.passcode) {
      return delay(mockUser);
    }

    return rejectAfter('Credenciales invalidas. Usa apalpan@coneic.com y 12345678.');
  },

  async logout(): Promise<boolean> {
    return delay(true, 180, 360);
  },
};
