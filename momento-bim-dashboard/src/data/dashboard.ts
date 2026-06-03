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

export type CaseExample = {
  id: string;
  title: string;
  scope: string;
  trigger: string;
  objective: string;
  lanes: {
    lane: string;
    steps: string[];
  }[];
  documents: string[];
  deliverables: string[];
  mappingCriteria: string[];
  commonMistakes: string[];
  bimUse: string;
  cdeConfig: string;
  metrics: string[];
};

export type SupportTool = {
  name: string;
  role: string;
  input: string;
  output: string;
  humanControl: string;
  risk: string;
};

export const kpis: Kpi[] = [
  {
    label: 'Madurez BIM estimada',
    value: '2.4/5',
    detail: 'Hay uso y revisión BIM, pero falta convertirlo en sistema operativo de información y control.',
    status: 'Línea base',
    tone: 'blue',
  },
  {
    label: 'Procesos críticos',
    value: '10',
    detail: 'Consultas, RFI/SDI, planos, incidencias, submittals, fotos, reportes, acuerdos, calidad y seguridad.',
    status: 'Mapa de taller',
    tone: 'green',
  },
  {
    label: 'Consulta técnica actual',
    value: '7 días',
    detail: 'Tiempo promedio reportado antes de ordenar responsables, evidencias, SLA y cierre documentado.',
    status: 'Riesgo de coordinación',
    tone: 'amber',
  },
  {
    label: 'Riesgo documental',
    value: 'Alto',
    detail: 'Versiones, fotos y evidencias pierden valor si no viven en un ECD/CDE con trazabilidad.',
    status: 'Prioridad inmediata',
    tone: 'rose',
  },
];

export const executiveSignals = [
  {
    title: 'Lo que está pasando',
    text: 'MOMENTO ya usa herramientas digitales, pero la adopción BIM todavía depende de procesos no siempre visibles: consultas, revisiones, planos, evidencias y aprobaciones circulan por canales distintos.',
  },
  {
    title: 'Lo que importa',
    text: 'Implementar BIM no es modelar más. Es definir cómo la información técnica se crea, revisa, aprueba, publica, consulta y cierra con trazabilidad.',
  },
  {
    title: 'Lo que debe hacerse ahora',
    text: 'Cerrar diagnóstico, mapear procesos reales, estandarizar ECD/CDE, definir roles y convertir cada flujo en formulario, log, tablero o regla operativa.',
  },
  {
    title: 'Evidencia de valor',
    text: 'Menos tiempo buscando información, menos consultas repetidas, planos vigentes visibles, fotos recuperables, responsabilidades claras y decisiones auditables.',
  },
];

export const maturityPillars: MaturityPillar[] = [
  {
    pillar: 'Estrategia BIM',
    score: 46,
    target: 82,
    evidence: 'Existe intención de adopción BIM, pero se necesita traducirla en objetivos, usos BIM, roles, entregables y métricas por proceso.',
    risk: 'BIM se percibe como software o modelado aislado, no como forma de gestionar información del proyecto.',
    next: 'Definir usos BIM prioritarios: coordinación, revisión documental, consultas, evidencia, reportabilidad y control de cambios.',
  },
  {
    pillar: 'ECD / CDE',
    score: 42,
    target: 84,
    evidence: 'Hay repositorios y plataformas, pero falta una fuente única de verdad con codificación, estados, permisos y cierre.',
    risk: 'Documentos duplicados, versiones no confiables y aprobaciones fuera del flujo.',
    next: 'Configurar matriz ECD, estructura documental, estados, codificación, permisos y logs.',
  },
  {
    pillar: 'Procesos campo-oficina',
    score: 38,
    target: 86,
    evidence: 'Los flujos existen en la práctica, pero todavía no están mapeados como procesos auditables.',
    risk: 'Cada equipo resuelve distinto y la organización no aprende entre proyectos.',
    next: 'Mapear 10 procesos con carriles, inputs, actividades, decisiones, entregables, SLA y responsables.',
  },
  {
    pillar: 'Coordinación y revisión BIM',
    score: 52,
    target: 80,
    evidence: 'Hay revisión BIM y oportunidad de conectar modelos, planos, consultas, interferencias e incidencias.',
    risk: 'La coordinación BIM queda desconectada de obra, control documental y decisiones de producción.',
    next: 'Vincular modelo, planos, consultas técnicas, incidencias y documentos publicados en ECD.',
  },
  {
    pillar: 'Adopción y gobierno',
    score: 44,
    target: 78,
    evidence: 'La participación del equipo será la señal principal para saber si el estándar se puede sostener.',
    risk: 'El estándar se percibe como carga administrativa si no reduce tiempos, errores o retrabajos reales.',
    next: 'Evaluar participación por mapa entregado, calidad de criterios, uso de evidencia y mejora propuesta.',
  },
];

export const diagnosticBlocks = [
  {
    name: '01 / Contexto BIM y operativo',
    objective: 'Entender cómo MOMENTO organiza proyectos, obras, disciplinas, roles, decisiones y herramientas actuales.',
    evidence: ['Organigrama operativo', 'Lista de proyectos activos', 'Herramientas actuales', 'Dolores por rol'],
  },
  {
    name: '02 / Información y documentos',
    objective: 'Identificar qué información se crea, quién la valida, dónde vive, cómo se nombra y cómo se recupera.',
    evidence: ['Tipos documentales', 'Muestras de nombres', 'Estados actuales', 'Carpetas y repositorios'],
  },
  {
    name: '03 / Flujos campo-oficina',
    objective: 'Mapear cómo se mueve la información entre obra, oficina técnica, BIM, gerencia, especialistas y documentación.',
    evidence: ['Consulta técnica', 'RFI/SDI', 'Registro fotográfico', 'Planos emitidos', 'Submittals', 'Incidencias'],
  },
  {
    name: '04 / Madurez BIM/ECD',
    objective: 'Medir si el entorno común de datos puede sostener trazabilidad, permisos, versiones, revisión y auditoría.',
    evidence: ['Matriz de comunicación', 'PEP/BEP si existe', 'Permisos', 'Codificación', 'SLA'],
  },
  {
    name: '05 / Casos BIM prioritarios',
    objective: 'Seleccionar qué procesos deben convertirse primero en flujos BIM/ECD porque generan más riesgo, retrabajo o pérdida de tiempo.',
    evidence: ['Casos repetitivos', 'Tiempos de respuesta', 'Errores frecuentes', 'Riesgos contractuales', 'Responsables clave'],
  },
];

export const requiredInputs = [
  'Listado de proyectos y obras activas',
  'Estructura actual de carpetas, Autodesk Docs, Drive u otro repositorio',
  'Ejemplo real de consulta técnica en obra',
  'Ejemplo real de RFI/SDI o comunicación formal',
  'Ejemplo de registro fotográfico o evidencia de campo',
  'Ejemplo de plano con revisión, emisión y versionado',
  'Ejemplo de submittal, ficha técnica o aprobación documental',
  'Lista de roles: campo, producción, oficina técnica, BIM, calidad, seguridad, gerencia y externos',
  'Matriz de comunicaciones o flujo de aprobaciones si existe',
  'PEP, BEP, estándar BIM, guía documental o formato interno si existe',
  'Formatos actuales de reportes, actas, acuerdos y restricciones',
  'Restricciones de permisos, confidencialidad, aprobación y publicación',
];

export const ecdColumns = [
  { field: 'ID_ECD', rule: 'Código único no editable', value: 'Evita duplicados y permite trazabilidad.' },
  { field: 'Proyecto / Obra', rule: 'Catálogo cerrado', value: 'Permite filtrar y comparar entre obras.' },
  { field: 'Disciplina', rule: 'Arquitectura, estructuras, MEP, BIM, calidad, seguridad', value: 'Ordena responsables técnicos.' },
  { field: 'Tipo documental', rule: 'Plano, modelo, consulta, RFI, submittal, foto, acta, reporte, incidencia', value: 'Define flujo y SLA.' },
  { field: 'Código documento', rule: 'Estructura estándar por proyecto-disciplina-tipo-número', value: 'Reduce pérdida por nombres libres.' },
  { field: 'Revisión', rule: 'R00, R01, R02 o estado equivalente', value: 'Controla versiones vigentes, observadas y obsoletas.' },
  { field: 'Estado', rule: 'Borrador, en revisión, observado, aprobado, publicado, cerrado', value: 'Muestra avance real del flujo.' },
  { field: 'Responsable', rule: 'Rol primero, persona después', value: 'Evita que el proceso dependa de memoria individual.' },
  { field: 'SLA / Fecha límite', rule: 'Fecha obligatoria por tipo de flujo', value: 'Convierte seguimiento en gestión.' },
  { field: 'Ubicación / WBS', rule: 'Zona, nivel, frente, ambiente o partida', value: 'Conecta campo, planificación, modelo y evidencia.' },
  { field: 'Link oficial CDE', rule: 'URL del documento, carpeta, formulario o issue', value: 'Evita archivos fuera del repositorio.' },
  { field: 'Criterio de cierre', rule: 'Condición observable para cerrar', value: 'Hace auditable la aprobación.' },
];

export const flows: Flow[] = [
  {
    id: 'consulta',
    title: 'Gestión de consultas técnicas en obra',
    owner: 'Campo + Oficina técnica + BIM',
    priority: 'Crítico',
    currentPain: 'La duda técnica puede resolverse en obra, escalar a oficina técnica, convertirse en RFI/SDI o requerir respuesta del especialista, pero hoy ese camino no siempre queda trazado.',
    targetOutcome: 'Consulta técnica con código, fecha, frente, disciplina, descripción, impacto, adjuntos, responsable, respuesta, evidencia y cierre documentado.',
    inputs: ['Duda técnica', 'Plano o modelo disponible', 'Foto/evidencia', 'Frente o ubicación', 'Especialidad afectada'],
    activities: ['Detectar duda', 'Revisar información disponible', 'Registrar consulta', 'Validar completitud', 'Analizar respuesta', 'Comunicar solución', 'Cerrar consulta'],
    decisions: ['¿Se resuelve con información disponible?', '¿La consulta está completa y es válida?', '¿Requiere cambio formal o impacto mayor?'],
    outputs: ['Respuesta técnica', 'Registro de consulta', 'Evidencia y trazabilidad', 'Derivación a RFI/SDI si aplica'],
    metrics: ['Tiempo de respuesta', '% consultas incompletas', '% consultas derivadas a RFI/SDI', '% consultas cerradas con evidencia'],
    lanes: [
      { lane: 'Campo / Producción', steps: ['Detectar duda', 'Revisar planos disponibles', 'Confirmar si se resuelve en obra'] },
      { lane: 'Oficina técnica / BIM', steps: ['Registrar consulta en CDE', 'Validar datos y asignar plazo', 'Solicitar respuesta o informar cierre'] },
      { lane: 'Proyectista / Especialista', steps: ['Analizar consulta', 'Emitir respuesta técnica', 'Derivar a RFI/SDI si hay impacto'] },
      { lane: 'CDE / Documentación', steps: ['Registrar resolución', 'Comunicar solución al equipo', 'Cerrar consulta con trazabilidad'] },
    ],
    instructorQuestions: [
      '¿Qué dato mínimo debe traer una consulta para no rebotar?',
      '¿Cuándo una duda se resuelve en campo y cuándo escala a RFI/SDI?',
      '¿Qué evidencia prueba que la respuesta fue comunicada y aplicada?',
    ],
  },
  {
    id: 'planos',
    title: 'Control de planos y modelos vigentes',
    owner: 'BIM + Control documentario',
    priority: 'Crítico',
    currentPain: 'Nombres por fecha o versión manual generan riesgo de trabajar con información obsoleta.',
    targetOutcome: 'Planos/modelos con codificación, revisión, estado, fecha, aprobador, link oficial y control de obsolescencia.',
    inputs: ['Plano emitido', 'Modelo federado o disciplina', 'Revisión', 'Paquete de emisión', 'Responsable de aprobación'],
    activities: ['Registrar emisión', 'Validar código', 'Publicar en CDE', 'Notificar cambio', 'Retirar versión obsoleta'],
    decisions: ['¿Cumple estándar?', '¿Queda aprobado para construcción?', '¿Impacta documentos o frentes relacionados?'],
    outputs: ['Plano vigente', 'Historial de revisión', 'Lista de distribución', 'Registro de cambios'],
    metrics: ['% planos con código correcto', 'Planos obsoletos detectados', 'Tiempo de aprobación', 'Cambios por disciplina'],
    lanes: [
      { lane: 'Diseño / BIM', steps: ['Emite revisión', 'Responde observaciones', 'Publica versión'] },
      { lane: 'Control documentario', steps: ['Verifica código', 'Actualiza log', 'Bloquea obsoletos'] },
      { lane: 'Obra', steps: ['Consulta vigente', 'Reporta conflicto', 'Ejecuta con referencia'] },
      { lane: 'Gerencia', steps: ['Aprueba uso', 'Evalúa impacto', 'Controla avance'] },
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
    currentPain: 'Las observaciones se registran con criterios distintos y se pierde vínculo entre foto, ubicación, responsable y cierre.',
    targetOutcome: 'Incidencia con tipo, severidad, ubicación, foto, responsable, fecha compromiso, acción correctiva y evidencia de cierre.',
    inputs: ['Hallazgo', 'Foto', 'Ubicación', 'Criterio de calidad/seguridad', 'Responsable'],
    activities: ['Registrar hallazgo', 'Clasificar severidad', 'Asignar responsable', 'Ejecutar corrección', 'Validar cierre'],
    decisions: ['¿Es no conformidad?', '¿Requiere paralización?', '¿La evidencia de cierre es suficiente?'],
    outputs: ['Incidencia cerrada', 'Evidencia antes/después', 'Acción correctiva', 'Tendencia por frente'],
    metrics: ['Incidencias abiertas', 'Edad promedio', '% cerradas a tiempo', 'Reincidencias'],
    lanes: [
      { lane: 'Campo', steps: ['Detecta', 'Registra foto', 'Ejecuta corrección'] },
      { lane: 'Calidad / Seguridad', steps: ['Clasifica', 'Define criterio', 'Valida cierre'] },
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
      { lane: 'Proveedor / Compras', steps: ['Envía ficha', 'Responde consulta', 'Entrega muestra'] },
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
    activities: ['Capturar foto', 'Etiquetar', 'Subir a CDE', 'Vincular a reporte', 'Validar avance o cierre'],
    decisions: ['¿La foto prueba avance?', '¿Debe asociarse a incidencia?', '¿Sirve como evidencia contractual?'],
    outputs: ['Registro fotográfico ordenado', 'Reporte de avance', 'Evidencia de cierre', 'Historial por zona'],
    metrics: ['Fotos sin etiqueta', 'Evidencias por frente', '% reportes con soporte', 'Tiempo de carga'],
    lanes: [
      { lane: 'Campo', steps: ['Captura', 'Etiqueta', 'Sube'] },
      { lane: 'Producción', steps: ['Vincula avance', 'Valida frente', 'Prioriza pendientes'] },
      { lane: 'Calidad / Seguridad', steps: ['Asocia hallazgo', 'Valida cierre', 'Audita evidencia'] },
      { lane: 'Gerencia', steps: ['Consulta reporte', 'Compara tendencia', 'Toma decisión'] },
    ],
    instructorQuestions: [
      '¿Qué foto es evidencia y cuál solo es registro?',
      '¿Qué campos vuelven recuperable una foto dentro de 3 meses?',
      '¿Cómo se conecta una foto con avance, incidencia o consulta?',
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
      { lane: 'Oficina técnica', steps: ['Valida impactos', 'Cruza consultas/planos', 'Actualiza tablero'] },
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
      '¿Qué acuerdos deberían vincularse al CDE?',
    ],
  },
];

export const mappingSteps = [
  'Definir proceso, alcance, inicio y fin.',
  'Definir carriles por rol: campo, BIM, oficina técnica, especialista, documentación, gerencia.',
  'Identificar inputs: planos, modelos, fotos, especificaciones, formularios, actas o datos.',
  'Listar actividades con verbo + objeto, evitando frases genéricas.',
  'Definir decisiones con rutas claras: sí, no, observado, aprobado, requiere RFI, requiere cambio.',
  'Definir entregables por etapa: registro, respuesta, plano actualizado, evidencia, reporte o cierre.',
  'Ordenar la secuencia real, incluyendo retrabajos y excepciones.',
  'Conectar flujo de trabajo y flujo de información: qué se mueve, dónde vive y quién lo valida.',
  'Validar con responsables reales y ajustar el mapa con casos recientes.',
  'Convertir el mapa en configuración: formulario, log, CDE, tablero, SLA y ritual de seguimiento.',
];

export const caseExamples: CaseExample[] = [
  {
    id: 'consulta-tecnica',
    title: 'Caso 01 · Gestión de consultas técnicas en obra',
    scope: 'Desde que campo detecta una duda o inconsistencia hasta que la respuesta queda registrada, comunicada y cerrada.',
    trigger: 'Campo detecta una duda técnica, interferencia, inconsistencia de plano, falta de detalle o conflicto con el modelo.',
    objective: 'Evitar decisiones informales en obra y asegurar que toda consulta tenga soporte, responsable, respuesta oficial y trazabilidad.',
    lanes: [
      { lane: 'Campo / Producción', steps: ['Detectar duda', 'Revisar planos/documentos disponibles', 'Resolver si existe información suficiente'] },
      { lane: 'Oficina técnica / BIM', steps: ['Registrar consulta en CDE/Build', 'Validar completitud', 'Asignar responsable y plazo'] },
      { lane: 'Proyectista / Especialista', steps: ['Analizar consulta', 'Emitir respuesta técnica', 'Definir si requiere RFI/SDI o cambio formal'] },
      { lane: 'CDE / Documentación', steps: ['Registrar resolución', 'Comunicar al equipo', 'Cerrar consulta con evidencia'] },
      { lane: 'Resumen', steps: ['Detección', 'Revisión documental', 'Registro', 'Validación', 'Respuesta', 'Cierre'] },
    ],
    documents: ['Planos DWG/RVT/PDF', 'Especificaciones técnicas', 'Fotos JPG/PNG', 'Reporte DOCX/XLSX', 'Modelo BIM si aplica'],
    deliverables: ['Respuesta técnica', 'Registro de consulta', 'Evidencia adjunta', 'Historial de decisión', 'Derivación a RFI/SDI si aplica'],
    mappingCriteria: [
      'La consulta debe tener código, fecha, frente/ubicación, especialidad, descripción, impacto y adjuntos.',
      'Si se resuelve con información disponible, no debe escalarse innecesariamente.',
      'Si requiere cambio formal o impacto mayor, se deriva a RFI/SDI.',
      'El cierre exige comunicación oficial y evidencia de trazabilidad.',
    ],
    commonMistakes: [
      'Mapear solo la respuesta y olvidar la validación de completitud.',
      'No diferenciar consulta simple, RFI formal y cambio de diseño.',
      'No registrar quién comunicó la respuesta ni dónde quedó guardada.',
      'No definir qué pasa cuando falta información.',
    ],
    bimUse: 'Revisión de plano/modelo para validar si la duda ya está respondida, si existe interferencia o si debe actualizarse información técnica.',
    cdeConfig: 'Formulario de consulta + log de consultas + estado: registrada, incompleta, en análisis, respondida, derivada a RFI/SDI, cerrada.',
    metrics: ['Tiempo de respuesta', 'Consultas incompletas', 'Consultas derivadas a RFI/SDI', 'Consultas vencidas', 'Consultas por disciplina'],
  },
  {
    id: 'planos-vigentes',
    title: 'Caso 02 · Control de planos y modelos vigentes',
    scope: 'Desde la emisión de una revisión hasta su publicación, comunicación y retiro de versiones obsoletas.',
    trigger: 'Diseño, BIM u oficina técnica emite una nueva revisión de plano/modelo.',
    objective: 'Evitar que campo ejecute con información no vigente y asegurar que cada revisión tenga estado, responsable y distribución.',
    lanes: [
      { lane: 'BIM / Diseño', steps: ['Emite revisión', 'Responde observaciones', 'Confirma paquete'] },
      { lane: 'Control documentario', steps: ['Valida código', 'Publica en CDE', 'Marca obsoleto lo anterior'] },
      { lane: 'Oficina técnica', steps: ['Revisa impacto', 'Comunica cambios', 'Actualiza log'] },
      { lane: 'Campo', steps: ['Consulta vigente', 'Ejecuta con referencia', 'Reporta conflicto'] },
    ],
    documents: ['Plano PDF', 'Modelo RVT/NWD/IFC', 'Transmittal', 'Registro de cambios', 'Lista de distribución'],
    deliverables: ['Plano vigente publicado', 'Historial de revisiones', 'Registro de obsolescencia', 'Comunicación de cambio'],
    mappingCriteria: [
      'Todo plano debe tener código, revisión, estado, fecha y responsable.',
      'La versión obsoleta no debe quedar disponible como fuente de uso.',
      'La comunicación debe indicar qué cambió y a qué frentes afecta.',
    ],
    commonMistakes: [
      'Nombrar por fecha sin código documental.',
      'Publicar revisión nueva sin retirar la anterior.',
      'No comunicar impactos de cambio a producción.',
    ],
    bimUse: 'Modelo y planos se conectan para revisar interferencias, coherencia entre disciplinas y paquetes emitidos.',
    cdeConfig: 'Carpeta oficial por disciplina + estados de revisión + permisos + registro de emisión y obsolescencia.',
    metrics: ['Planos vigentes por disciplina', 'Planos observados', 'Retrasos de aprobación', 'Conflictos por versión obsoleta'],
  },
  {
    id: 'incidencias-calidad',
    title: 'Caso 03 · Incidencias, observaciones y no conformidades',
    scope: 'Desde el hallazgo en campo hasta la corrección, evidencia de cierre y aprendizaje.',
    trigger: 'Calidad, seguridad, producción o supervisión detecta una desviación.',
    objective: 'Convertir observaciones dispersas en gestión trazable por responsable, ubicación, plazo y evidencia.',
    lanes: [
      { lane: 'Campo', steps: ['Detecta hallazgo', 'Registra foto', 'Ejecuta corrección'] },
      { lane: 'Calidad / Seguridad', steps: ['Clasifica severidad', 'Define criterio', 'Valida cierre'] },
      { lane: 'Producción', steps: ['Asigna responsable', 'Programa corrección', 'Reporta avance'] },
      { lane: 'Gerencia', steps: ['Revisa tendencia', 'Prioriza riesgos', 'Desbloquea recursos'] },
    ],
    documents: ['Foto antes/después', 'Checklist de calidad', 'Ubicación/WBS', 'Reporte de seguridad', 'Registro de cierre'],
    deliverables: ['Incidencia cerrada', 'Acción correctiva', 'Evidencia de cierre', 'Tendencia por frente'],
    mappingCriteria: [
      'Cada incidencia debe tener severidad, ubicación, responsable y fecha compromiso.',
      'El cierre exige evidencia suficiente, no solo comentario.',
      'Las reincidencias deben alimentar aprendizaje y prevención.',
    ],
    commonMistakes: [
      'Registrar fotos sin ubicación.',
      'Cerrar incidencias sin evidencia de corrección.',
      'No diferenciar observación, incidencia y no conformidad.',
    ],
    bimUse: 'Ubicar hallazgos por zona, elemento, nivel o frente para conectar evidencia con modelo/planos.',
    cdeConfig: 'Formulario de issue + estados + responsable + evidencia obligatoria + tablero de vencidos.',
    metrics: ['Incidencias abiertas', 'Edad promedio', 'Cierre a tiempo', 'Reincidencias', 'Incidencias críticas'],
  },
  {
    id: 'submittals',
    title: 'Caso 04 · Submittals y aprobación técnica',
    scope: 'Desde la solicitud o entrega de ficha hasta aprobación, observación, restricción o liberación para uso.',
    trigger: 'Proveedor, compras u oficina técnica requiere validar ficha, muestra, material, equipo o documento.',
    objective: 'Evitar que compras u obra avancen sin aprobación técnica trazable.',
    lanes: [
      { lane: 'Proveedor / Compras', steps: ['Entrega ficha', 'Responde observaciones', 'Confirma disponibilidad'] },
      { lane: 'Oficina técnica', steps: ['Registra submittal', 'Revisa especificación', 'Gestiona aprobación'] },
      { lane: 'Calidad', steps: ['Valida criterio', 'Registra restricción', 'Controla uso'] },
      { lane: 'Obra', steps: ['Espera liberación', 'Usa aprobado', 'Reporta desviación'] },
    ],
    documents: ['Ficha técnica', 'Especificación', 'Muestra', 'Certificado', 'Aprobación u observación'],
    deliverables: ['Submittal aprobado', 'Observaciones resueltas', 'Restricción registrada', 'Liberación para uso'],
    mappingCriteria: [
      'Debe existir fecha requerida por obra.',
      'Aprobado no siempre significa libre para uso si existen restricciones.',
      'Toda observación debe volver al responsable con plazo.',
    ],
    commonMistakes: [
      'No registrar fecha requerida por producción.',
      'No separar revisión técnica de liberación para obra.',
      'Guardar fichas fuera del repositorio oficial.',
    ],
    bimUse: 'Relacionar submittals con especificaciones, partidas, ambientes o elementos del modelo cuando aplique.',
    cdeConfig: 'Log de submittals + estados + adjuntos + comentarios + aprobación + restricciones.',
    metrics: ['Submittals vencidos', 'Ciclo de aprobación', '% observado', 'Bloqueos a compras/obra'],
  },
  {
    id: 'evidencia-avance',
    title: 'Caso 05 · Registro fotográfico, avance y evidencia',
    scope: 'Desde captura de evidencia en campo hasta su uso en reporte, cierre de incidencia o validación de avance.',
    trigger: 'Campo necesita documentar avance, restricción, calidad, seguridad o estado de un frente.',
    objective: 'Que las fotos dejen de ser archivos sueltos y se conviertan en evidencia recuperable por proyecto, ubicación, fecha y actividad.',
    lanes: [
      { lane: 'Campo', steps: ['Captura foto', 'Etiqueta ubicación', 'Sube al CDE'] },
      { lane: 'Producción', steps: ['Vincula a avance', 'Valida frente', 'Actualiza reporte'] },
      { lane: 'Calidad / Seguridad', steps: ['Asocia hallazgo', 'Valida cierre', 'Audita evidencia'] },
      { lane: 'Gerencia', steps: ['Consulta tendencia', 'Compara plan vs real', 'Decide acción'] },
    ],
    documents: ['Foto JPG/PNG', 'Formulario de campo', 'Reporte semanal', 'Ubicación/WBS', 'Comentario técnico'],
    deliverables: ['Evidencia etiquetada', 'Reporte con soporte', 'Historial por frente', 'Cierre visual'],
    mappingCriteria: [
      'Una foto sin ubicación y actividad no es evidencia operativa.',
      'La evidencia debe vincularse a avance, incidencia, calidad, seguridad o restricción.',
      'El reporte debe mostrar evidencia, no solo texto.',
    ],
    commonMistakes: [
      'Subir fotos por WhatsApp sin repositorio oficial.',
      'No distinguir foto de avance, foto de incidencia y foto de cierre.',
      'No definir quién valida la evidencia.',
    ],
    bimUse: 'Conectar evidencia a zona, nivel, frente o elemento para recuperar información visual según ubicación.',
    cdeConfig: 'Formulario móvil + campos obligatorios + carpeta automática por frente/fecha + tablero de evidencia.',
    metrics: ['Fotos sin etiqueta', 'Reportes con evidencia', 'Tiempo de carga', 'Evidencia por frente', 'Cierres validados'],
  },
];

export const supportTools: SupportTool[] = [
  {
    name: 'Glosario BIM/ECD',
    role: 'Normaliza términos, estados, tipos documentales, códigos, roles y definiciones para que todos usen el mismo lenguaje.',
    input: 'Matriz ECD, BEP/PEP, formatos, nombres actuales y guías internas.',
    output: 'Glosario controlado, equivalencias y criterios de uso.',
    humanControl: 'BIM Manager o Document Control aprueba definiciones antes de publicarlas.',
    risk: 'Confundir términos internos con estándares externos sin validación.',
  },
  {
    name: 'Auditor de mapas',
    role: 'Revisa mapas de proceso y detecta vacíos: sin responsable, sin decisión, sin entregable, sin SLA o sin evidencia.',
    input: 'Mapa del equipo, checklist GEN+, transcripción del taller.',
    output: 'Observaciones priorizadas y mejoras sugeridas.',
    humanControl: 'Instructor decide qué observaciones se convierten en cambios.',
    risk: 'Optimizar el mapa ideal y perder cómo ocurre el trabajo real.',
  },
  {
    name: 'Minutero técnico',
    role: 'Convierte sesiones y reuniones en acuerdos, responsables, fechas, riesgos y evidencias esperadas.',
    input: 'Transcripción, acta, lista de asistentes, agenda.',
    output: 'Acta accionable, compromisos y tablero de seguimiento.',
    humanControl: 'Coordinador confirma acuerdos antes de distribuir.',
    risk: 'Atribuir compromisos incorrectos si la transcripción es ambigua.',
  },
];

export const workshopAgenda = [
  {
    block: 'Apertura y contrato de trabajo',
    minutes: '10 min',
    objective: 'Alinear que el taller produce activos operativos, no solo participación en clase.',
    artifact: 'Criterios de evaluación visibles.',
    instructorMove: 'Explicar que cada mapa debe servir para configurar BIM/ECD, no para decorar una lámina.',
  },
  {
    block: 'Introducción a adopción BIM + ECD',
    minutes: '25 min',
    objective: 'Mostrar que BIM se adopta cuando procesos, información, roles y repositorio trabajan juntos.',
    artifact: 'Mapa mental BIM + ECD + procesos.',
    instructorMove: 'Usar consultas técnicas, planos y fotos para aterrizar el concepto.',
  },
  {
    block: 'Cómo mapear un proceso',
    minutes: '30 min',
    objective: 'Enseñar carriles, inputs, actividades, decisiones, entregables y flujo de información.',
    artifact: 'Checklist de 10 pasos.',
    instructorMove: 'Modelar el caso de consulta técnica antes de que los equipos trabajen.',
  },
  {
    block: 'Trabajo por equipos',
    minutes: '45 min',
    objective: 'Cada equipo mapea un flujo real con responsables, decisiones, documentos y evidencias.',
    artifact: 'Mapa preliminar por flujo.',
    instructorMove: 'Preguntar quién aprueba, qué evidencia cierra, dónde vive el documento y qué pasa si se vence.',
  },
  {
    block: 'Clínica y mejora',
    minutes: '25 min',
    objective: 'Comparar mapas y detectar vacíos de implementación BIM/ECD.',
    artifact: 'Lista de mejoras por equipo.',
    instructorMove: 'Conectar cada vacío con una configuración futura de Autodesk Docs, Build, Forma o Sheet ECD.',
  },
  {
    block: 'Cierre y compromisos',
    minutes: '15 min',
    objective: 'Definir qué información entregan y cómo Robert digitaliza los mapas.',
    artifact: 'Backlog de digitalización.',
    instructorMove: 'Cerrar con responsables, fecha, formato de entrega y estándar de revisión.',
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
    observable: 'Se reconocen planos, modelos, documentos, fotos, formularios, datos y resultados.',
  },
  {
    criterion: 'Decisiones y riesgos',
    weight: '20%',
    observable: 'Los puntos de decisión tienen rutas y criterios, no quedan como conversación informal.',
  },
  {
    criterion: 'Digitalización BIM/ECD',
    weight: '20%',
    observable: 'El equipo identifica qué se transforma en formulario, log, tablero, estado CDE, permiso o regla documental.',
  },
];

export const roadmap = [
  {
    phase: '01',
    name: 'Diagnóstico BIM',
    duration: 'Semana 1-2',
    deliverables: ['Word diagnóstico preliminar', 'Matriz de madurez BIM', 'Backlog de brechas', 'Usos BIM prioritarios'],
  },
  {
    phase: '02',
    name: 'Mapeo de procesos',
    duration: 'Sesión 3-4',
    deliverables: ['10 mapas validados', 'Preguntas por flujo', 'RACI preliminar', 'SLA por proceso'],
  },
  {
    phase: '03',
    name: 'Estándar ECD/CDE',
    duration: 'Semana 3-4',
    deliverables: ['Sheet ECD', 'Matriz de comunicaciones', 'Taxonomía documental', 'Roles y permisos'],
  },
  {
    phase: '04',
    name: 'Pilotos BIM operativos',
    duration: 'Semana 5-7',
    deliverables: ['Consulta técnica piloto', 'Control de planos', 'Flujo de fotos', 'Dashboard de seguimiento'],
  },
  {
    phase: '05',
    name: 'Escalamiento y gobierno',
    duration: 'Semana 8-12',
    deliverables: ['Ritual semanal', 'KPIs de adopción', 'Plan multiobra', 'Mejora continua'],
  },
];

export const risks = [
  {
    risk: 'Mapas demasiado ideales',
    impact: 'No representan la operación real y fallan al configurar el CDE.',
    mitigation: 'Preguntar por excepciones, retrabajos, casos vencidos y decisiones informales.',
    tone: 'amber' as Tone,
  },
  {
    risk: 'CDE como simple carpeta',
    impact: 'No mejora trazabilidad, permisos ni decisiones.',
    mitigation: 'Configurar estados, roles, códigos, SLA, logs y criterios de cierre.',
    tone: 'rose' as Tone,
  },
  {
    risk: 'BIM desconectado de obra',
    impact: 'El modelo se revisa, pero no cambia la forma de gestionar consultas, planos, evidencias o incidencias.',
    mitigation: 'Vincular usos BIM a procesos concretos campo-oficina.',
    tone: 'violet' as Tone,
  },
  {
    risk: 'Baja adopción del equipo',
    impact: 'El estándar se percibe como carga administrativa.',
    mitigation: 'Medir participación, reducir pasos redundantes y mostrar quick wins por flujo.',
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
  { role: 'Alejandro + Daniella', focus: 'Diagnóstico BIM, requerimientos, criterios docentes, preguntas de mapeo y validación del estándar.' },
  { role: 'Robert', focus: 'Digitalización de mapas, ordenamiento visual, control de versiones y consolidación en tablero.' },
  { role: 'Equipo MOMENTO', focus: 'Aportar proceso real, excepciones, documentos, tiempos, responsables y evidencia.' },
  { role: 'Admin ECD/CDE', focus: 'Mantener codificación, estados, permisos, matriz de comunicaciones y logs.' },
];
