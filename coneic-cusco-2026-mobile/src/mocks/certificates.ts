import type { Certificate } from '../types';
import { mockUser } from './users';

export const certificates: Certificate[] = [
  {
    id: 'cert-general',
    title: 'Certificado de participación general',
    status: 'inProgress',
    userName: mockUser.fullName,
    hours: 18,
    requiredHours: 30,
    verificationCode: 'CERT-CONEIC-2026-GEN-04821',
    description: 'Certificado principal al cumplir el mínimo de horas verificadas del evento.',
  },
  {
    id: 'cert-bim',
    title: 'Certificado ponencias BIM y transformación digital',
    status: 'available',
    userName: mockUser.fullName,
    hours: 8,
    requiredHours: 6,
    verificationCode: 'CERT-CONEIC-2026-BIM-04821',
    description: 'Constancia por asistencia a bloque de transformación digital.',
  },
  {
    id: 'cert-concursos',
    title: 'Certificado de concursos académicos',
    status: 'locked',
    userName: mockUser.fullName,
    hours: 3,
    requiredHours: 8,
    verificationCode: 'CERT-CONEIC-2026-CON-04821',
    description: 'Se desbloquea al completar participación y validación de concursos.',
  },
  {
    id: 'cert-visitas',
    title: 'Certificado de visitas técnicas',
    status: 'inProgress',
    userName: mockUser.fullName,
    hours: 4,
    requiredHours: 8,
    verificationCode: 'CERT-CONEIC-2026-VIS-04821',
    description: 'Evidencia de asistencia a visitas técnicas del congreso.',
  },
];
