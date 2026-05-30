import type { AssistantKnowledgeItem } from '../types';

export const assistantKnowledge: AssistantKnowledgeItem[] = [
  {
    id: 'agenda',
    intent: 'agenda',
    title: 'Agenda y eventos',
    answer:
      'La agenda esta organizada por dia, hora y tipo de actividad. Puedes filtrar ponencias, concursos, ferias, visitas tecnicas, visitas turisticas y actividades socioculturales. Para el demo, tu siguiente evento recomendado es BIM y Transformacion Digital en el Auditorio Principal UAC.',
    keywords: ['agenda', 'evento', 'horario', 'ponencia', 'charla', 'programa', 'dia', 'donde'],
    sourceLabel: 'PPT slide 10: APP CONEIC - Agenda',
    confidence: 0.96,
    actions: [
      { label: 'Abrir agenda', route: 'AgendaTab' },
      { label: 'Ver ponencias', route: 'Talks' },
    ],
  },
  {
    id: 'qr-checkin',
    intent: 'qr_checkin',
    title: 'QR y check-in',
    answer:
      'Tu QR es unico por participante y sirve para acreditacion, ingreso y registro de asistencia por evento. En produccion debe usar token firmado, validar contra backend y prevenir duplicidad de asistencia. En este demo puedes abrir tu credencial desde el tab QR.',
    keywords: ['qr', 'check', 'check-in', 'ingreso', 'credencial', 'asistencia', 'validacion'],
    sourceLabel: 'PPT slide 9: Check-in verificable',
    confidence: 0.98,
    actions: [
      { label: 'Mostrar QR', route: 'ProfileTab' },
      { label: 'Ver asistencia', route: 'CheckIn' },
    ],
  },
  {
    id: 'hours',
    intent: 'hours',
    title: 'Horas acumuladas',
    answer:
      'Alejandro tiene 24 de 30 horas acumuladas en el demo. Las horas se actualizan con check-in validado por evento y habilitan certificados cuando se cumple el requisito minimo.',
    keywords: ['horas', 'acumuladas', 'avance', 'cumplimiento', 'meta'],
    sourceLabel: 'Propuesta GEN+: horas acumulables y certificacion',
    confidence: 0.94,
    actions: [
      { label: 'Ver horas', route: 'CheckIn' },
      { label: 'Ver certificados', route: 'Certificates' },
    ],
  },
  {
    id: 'certificates',
    intent: 'certificates',
    title: 'Certificados',
    answer:
      'Los certificados se desbloquean al cumplir horas y validaciones. El demo muestra certificado general, ponencias BIM, concursos y visitas. En produccion el PDF debe emitirse con QR de verificacion y registro auditable.',
    keywords: ['certificado', 'certificados', 'constancia', 'pdf', 'descargar'],
    sourceLabel: 'PPT slide 3: certificacion en tiempo real',
    confidence: 0.93,
    actions: [{ label: 'Ver certificados', route: 'Certificates' }],
  },
  {
    id: 'visits',
    intent: 'visits',
    title: 'Visitas tecnicas y turisticas',
    answer:
      'Las visitas tienen cupos, punto de encuentro, recomendaciones y estado de reserva. El demo incluye obra vial, planta de concreto, Sacsayhuaman, Valle Sagrado y ruta cultural por Cusco historico.',
    keywords: ['visita', 'visitas', 'tecnica', 'turistica', 'cupos', 'reservar', 'buses'],
    sourceLabel: 'App scope: visitas tecnicas y turisticas',
    confidence: 0.95,
    actions: [
      { label: 'Reservar visita', route: 'Visits' },
      { label: 'Ver mapa', route: 'MapTab' },
    ],
  },
  {
    id: 'map',
    intent: 'map',
    title: 'Mapa interactivo',
    answer:
      'El mapa agrupa pins por auditorio, registro, ferias, salas, transporte, alimentacion y visitas. Al tocar un pin se muestran horarios, eventos asociados e indicaciones para llegar.',
    keywords: ['mapa', 'ubicacion', 'sede', 'auditorio', 'sala', 'llegar', 'uac'],
    sourceLabel: 'PPT slide 13: mapa interactivo',
    confidence: 0.92,
    actions: [{ label: 'Abrir mapa', route: 'MapTab' }],
  },
  {
    id: 'payments',
    intent: 'payments',
    title: 'Inscripcion y pagos',
    answer:
      'La propuesta contempla landing informativa con pasarela para Yape, Plin y tarjetas. En esta app demo solo se muestra el estado del participante; la pasarela real debe vivir en backend/landing para trazabilidad y seguridad.',
    keywords: ['pago', 'pagos', 'pasarela', 'yape', 'plin', 'tarjeta', 'inscripcion', 'inscribo'],
    sourceLabel: 'PPT slide 3: landing web y pagos',
    confidence: 0.9,
    actions: [
      { label: 'Ver credencial', route: 'ProfileTab' },
      { label: 'Soporte', route: 'Settings' },
    ],
  },
  {
    id: 'support',
    intent: 'support',
    title: 'Soporte humano',
    answer:
      'Si el caso requiere validacion manual, el asistente deriva al comite. Para produccion se recomienda mesa de soporte con tickets, historial del participante y prioridad para pagos, QR o asistencia.',
    keywords: ['soporte', 'ayuda', 'problema', 'error', 'humano', 'contacto'],
    sourceLabel: 'PPT slide 11: derivacion a soporte humano',
    confidence: 0.89,
    actions: [{ label: 'Abrir soporte', route: 'Settings' }],
  },
];

export const assistantQuickPrompts = [
  'Cuantas horas tengo?',
  'Donde esta mi ponencia?',
  'Como funciona mi QR?',
  'Puedo reservar una visita tecnica?',
  'Cuando descargo mi certificado?',
  'Como pago mi inscripcion?',
  'Donde recojo mi credencial?',
];
