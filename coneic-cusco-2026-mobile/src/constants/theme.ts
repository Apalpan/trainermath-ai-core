import { Platform, StyleSheet } from 'react-native';

export const colors = {
  navyDeep: '#0B1A35',
  navy: '#132247',
  card: '#182D52',
  cardStrong: '#203A68',
  gold: '#F2C118',
  purple: '#9B4DFF',
  white: '#FFFFFF',
  offWhite: '#F5F4F0',
  text: '#F7F8FF',
  textSecondary: '#A8B2C4',
  border: '#2A4070',
  borderSoft: 'rgba(255,255,255,0.12)',
  success: '#48C78E',
  danger: '#FF6B6B',
  warning: '#F7A84B',
  muted: '#64728B',
  overlay: 'rgba(2, 8, 23, 0.72)',
  transparent: 'transparent',
};

export const gradients = {
  app: [colors.navyDeep, '#10163C', colors.navy] as const,
  hero: ['#0B1A35', '#1C2465', '#5521A8'] as const,
  gold: ['#F2C118', '#FFE07A'] as const,
  card: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)'] as const,
  purple: ['#9B4DFF', '#4D7CFF'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const typography = {
  hero: 34,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  small: 13,
  tiny: 11,
};

export const shadows = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.28 : 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  soft: {
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.18 : 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
});

export const eventMeta = {
  name: 'CONEIC Cusco 2026',
  fullName: 'XXXIII CONEIC Cusco 2026',
  subtitle: 'Aplicativo oficial del participante',
  dates: '10-14 agosto',
  location: 'Cusco, Peru',
  venue: 'Universidad Andina del Cusco',
  supportEmail: 'xxxiiiconeiccusco2026@gmail.com',
  capacity: '6000 participantes',
  promise: 'Menos colas, cero planillas y horas acumuladas verificables',
};

export const typeLabels: Record<string, string> = {
  talk: 'Ponencia',
  contest: 'Concurso',
  technicalVisit: 'Visita técnica',
  tourismVisit: 'Visita turística',
  fair: 'Feria',
  sociocultural: 'Sociocultural',
  sport: 'Deportivo',
  networking: 'Networking',
  checkin: 'Registro',
};

export const statusLabels: Record<string, string> = {
  available: 'Disponible',
  full: 'Lleno',
  registered: 'Inscrito',
  live: 'En vivo',
  finished: 'Finalizado',
  locked: 'Bloqueado',
  inProgress: 'En progreso',
  reserved: 'Reservado',
  validated: 'Validado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
};
