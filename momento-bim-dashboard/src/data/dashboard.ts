export type Tone = 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'slate';

export type Kpi = {
  label: string;
  value: string;
  detail: string;
  status: string;
  tone: Tone;
};

export type MaturityPillar = {
  pillar: string;
  score: number;
  target: number;
  evidence: string;
  risk: string;
  next: string;
};

export type Flow = {
  id: string;
  title: string;
  owner: string;
  priority: string;
  currentPain: string;
  targetOutcome: string;
  inputs: string[];
  activities: string[];
  decisions: string[];
  outputs: string[];
  metrics: string[];
  lanes: {
    lane: string;
    steps: string[];
  }[];
  instructorQuestions: string[];
};

export type Agent = {
  name: string;
  role: string;
  input: string;
  output: string;
  humanControl: string;
  risk: string;
};

export const kpis: Kpi[] = [
  {
    label: 'Madurez digital estimada',
    value: '2.1/5',
    detail: 'Hay uso de plataformas, pero falta gobierno de información y trazabilidad común.',
    status: 'Base diagnosticada',
    tone: 'blue',
  },
  {
    label: 'Flujos críticos a mapear',
    value: '7',
    detail: 'RFI, planos, incidencias, submittals, fotos, reportes y acuerdos.',
    status: 'Taller activo',
    tone: 'green',
  },
  {
    label: 'Ciclo RFI actual',
    value: '7 días',
    detail: 'Tiempo promedio reportado antes de estandarizar canales, responsables y SLA.',
    status: 'Riesgo operativo',
    tone: 'amber',
  },
  {
    label: 'Riesgo de evidencia',
    value: 'Alto',
    detail: 'Fotos y registros son el bloque más difícil de ubicar si no existe ECD operativo.',
    status: 'Prioridad inmediata',
    tone: 'rose',
  },
];

export const executiveSignals = [
  {
    title: 'Lo que está pasando',
    text: 'MOMENTO ya usa herramientas digitales, pero los procesos campo-oficina siguen dependiendo de acuerdos implícitos, nombres de archivo, correos y búsqueda manual.',
  },
  {
    title: 'Lo que importa',
    text: 'La adopción BIM/IA no inicia con software: inicia con flujos visibles, información estandarizada, roles claros y evidencia verificable.',
  },
  {
    title: 'Lo que debe hacerse ahora',
    text: 'Cerrar diagnóstico, mapear 7 flujos, definir estándar ECD en Sheet y activar GPTs de apoyo con revisión humana.',
  },
  {
    title: 'Evidencia de valor',
    text: 'Menos tiempo buscando información, RFIs con trazabilidad, fotos vinculadas a ubicación/actividad y reportes ejecutivos comparables.',
  },
];

export const maturityPillars: MaturityPillar[] = [
  {
    pillar: 'Gobierno ECD',
    score: 42,
    target: 78,
    evidence: 'Existe uso de repositorios, pero no una matriz única de codificación, estados, permisos y responsables.',
    risk: 'Documentos duplicados, versiones no confiables y aprobaciones fuera del flujo.',
    next: 'Definir Sheet maestro ECD, matriz de comunicaciones y taxonomía de carpetas.',
  },
  {
    pillar: 'Mapeo campo-oficina',
    score: 38,
    target: 82,
    evidence: 'Los flujos existen en la práctica, pero no están digitalizados como proceso auditable.',
    risk: 'Cada proyecto resuelve de forma distinta y no se aprende entre obras.',
    next: 'Mapear 7 flujos con carriles, inputs, decisiones, entregables, SLA y responsables.',
  },
  {
    pillar: 'BIM aplicado',
    score: 54,
    target: 80,
    evidence: 'Hay revisión BIM y oportunidad de conectar modelos, documentos, consultas e incidencias.',
    risk: 'BIM queda como coordinación aislada y no como sistema de gestión de información.',
    next: 'Vincular flujo BIM a RFI, planos, incidencias, submittals y evidencia.',
  },
  {
    pillar: 'IA operativa',
    score: 24,
    target: 68,
    evidence: 'La IA puede acelerar síntesis, glosarios, minutas, revisión y preguntas, pero necesita fuentes curadas.',
    risk: 'Automatizar sin control genera respuestas no auditables o recomendaciones sin fuente.',
    next: 'Diseñar GPTs internos con entrada, salida, fuente, responsable y control humano.',
  },
  {
    pillar: 'Adopción y cambio',
    score: 46,
    target: 76,
    evidence: 'La participación del equipo será la señal principal para saber si el sistema se puede sostener.',
    risk: 'El estándar se percibe como carga administrativa si no reduce trabajo real.',
    next: 'Evaluar participación por mapa entregado, calidad de preguntas y mejora propuesta.',
  },
];

export const diagnosticBlocks = [
  {
    name: '01 / Contexto operativo',
    objective: 'Entender cómo MOMENTO trabaja hoy: proyectos, obras, equipos, herramientas, dolores y dependencias.',
    evidence: ['Organigrama operativo', 'Lista de proyectos activos', 'Herramientas actuales', 'Dolores por rol'],
  },
  {
    name: '02 / Información y documentos',
    objective: 'Identificar qué información se crea, quién la valida, dónde vive y cómo se recupera.',
    evidence: ['Tipos documentales', 'Muestras de nombres', 'Estados actuales', 'Carpetas y repositorios'],
  },
  {
    name: '03 / Flujos campo-oficina',
    objective: 'Mapear cómo se mueve la información entre obra, oficina técnica, coordinación BIM, gerencia y externos.',
    evidence: ['RFI actual', 'Registro fotográfico', 'Planos emitidos', 'Submittals', 'Incidencias'],
  },
  {
    name: '04 / Madurez BIM/ECD',
    objective: 'Medir si el entorno común de datos puede sostener trazabilidad, permisos, versiones y auditoría.',
    evidence: ['Matriz de comunicación', 'PEP/BEP si existe', 'Permisos', 'Codificación', 'SLA'],
  },
  {
    name: '05 / Potencial IA',
    objective: 'Definir casos de IA que sí reduzcan trabajo, errores o tiempos sin perder control humano.',
    evidence: ['Fuentes confiables', 'Casos repetitivos', 'Prompts actuales', 'Riesgos', 'Controles'],
  },
];

export const requiredInputs = [
  'Listado de proyectos y obras activas',
  'Estructura actual de carpetas o repositorio',
  'Ejemplo real de RFI o consulta técnica',
  'Ejemplo de registro fotográfico o evidencia de campo',
  'Ejemplo de plano con revisión/versionado',
  'Lista de roles: obra, oficina técnica, BIM, calidad, seguridad, gerencia y externos',
  'Matriz de comunicaciones si existe',
  'PEP/BEP o estándar BIM si existe',
  'Formatos actuales de reportes, actas y acuerdos',
  'Restricciones de permisos, confidencialidad y aprobación',
];

export const ecdColumns = [
  { field: 'ID_ECD', rule: 'Código único no editable', value: 'Evita duplicados y permite trazabilidad.' },
  { field: 'Proyecto / Obra', rule: 'Catálogo cerrado', value: 'Permite filtrar y comparar entre obras.' },
  { field: 'Disciplina', rule: 'Arquitectura, estructuras, MEP, seguridad, calidad, BIM', value: 'Ordena responsables técnicos.' },
  { field: 'Tipo documental', rule: 'Plano, RFI, submittal, foto, acta, reporte, incidencia', value: 'Define flujo y SLA.' },
  { field: 'Código documento', rule: 'Estructura estándar por proyecto-disciplina-tipo-número', value: 'Reduce pérdida por nombres libres.' },
  { field: 'Revisión', rule: 'R00, R01, R02 o estado equivalente', value: 'Controla versiones aprobadas y obsoletas.' },
  { field: 'Estado', rule: 'Borrador, en revisión, observado, aprobado, cerrado', value: 'Muestra avance real del flujo.' },
  { field: 'Responsable', rule: 'Rol primero, persona después', value: 'Evita que el proceso dependa de memoria individual.' },
  { field: 'SLA / Fecha límite', rule: 'Fecha obligatoria por tipo de flujo', value: 'Convierte seguimiento en gestión.' },
  { field: 'Ubicación / WBS', rule: 'Zona, nivel, frente o partida', value: 'Conecta campo, planificación y evidencia.' },
  { field: 'Link ACC/Drive', rule: 'URL oficial del documento o carpeta', value: 'Evita archivos fuera del repositorio.' },
  { field: 'Criterio de cierre', rule: 'Condición observable para cerrar', value: 'Hace auditable la aprobación.' },
];

export const flows: Flow[] = [
  {
    id: 'rfi',
    title: 'Consulta técnica / RFI',
    owner: 'Oficina técnica + BIM',
    priority: 'Crítico',
    currentPain: 'Consultas por correo o canales dispersos, con respuestas lentas y dificultad para recuperar la decisión final.',
    targetOutcome: 'RFI con origen, responsable, SLA, evidencia, decisión, impacto y cierre trazable en ECD.',
    inputs: ['Consulta de campo', 'Plano/modelo relacionado', 'Foto o ubicación', 'Especialidad involucrada'],
    activities: ['Registrar consulta', 'Validar si requiere RFI formal', 'Asignar responsable', 'Responder con sustento', 'Cerrar y comunicar'],
    decisions: ['¿La consulta afecta costo/plazo?', '¿Requiere cambio de plano?', '¿La respuesta queda aprobada?'],
    outputs: ['RFI cerrado', 'Respuesta técnica aprobada', 'Actualización documental', 'Lección aprendida'],
    metrics: ['Tiempo promedio de respuesta', '% RFI vencidos', 'RFI por disciplina', '% con evidencia completa'],
    lanes: [
      { lane: 'Campo', steps: ['Detecta duda', 'Adjunta evidencia', 'Recibe respuesta'] },
      { lane: 'Oficina técnica', steps: ['Clasifica', 'Asigna SLA', 'Consolida respuesta'] },
      { lane: 'BIM / Diseño', steps: ['Revisa modelo', 'Valida interferencia', 'Actualiza referencia'] },
      { lane: 'Gerencia', steps: ['Evalúa impacto', 'Aprueba cambio', 'Monitorea cierre'] },
    ],
    instructorQuestions: [
      '¿Qué dato mínimo debe traer una consulta para no rebotar?',
      '¿Quién decide si una consulta se convierte en RFI formal?',
      '¿Qué evidencia prueba que la respuesta fue comunicada y aplicada?',
    ],
  },
  {
    id: 'planos',
    title: 'Control de planos y versiones',
    owner: 'BIM + Document Control',
    priority: 'Crítico',
    currentPain: 'Nombres por fecha o versión manual que generan riesgo de trabajar con información obsoleta.',
    targetOutcome: 'Planos con codificación, revisión, estado, fecha, aprobador, link oficial y control de obsolescencia.',
    inputs: ['Plano emitido', 'Disciplina', 'Revisión', 'Paquete de emisión', 'Responsable de aprobación'],
    activities: ['Registrar emisión', 'Validar código', 'Publicar en ECD', 'Notificar cambio', 'Retirar versión obsoleta'],
    decisions: ['¿El plano cumple estándar?', '¿Queda aprobado para construcción?', '¿Impacta documentos relacionados?'],
    outputs: ['Plano vigente', 'Historial de revisión', 'Lista de distribución', 'Registro de cambios'],
    metrics: ['% planos con código correcto', 'Planos obsoletos detectados', 'Tiempo de aprobación', 'Cambios por disciplina'],
    lanes: [
      { lane: 'Diseño/BIM', steps: ['Emite revisión', 'Responde observaciones', 'Publica versión'] },
      { lane: 'Control documentario', steps: ['Verifica código', 'Actualiza log', 'Bloquea obsoletos'] },
      { lane: 'Obra', steps: ['Consulta vigente', 'Reporta conflicto', 'Ejecuta con referencia'] },
      { lane: 'Gerencia', steps: ['Aprueba uso', 'Ve impacto', 'Controla avance'] },
    ],
    instructorQuestions: [
      '¿Cuál es la fuente única de verdad de un plano vigente?',
      '¿Qué pasa cuando un plano cambia y ya fue distribuido?',
      '¿Cómo se evita que campo use una versión anterior?',
    ],
  },
  {
    id: 'incidencias',
    title: 'Incidencias, observaciones y no conformidades',
    owner: 'Calidad + Producción + Seguridad',
    priority: 'Alto',
    currentPain: 'Las observaciones se registran con diferentes criterios y se pierde vínculo entre foto, ubicación, responsable y cierre.',
    targetOutcome: 'Incidencia con tipo, severidad, ubicación, foto, responsable, fecha compromiso, acción correctiva y evidencia de cierre.',
    inputs: ['Hallazgo', 'Foto', 'Ubicación', 'Criterio de calidad/seguridad', 'Responsable'],
    activities: ['Registrar hallazgo', 'Clasificar severidad', 'Asignar responsable', 'Ejecutar corrección', 'Validar cierre'],
    decisions: ['¿Es no conformidad?', '¿Requiere paralización?', '¿La evidencia de cierre es suficiente?'],
    outputs: ['Incidencia cerrada', 'Evidencia antes/después', 'Acción correctiva', 'Tendencia por frente'],
    metrics: ['Incidencias abiertas', 'Edad promedio', '% cerradas a tiempo', 'Reincidencias'],
    lanes: [
      { lane: 'Campo', steps: ['Detecta', 'Registra foto', 'Ejecuta corrección'] },
      { lane: 'Calidad/Seguridad', steps: ['Clasifica', 'Define criterio', 'Valida cierre'] },
      { lane: 'Producción', steps: ['Asigna cuadrilla', 'Gestiona plazo', 'Reporta avance'] },
      { lane: 'Gerencia', steps: ['Revisa tendencia', 'Prioriza riesgo', 'Desbloquea'] },
    ],
    instructorQuestions: [
      '¿Qué diferencia una observación de una no conformidad?',
      '¿Qué evidencia mínima permite cerrar una incidencia?',
      '¿Qué incidencias deberían escalar a gerencia?',
    ],
  },
  {
    id: 'submittals',
    title: 'Submittals y aprobación documental',
    owner: 'Oficina técnica + Calidad',
    priority: 'Alto',
    currentPain: 'La aprobación de fichas, muestras y documentos puede quedar fuera del tablero operativo.',
    targetOutcome: 'Submittal con paquete, responsable, revisión, comentarios, aprobación, restricciones y trazabilidad de uso.',
    inputs: ['Ficha técnica', 'Proveedor', 'Especificación', 'Partida', 'Fecha requerida'],
    activities: ['Registrar submittal', 'Revisar completitud', 'Enviar a aprobación', 'Responder observaciones', 'Liberar para uso'],
    decisions: ['¿Cumple especificación?', '¿Requiere muestra?', '¿Se aprueba con restricciones?'],
    outputs: ['Submittal aprobado', 'Observaciones resueltas', 'Restricción registrada', 'Paquete liberado'],
    metrics: ['Submittals vencidos', 'Ciclo de aprobación', '% observado', 'Impacto en compras/obra'],
    lanes: [
      { lane: 'Proveedor/Compras', steps: ['Envía ficha', 'Responde consulta', 'Entrega muestra'] },
      { lane: 'Oficina técnica', steps: ['Valida alcance', 'Gestiona aprobación', 'Comunica resultado'] },
      { lane: 'Calidad', steps: ['Revisa criterio', 'Registra restricción', 'Controla uso'] },
      { lane: 'Obra', steps: ['Espera liberación', 'Usa aprobado', 'Reporta desviación'] },
    ],
    instructorQuestions: [
      '¿Qué submittals bloquean obra si no se aprueban a tiempo?',
      '¿Qué diferencia aprobación técnica de liberación para uso?',
      '¿Dónde queda registrada una restricción de aprobación?',
    ],
  },
  {
    id: 'fotos',
    title: 'Registro fotográfico y evidencia de avance',
    owner: 'Campo + Producción',
    priority: 'Alto',
    currentPain: 'Las fotos son abundantes, pero difíciles de ubicar si no tienen zona, fecha, actividad, responsable y criterio.',
    targetOutcome: 'Evidencia fotográfica vinculada a frente, partida, fecha, responsable, estado y reporte.',
    inputs: ['Foto', 'Fecha', 'Zona', 'Actividad', 'Responsable', 'Comentario'],
    activities: ['Capturar foto', 'Etiquetar', 'Subir a ECD', 'Vincular a reporte', 'Validar avance o cierre'],
    decisions: ['¿La foto prueba avance?', '¿Debe asociarse a incidencia?', '¿Sirve como evidencia contractual?'],
    outputs: ['Registro fotográfico ordenado', 'Reporte de avance', 'Evidencia de cierre', 'Historial por zona'],
    metrics: ['Fotos sin etiqueta', 'Evidencias por frente', '% reportes con soporte', 'Tiempo de carga'],
    lanes: [
      { lane: 'Campo', steps: ['Captura', 'Etiqueta', 'Sube'] },
      { lane: 'Producción', steps: ['Vincula avance', 'Valida frente', 'Prioriza pendientes'] },
      { lane: 'Calidad/Seguridad', steps: ['Asocia hallazgo', 'Valida cierre', 'Audita evidencia'] },
      { lane: 'Gerencia', steps: ['Consulta reporte', 'Compara tendencia', 'Toma decisión'] },
    ],
    instructorQuestions: [
      '¿Qué foto es evidencia y cuál solo es registro?',
      '¿Qué campos vuelven recuperable una foto dentro de 3 meses?',
      '¿Cómo se conecta una foto con avance, incidencia o RFI?',
    ],
  },
  {
    id: 'reportes',
    title: 'Reportes de avance y restricciones',
    owner: 'Producción + Gerencia',
    priority: 'Medio',
    currentPain: 'Reportes con mucho texto y poca comparación ejecutiva entre plan, avance, restricciones y responsables.',
    targetOutcome: 'Reporte ejecutivo con avance físico, restricciones, evidencia, compromisos, alertas y decisiones requeridas.',
    inputs: ['Avance por frente', 'Fotos', 'Restricciones', 'Compromisos', 'Curva o plan semanal'],
    activities: ['Consolidar avance', 'Validar evidencia', 'Actualizar restricciones', 'Priorizar alertas', 'Emitir reporte'],
    decisions: ['¿El avance está en riesgo?', '¿Qué restricción bloquea más?', '¿Quién debe decidir?'],
    outputs: ['Reporte semanal', 'Alertas ejecutivas', 'Lista de responsables', 'Acciones priorizadas'],
    metrics: ['Avance plan vs real', 'Restricciones abiertas', 'Compromisos vencidos', 'Alertas críticas'],
    lanes: [
      { lane: 'Campo', steps: ['Reporta avance', 'Adjunta evidencia', 'Declara restricción'] },
      { lane: 'Producción', steps: ['Consolida', 'Prioriza', 'Propone acción'] },
      { lane: 'Oficina técnica', steps: ['Valida impactos', 'Cruza RFI/planos', 'Actualiza tablero'] },
      { lane: 'Gerencia', steps: ['Lee alerta', 'Decide', 'Hace seguimiento'] },
    ],
    instructorQuestions: [
      '¿Qué dato del reporte cambia una decisión esta semana?',
      '¿Qué restricciones se repiten y no se están resolviendo?',
      '¿Qué indicador debería verse en 30 segundos?',
    ],
  },
  {
    id: 'acuerdos',
    title: 'Reuniones, acuerdos y compromisos',
    owner: 'Coordinación + Gerencia',
    priority: 'Medio',
    currentPain: 'Acuerdos quedan en actas o conversaciones sin seguimiento sistemático por responsable y fecha.',
    targetOutcome: 'Compromiso con dueño, fecha, evidencia esperada, estado, bloqueo y relación con flujo documental.',
    inputs: ['Acta', 'Acuerdo', 'Responsable', 'Fecha compromiso', 'Evidencia esperada'],
    activities: ['Registrar acuerdo', 'Asignar responsable', 'Dar seguimiento', 'Validar evidencia', 'Cerrar o escalar'],
    decisions: ['¿El acuerdo está vencido?', '¿Tiene evidencia?', '¿Debe escalarse?'],
    outputs: ['Acta trazable', 'Compromisos cerrados', 'Pendientes priorizados', 'Historial de decisiones'],
    metrics: ['Compromisos abiertos', '% cerrados a tiempo', 'Compromisos sin evidencia', 'Escalamientos'],
    lanes: [
      { lane: 'Reunión', steps: ['Define acuerdo', 'Asigna dueño', 'Fija fecha'] },
      { lane: 'Responsable', steps: ['Ejecuta', 'Adjunta evidencia', 'Solicita cierre'] },
      { lane: 'Coordinación', steps: ['Da seguimiento', 'Valida evidencia', 'Escala'] },
      { lane: 'Gerencia', steps: ['Revisa vencidos', 'Desbloquea', 'Cierra decisión'] },
    ],
    instructorQuestions: [
      '¿Qué hace que un acuerdo sea verificable?',
      '¿Cuándo un compromiso vencido se convierte en riesgo de proyecto?',
      '¿Qué acuerdos deberían vincularse al ECD?',
    ],
  },
];

export const mappingSteps = [
  'Definir el proceso y su alcance exacto.',
  'Definir carriles por rol, no por nombres propios.',
  'Identificar inputs: documentos, datos, fotos, modelos, aprobaciones.',
  'Listar actividades con verbo + objeto.',
  'Definir decisiones con rutas claras: sí, no, observado, aprobado.',
  'Definir entregables de cada etapa.',
  'Ordenar la secuencia real, no la ideal.',
  'Conectar flujo de trabajo y flujo de información.',
  'Validar con responsables reales.',
  'Usar el mapa para digitalizar, medir y mejorar.',
];

export const aiAgents: Agent[] = [
  {
    name: 'GPT Glosario ECD',
    role: 'Normaliza términos, estados, tipos documentales y definiciones para que todos hablen el mismo idioma.',
    input: 'Matriz ECD, formatos, nombres actuales y guías internas.',
    output: 'Glosario controlado, equivalencias y criterios de uso.',
    humanControl: 'Document Control aprueba definiciones antes de publicarlas.',
    risk: 'Confundir términos internos con estándares externos sin validación.',
  },
  {
    name: 'GPT BIM MOMENTO',
    role: 'Apoya consultas sobre modelo, coordinación, planos, interferencias y criterios BIM aplicados al flujo.',
    input: 'BEP/PEP, guías BIM, flujos de revisión, preguntas de equipo.',
    output: 'Respuesta técnica con fuente, criterio y siguiente acción.',
    humanControl: 'BIM Manager valida respuestas que impacten diseño, costo o plazo.',
    risk: 'Responder sin contexto contractual o con una versión no vigente.',
  },
  {
    name: 'GPT Auditor de Flujos',
    role: 'Revisa mapas de proceso y detecta vacíos: sin responsable, sin decisión, sin entregable o sin SLA.',
    input: 'Mapa del equipo, checklist GEN+, transcripción del taller.',
    output: 'Observaciones priorizadas y mejoras sugeridas.',
    humanControl: 'Instructor decide qué observaciones se convierten en cambios.',
    risk: 'Optimizar el mapa ideal y perder cómo ocurre el trabajo real.',
  },
  {
    name: 'GPT Minutero Técnico',
    role: 'Convierte reuniones en acuerdos, responsables, fechas, riesgos y evidencias esperadas.',
    input: 'Transcripción, acta, lista de asistentes, agenda.',
    output: 'Acta accionable, compromisos y tablero de seguimiento.',
    humanControl: 'Coordinador confirma acuerdos antes de distribuir.',
    risk: 'Atribuir compromisos incorrectos si la transcripción es ambigua.',
  },
  {
    name: 'GPT RFI Draft',
    role: 'Ayuda a estructurar consultas técnicas completas antes de enviarlas al flujo formal.',
    input: 'Pregunta, plano/modelo, foto, ubicación, disciplina, impacto esperado.',
    output: 'Borrador RFI con contexto, evidencia y pregunta cerrada.',
    humanControl: 'Oficina técnica aprueba envío formal.',
    risk: 'Convertir una duda informal en RFI sin criterio de impacto.',
  },
];

export const workshopAgenda = [
  {
    block: 'Apertura y contrato de trabajo',
    minutes: '10 min',
    objective: 'Alinear que el taller produce activos operativos, no solo participación en clase.',
    artifact: 'Criterios de evaluación visibles.',
    instructorMove: 'Explicar que cada mapa debe servir para configurar un ECD, no para decorar una lámina.',
  },
  {
    block: 'Introducción ECD + IA',
    minutes: '25 min',
    objective: 'Mostrar por qué la IA necesita procesos, datos y documentos estandarizados.',
    artifact: 'Mapa mental ECD + GPTs internos.',
    instructorMove: 'Usar ejemplos de RFI, fotos y planos para aterrizar el concepto.',
  },
  {
    block: 'Cómo mapear un proceso',
    minutes: '30 min',
    objective: 'Enseñar carriles, inputs, actividades, decisiones, entregables y flujo de información.',
    artifact: 'Checklist de 10 pasos.',
    instructorMove: 'Modelar un ejemplo rápido antes de que los equipos trabajen.',
  },
  {
    block: 'Trabajo por equipos',
    minutes: '45 min',
    objective: 'Cada equipo mapea un flujo real con responsables, decisiones y evidencias.',
    artifact: 'Mapa preliminar por flujo.',
    instructorMove: 'Hacer preguntas incómodas: quién aprueba, qué evidencia cierra, qué pasa si se vence.',
  },
  {
    block: 'Clínica y mejora',
    minutes: '25 min',
    objective: 'Comparar mapas y detectar vacíos de digitalización.',
    artifact: 'Lista de mejoras por equipo.',
    instructorMove: 'Conectar cada vacío con una configuración futura de Autodesk Docs/Forma o Sheet ECD.',
  },
  {
    block: 'Cierre y compromisos',
    minutes: '15 min',
    objective: 'Definir qué información entregan y cómo Robert la digitaliza.',
    artifact: 'Backlog de digitalización.',
    instructorMove: 'Cerrar con responsables, fecha y estándar de entrega.',
  },
];

export const rubric = [
  {
    criterion: 'Claridad del proceso',
    weight: '20%',
    observable: 'El mapa tiene inicio, fin, alcance y flujo comprensible.',
  },
  {
    criterion: 'Responsables y carriles',
    weight: '20%',
    observable: 'Cada actividad tiene rol responsable y no depende de una persona específica.',
  },
  {
    criterion: 'Inputs y entregables',
    weight: '20%',
    observable: 'Se reconocen documentos, datos, fotos, modelos y resultados de cada etapa.',
  },
  {
    criterion: 'Decisiones y riesgos',
    weight: '20%',
    observable: 'Los puntos de decisión tienen rutas y criterios, no quedan como conversación informal.',
  },
  {
    criterion: 'Potencial de digitalización',
    weight: '20%',
    observable: 'El equipo identifica qué se transforma en formulario, log, tablero, GPT o regla ECD.',
  },
];

export const roadmap = [
  {
    phase: '01',
    name: 'Diagnóstico operativo',
    duration: 'Semana 1-2',
    deliverables: ['Word diagnóstico preliminar', 'Matriz de madurez', 'Backlog de brechas', 'Criterios de adopción'],
  },
  {
    phase: '02',
    name: 'Mapeo de flujos',
    duration: 'Sesión 3-4',
    deliverables: ['7 mapas validados', 'Preguntas por flujo', 'RACI preliminar', 'SLA por proceso'],
  },
  {
    phase: '03',
    name: 'Estándar ECD',
    duration: 'Semana 3-4',
    deliverables: ['Sheet ECD', 'Matriz de comunicaciones', 'Taxonomía documental', 'Roles y permisos'],
  },
  {
    phase: '04',
    name: 'Pilotos BIM + IA',
    duration: 'Semana 5-7',
    deliverables: ['GPT Glosario', 'GPT BIM', 'RFI piloto', 'Flujo de fotos', 'Dashboard de seguimiento'],
  },
  {
    phase: '05',
    name: 'Escalamiento',
    duration: 'Semana 8-12',
    deliverables: ['Gobierno operativo', 'Ritual semanal', 'KPIs de adopción', 'Plan multiobra'],
  },
];

export const risks = [
  {
    risk: 'Mapas demasiado ideales',
    impact: 'No representan la operación real y fallan al digitalizar.',
    mitigation: 'Preguntar por excepciones, retrabajos y casos vencidos.',
    tone: 'amber' as Tone,
  },
  {
    risk: 'ECD como simple carpeta',
    impact: 'No mejora trazabilidad ni decisiones.',
    mitigation: 'Configurar estados, roles, códigos, SLA y logs.',
    tone: 'rose' as Tone,
  },
  {
    risk: 'IA sin fuentes curadas',
    impact: 'Recomendaciones no auditables.',
    mitigation: 'Usar GPTs con fuentes, fecha, control humano y salida estructurada.',
    tone: 'violet' as Tone,
  },
  {
    risk: 'Baja adopción del equipo',
    impact: 'El estándar se percibe como carga.',
    mitigation: 'Medir participación, reducir pasos redundantes y mostrar quick wins.',
    tone: 'blue' as Tone,
  },
  {
    risk: 'Sin responsable de mantenimiento',
    impact: 'El sistema se desactualiza después del taller.',
    mitigation: 'Asignar owner por log, ritual de revisión y tablero semanal.',
    tone: 'green' as Tone,
  },
];

export const roleResponsibilities = [
  { role: 'Alejandro + Daniella', focus: 'Diagnóstico, requerimientos, criterios docentes, preguntas de mapeo y validación del estándar.' },
  { role: 'Robert', focus: 'Digitalización de los 7 mapas, ordenamiento visual, control de versiones y consolidación en tablero.' },
  { role: 'Equipo MOMENTO', focus: 'Aportar proceso real, excepciones, documentos, tiempos, responsables y evidencia.' },
  { role: 'Admin ECD', focus: 'Mantener codificación, estados, permisos, matriz de comunicaciones y logs.' },
];
