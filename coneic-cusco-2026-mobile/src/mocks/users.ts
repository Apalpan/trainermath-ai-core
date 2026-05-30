import type { User } from '../types';

export const mockUser: User = {
  id: 'user-alejandro-palpan',
  fullName: 'Alejandro Palpan',
  firstName: 'Alejandro',
  email: 'apalpan@coneic.com',
  dni: '12345678',
  phone: '+51 987 654 321',
  university: 'GEN+ / Invitado estrategico',
  participantCode: 'CNE-2026-00001',
  role: 'participant',
  registrationStage: 'Invitado estrategico GEN+',
  verified: true,
  paymentConfirmed: true,
  accessEnabled: true,
  accumulatedHours: 24,
  requiredHours: 30,
};

export const validCredentials = {
  email: 'apalpan@coneic.com',
  passcode: '12345678',
};
