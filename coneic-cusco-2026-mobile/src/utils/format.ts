import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDay(date: string) {
  return format(parseISO(date), "d 'de' MMMM", { locale: es });
}

export function formatTime(date: string) {
  return format(parseISO(date), 'HH:mm', { locale: es });
}

export function maskDni(dni: string) {
  if (dni.length <= 4) return '****';
  return `${dni.slice(0, 2)}****${dni.slice(-2)}`;
}

export function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function shortId(prefix = 'msg') {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}
