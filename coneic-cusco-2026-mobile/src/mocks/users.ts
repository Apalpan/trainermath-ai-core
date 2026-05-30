import type { User } from '../types';

export const mockUser: User = {
  id: 'user-carlos-rojas',
  fullName: 'Carlos Rojas Quispe',
  firstName: 'Carlos',
  email: 'participante@coneic.com',
  dni: '12345678',
  phone: '+51 987 654 321',
  university: 'Universidad Nacional de Ingeniería',
  participantCode: 'CNE-2026-04821',
  role: 'participant',
  registrationStage: 'Preventa',
  verified: true,
  paymentConfirmed: true,
  accessEnabled: true,
  accumulatedHours: 18,
  requiredHours: 30,
};

export const validCredentials = {
  email: 'participante@coneic.com',
  passcode: '12345678',
};
