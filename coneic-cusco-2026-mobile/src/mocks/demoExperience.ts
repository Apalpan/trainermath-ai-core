import type { DemoTimelineItem, EventHighlight, OnboardingFact } from '../types';

export const onboardingFacts: OnboardingFact[] = [
  {
    id: 'capacity',
    label: 'Escala nacional',
    value: '6000',
    helper: 'participantes esperados',
  },
  {
    id: 'venue',
    label: 'Sede principal',
    value: 'UAC',
    helper: 'Universidad Andina del Cusco',
  },
  {
    id: 'dates',
    label: 'Evento',
    value: '10-14 AGO',
    helper: 'Cusco, Peru',
  },
];

export const onboardingSlides = [
  {
    id: 'ecosystem',
    title: 'Todo el CONEIC en una experiencia mobile',
    body: 'Agenda, QR, check-in, mapas, rankings y certificados conectados para operar un evento nacional sin friccion.',
    signal: 'Ecosistema Web & App',
  },
  {
    id: 'control',
    title: 'Menos colas, cero planillas, horas verificables',
    body: 'Cada participante tiene QR unico, historial de asistencias y progreso de certificacion visible en tiempo real.',
    signal: 'Check-in inteligente',
  },
  {
    id: 'assistant',
    title: 'Asistente 24/7 para no saturar al comite',
    body: 'Respuestas inmediatas sobre inscripcion, pagos, agenda, sedes, visitas, certificados y soporte humano.',
    signal: 'CONEIC Assistant',
  },
];

export const eventHighlights: EventHighlight[] = [
  {
    id: 'qr',
    title: 'Mostrar QR',
    description: 'Ingreso, acreditacion y asistencia desde una credencial unica.',
    metric: 'Activo',
    route: 'ProfileTab',
  },
  {
    id: 'visit',
    title: 'Reservar visita',
    description: 'Cupos y recomendaciones para visitas tecnicas y turisticas.',
    metric: '6 rutas',
    route: 'Visits',
  },
  {
    id: 'hours',
    title: 'Revisar horas',
    description: 'Horas acumuladas, meta y eventos pendientes de validacion.',
    metric: '24/30 h',
    route: 'CheckIn',
  },
  {
    id: 'assistant',
    title: 'Preguntar al asistente',
    description: 'Agenda, pagos, sedes, certificados y soporte en un chat.',
    metric: '24/7',
    route: 'AssistantTab',
  },
];

export const demoTimeline: DemoTimelineItem[] = [
  {
    id: 'tl-1',
    time: '09:30',
    title: 'BIM y Transformacion Digital',
    place: 'Auditorio Principal UAC',
    status: 'now',
    route: 'EventDetail',
  },
  {
    id: 'tl-2',
    time: '11:00',
    title: 'Puentes de spaghetti',
    place: 'Sala A',
    status: 'next',
    route: 'Contests',
  },
  {
    id: 'tl-3',
    time: '14:00',
    title: 'Visita tecnica a obra vial',
    place: 'Punto de buses',
    status: 'open',
    route: 'Visits',
  },
  {
    id: 'tl-4',
    time: '18:00',
    title: 'Feria gastronomica regional',
    place: 'Feria Gastronomica',
    status: 'open',
    route: 'MapTab',
  },
];
