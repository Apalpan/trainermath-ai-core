import type { AttendanceRecord } from '../types';

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-bim',
    eventTitle: 'Ponencia BIM y Transformación Digital',
    date: '10 agosto · 09:30',
    hours: 2,
    status: 'validated',
  },
  {
    id: 'att-gestion',
    eventTitle: 'Gestión de proyectos e infraestructura',
    date: '11 agosto · 09:00',
    hours: 2,
    status: 'validated',
  },
  {
    id: 'att-puentes',
    eventTitle: 'Concurso estructuras',
    date: '11 agosto · 11:00',
    hours: 3,
    status: 'validated',
  },
  {
    id: 'att-vial',
    eventTitle: 'Visita técnica a obra vial',
    date: '11 agosto · 14:00',
    hours: 4,
    status: 'pending',
  },
  {
    id: 'att-sostenibilidad',
    eventTitle: 'Ingeniería sostenible y cambio climático',
    date: '13 agosto · 09:00',
    hours: 2,
    status: 'validated',
  },
  {
    id: 'att-cultural',
    eventTitle: 'Noche sociocultural de delegaciones',
    date: '13 agosto · 19:30',
    hours: 5,
    status: 'validated',
  },
];
