import type { Certificate } from '../types';
import { mockUser } from './users';

export const certificates: Certificate[] = [
  {
    id: 'cert-general',
    title: 'Certificado de participación general',
    status: 'inProgress',
    userName: mockUser.fullName,
    hours: mockUser.accumulatedHours,
    requiredHours: 30,
    verificationCode: 'CERT-CONEIC-2026-GEN-00001',
    description: 'Certificado principal al cumplir el mínimo de horas verificadas del evento.',
  },
  {
    id: 'cert-bim',
    title: 'Certificado ponencias BIM y transformación digital',
    status: 'available',
    userName: mockUser.fullName,
    hours: 10,
    requiredHours: 6,
    verificationCode: 'CERT-CONEIC-2026-BIM-00001',
    description: 'Constancia por asistencia a bloque de transformación digital.',
  },
  {
    id: 'cert-concursos',
    title: 'Certificado de concursos académicos',
    status: 'locked',
    userName: mockUser.fullName,
    hours: 6,
    requiredHours: 8,
    verificationCode: 'CERT-CONEIC-2026-CON-00001',
    description: 'Se desbloquea al completar participación y validación de concursos.',
  },
  {
    id: 'cert-visitas',
    title: 'Certificado de visitas técnicas',
    status: 'available',
    userName: mockUser.fullName,
    hours: 8,
    requiredHours: 8,
    verificationCode: 'CERT-CONEIC-2026-VIS-00001',
    description: 'Evidencia de asistencia a visitas técnicas del congreso.',
  },
];
