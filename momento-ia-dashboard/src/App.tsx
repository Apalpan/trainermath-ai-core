import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Map,
  Network,
  Radar,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  aiAgents,
  diagnosticBlocks,
  ecdColumns,
  executiveSignals,
  flows,
  kpis,
  mappingSteps,
  maturityPillars,
  requiredInputs,
  risks,
  roadmap,
  roleResponsibilities,
  rubric,
  workshopAgenda,
  type Flow,
  type Tone,
} from './data/dashboard';

type SectionId = 'resumen' | 'diagnostico' | 'ecd' | 'flujos' | 'ia' | 'taller' | 'roadmap';

const navItems: { id: SectionId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'resumen', label: 'Resumen ejecutivo', icon: LayoutDashboard },
  { id: 'diagnostico', label: 'Diagnóstico', icon: ClipboardCheck },
  { id: 'ecd', label: 'ECD + datos', icon: Database },
  { id: 'flujos', label: 'Mapeo de flujos', icon: Workflow },
  { id: 'ia', label: 'IA aplicada', icon: Bot },
  { id: 'taller', label: 'Taller docente', icon: GraduationCap },
  { id: 'roadmap', label: 'Roadmap y riesgos', icon: Radar },
];

const toneIcon: Record<Tone, string> = {
  blue: 'bg-blue',
  green: 'bg-green',
  amber: 'bg-amber',
  rose: 'bg-rose',
  violet: 'bg-violet',
  slate: 'bg-slate',
};

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('resumen');
  const [selectedFlowId, setSelectedFlowId] = useState(flows[0].id);

  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.id === selectedFlowId) ?? flows[0],
    [selectedFlowId],
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-mark">GEN+</span>
          <div>
            <strong>MOMENTO IA Adoption OS</strong>
            <small>BIM · ECD · IA · Campo-oficina</small>
          </div>
        </div>
        <nav className="nav-list" aria-label="Secciones del dashboard">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeSection === item.id ? 'nav-item nav-item--active' : 'nav-item'}
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-panel">
          <span>Próximo foco</span>
          <strong>Digitalizar 7 mapas con Robert</strong>
          <p>Convertir el taller en activos: logs, estándares, formularios y tablero de adopción.</p>
        </div>
      </aside>

      <main className="main-area">
        <TopBar />
        {activeSection === 'resumen' && <ExecutiveOverview setActiveSection={setActiveSection} />}
        {activeSection === 'diagnostico' && <DiagnosticSection />}
        {activeSection === 'ecd' && <EcdSection />}
        {activeSection === 'flujos' && (
          <FlowMappingSection
            selectedFlow={selectedFlow}
            selectedFlowId={selectedFlowId}
            setSelectedFlowId={setSelectedFlowId}
          />
        )}
        {activeSection === 'ia' && <AiSection />}
        {activeSection === 'taller' && <WorkshopSection />}
        {activeSection === 'roadmap' && <RoadmapSection />}
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">Servicio GEN+ para MOMENTO</span>
        <h1>Dashboard de adopción e implementación de IA, BIM y ECD</h1>
      </div>
      <div className="status-strip">
        <span>Diagnóstico preliminar</span>
        <strong>En construcción operativa</strong>
      </div>
    </header>
  );
}

function ExecutiveOverview({ setActiveSection }: { setActiveSection: (section: SectionId) => void }) {
  return (
    <section className="section-stack">
      <div className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Sistema de decisión</span>
          <h2>Primero hacemos visible el proceso. Después automatizamos con IA.</h2>
          <p>
            Este dashboard ordena diagnóstico, ECD, mapeo de flujos, criterios docentes y roadmap para
            transformar la capacitación BIM en un sistema operativo de adopción digital.
          </p>
          <div className="action-row">
            <button className="primary-action" onClick={() => setActiveSection('flujos')} type="button">
              <GitBranch size={18} />
              Mapear flujos
            </button>
            <button className="secondary-action" onClick={() => setActiveSection('ecd')} type="button">
              <FileSpreadsheet size={18} />
              Ver estándar ECD
            </button>
          </div>
        </div>
        <div className="control-visual" aria-label="Resumen visual de adopción digital">
          <div className="visual-grid" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="core-node">
            <Network size={34} />
            <strong>Proceso + Datos + IA</strong>
            <span>Control humano</span>
          </div>
          <div className="mini-node mini-node-a">ECD</div>
          <div className="mini-node mini-node-b">BIM</div>
          <div className="mini-node mini-node-c">Campo</div>
          <div className="mini-node mini-node-d">GPTs</div>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <article className={`kpi-card ${toneIcon[kpi.tone]}`} key={kpi.label}>
            <span>{kpi.status}</span>
            <strong>{kpi.value}</strong>
            <h3>{kpi.label}</h3>
            <p>{kpi.detail}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--two">
        <div className="panel">
          <PanelHeader icon={ShieldCheck} label="Lectura ejecutiva" title="Qué debe entender MOMENTO" />
          <div className="signal-list">
            {executiveSignals.map((signal) => (
              <article key={signal.title}>
                <span />
                <div>
                  <h3>{signal.title}</h3>
                  <p>{signal.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <PanelHeader icon={Radar} label="Madurez" title="Brechas por frente" />
          <div className="maturity-list">
            {maturityPillars.map((pillar) => (
              <article key={pillar.pillar}>
                <div>
                  <strong>{pillar.pillar}</strong>
                  <span>{pillar.score}% actual · meta {pillar.target}%</span>
                </div>
                <Progress value={pillar.score} target={pillar.target} />
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <PanelHeader icon={ListChecks} label="Prioridades" title="Backlog inicial del servicio" />
        <div className="priority-grid">
          {[
            'Cerrar formato Word de diagnóstico preliminar con evidencias solicitadas.',
            'Recolectar información y formularios: RFI, fotos, planos, submittals, actas y reportes.',
            'Diseñar Sheet ECD como estándar de codificación, estados, responsables y SLA.',
            'Guiar a los equipos para mapear 7 flujos antes de digitalizarlos.',
            'Crear GPT Glosario ECD y GPT BIM con fuentes curadas y revisión humana.',
            'Convertir los mapas en tablero de seguimiento para adopción y participación.',
          ].map((item, index) => (
            <article key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DiagnosticSection() {
  return (
    <section className="section-stack">
      <SectionHero
        icon={ClipboardCheck}
        eyebrow="Diagnóstico preliminar"
        title="Formato Word para convertir conversación en línea base operativa"
        text="El diagnóstico no debe ser un cuestionario genérico. Debe capturar cómo trabaja MOMENTO hoy, qué información genera, dónde se rompe la trazabilidad y qué casos de IA/BIM tienen sentido."
      />

      <div className="dashboard-grid dashboard-grid--two">
        <div className="panel">
          <PanelHeader icon={Map} label="Estructura" title="Bloques del diagnóstico" />
          <div className="block-list">
            {diagnosticBlocks.map((block) => (
              <article key={block.name}>
                <h3>{block.name}</h3>
                <p>{block.objective}</p>
                <div className="chip-row">
                  {block.evidence.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <PanelHeader icon={CheckCircle2} label="Requerimientos" title="Información que deben entregar" />
          <div className="checklist">
            {requiredInputs.map((item) => (
              <label key={item}>
                <input type="checkbox" readOnly />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <PanelHeader icon={Radar} label="Criterio docente" title="Cómo explicarlo en clase" />
        <div className="teaching-grid">
          {maturityPillars.map((pillar) => (
            <article key={pillar.pillar}>
              <span>{pillar.pillar}</span>
              <h3>{pillar.evidence}</h3>
              <p><strong>Riesgo:</strong> {pillar.risk}</p>
              <p><strong>Siguiente acción:</strong> {pillar.next}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function EcdSection() {
  return (
    <section className="section-stack">
      <SectionHero
        icon={Database}
        eyebrow="Entorno común de datos"
        title="El ECD es una operación controlada, no una carpeta compartida"
        text="Para que Autodesk Docs/Forma, BIM y los GPTs funcionen, la información necesita código, estado, responsable, versión, permiso, fecha límite y criterio de cierre."
      />

      <div className="dashboard-grid dashboard-grid--two">
        <div className="panel">
          <PanelHeader icon={FileSpreadsheet} label="Sheet ECD" title="Columnas estándar para arrancar" />
          <div className="data-table">
            <div className="table-head">
              <span>Campo</span>
              <span>Regla</span>
              <span>Valor operativo</span>
            </div>
            {ecdColumns.map((column) => (
              <div className="table-row" key={column.field}>
                <strong>{column.field}</strong>
                <span>{column.rule}</span>
                <p>{column.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <PanelHeader icon={Network} label="Arquitectura" title="Modelo operativo ECD" />
          <div className="ecd-blueprint">
            {[
              ['Entrada', 'Formulario, correo controlado, ACC o carga manual validada'],
              ['Normalización', 'Código, tipo, estado, revisión, disciplina, ubicación'],
              ['Flujo', 'Responsable, decisión, observación, aprobación, SLA'],
              ['Evidencia', 'Foto, modelo, plano, acta, comentario o link oficial'],
              ['Salida', 'Reporte, dashboard, GPT, alerta o cierre trazable'],
            ].map(([title, text], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <PanelHeader icon={ShieldCheck} label="Gobernanza" title="Responsables por capa" />
        <div className="role-grid">
          {roleResponsibilities.map((role) => (
            <article key={role.role}>
              <h3>{role.role}</h3>
              <p>{role.focus}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FlowMappingSection({
  selectedFlow,
  selectedFlowId,
  setSelectedFlowId,
}: {
  selectedFlow: Flow;
  selectedFlowId: string;
  setSelectedFlowId: (id: string) => void;
}) {
  return (
    <section className="section-stack">
      <SectionHero
        icon={Workflow}
        eyebrow="Mapeo de procesos"
        title="La dinámica central: convertir operación real en flujo digitalizable"
        text="Cada equipo debe salir con un mapa que Robert pueda digitalizar y que luego se pueda transformar en formulario, log, tablero, flujo ECD o GPT de apoyo."
      />

      <div className="panel">
        <PanelHeader icon={GitBranch} label="Método" title="10 pasos para mapear un proceso de obra" />
        <div className="steps-grid">
          {mappingSteps.map((step, index) => (
            <article key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="flow-layout">
        <aside className="flow-selector" aria-label="Flujos críticos">
          {flows.map((flow) => (
            <button
              className={selectedFlowId === flow.id ? 'flow-tab flow-tab--active' : 'flow-tab'}
              key={flow.id}
              onClick={() => setSelectedFlowId(flow.id)}
              type="button"
            >
              <span>{flow.priority}</span>
              <strong>{flow.title}</strong>
            </button>
          ))}
        </aside>

        <div className="panel flow-detail">
          <PanelHeader icon={GitBranch} label={selectedFlow.owner} title={selectedFlow.title} />
          <div className="flow-summary">
            <article>
              <span>Dolor actual</span>
              <p>{selectedFlow.currentPain}</p>
            </article>
            <article>
              <span>Resultado esperado</span>
              <p>{selectedFlow.targetOutcome}</p>
            </article>
          </div>

          <ProcessMap flow={selectedFlow} />

          <div className="flow-detail-grid">
            <DetailList title="Inputs" items={selectedFlow.inputs} />
            <DetailList title="Actividades" items={selectedFlow.activities} />
            <DetailList title="Decisiones" items={selectedFlow.decisions} />
            <DetailList title="Entregables" items={selectedFlow.outputs} />
            <DetailList title="Indicadores" items={selectedFlow.metrics} />
            <DetailList title="Preguntas para el equipo" items={selectedFlow.instructorQuestions} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessMap({ flow }: { flow: Flow }) {
  return (
    <div className="process-map">
      {flow.lanes.map((lane) => (
        <div className="process-lane" key={lane.lane}>
          <strong>{lane.lane}</strong>
          <div>
            {lane.steps.map((step, index) => (
              <span key={step}>
                {step}
                {index < lane.steps.length - 1 && <ArrowRight size={14} />}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AiSection() {
  return (
    <section className="section-stack">
      <SectionHero
        icon={Bot}
        eyebrow="IA aplicada"
        title="La IA entra como copiloto de procesos, no como automatización ciega"
        text="Los GPTs internos deben trabajar sobre fuentes curadas, producir salidas estructuradas y pedir confirmación humana cuando la decisión afecte costo, plazo, diseño, contrato o seguridad."
      />

      <div className="ai-pipeline">
        {[
          ['Entrada', 'Documento, transcripción, RFI, foto, mapa o log'],
          ['Procesamiento', 'Clasifica, resume, detecta brecha, propone siguiente acción'],
          ['Salida', 'Glosario, borrador, observación, alerta, acta o checklist'],
          ['Control', 'Responsable valida, aprueba, corrige o rechaza'],
          ['Aprendizaje', 'Se actualiza estándar, pregunta frecuente o criterio'],
        ].map(([title, text], index) => (
          <article key={title}>
            <span>{index + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>

      <div className="agent-grid">
        {aiAgents.map((agent) => (
          <article className="agent-card" key={agent.name}>
            <div className="agent-head">
              <Sparkles size={20} />
              <h3>{agent.name}</h3>
            </div>
            <p>{agent.role}</p>
            <dl>
              <div>
                <dt>Entrada</dt>
                <dd>{agent.input}</dd>
              </div>
              <div>
                <dt>Salida</dt>
                <dd>{agent.output}</dd>
              </div>
              <div>
                <dt>Control humano</dt>
                <dd>{agent.humanControl}</dd>
              </div>
              <div>
                <dt>Riesgo</dt>
                <dd>{agent.risk}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorkshopSection() {
  return (
    <section className="section-stack">
      <SectionHero
        icon={GraduationCap}
        eyebrow="Guía docente"
        title="Taller con evaluación real de participación"
        text="El participante no solo escucha. Mapea, argumenta, identifica brechas, propone digitalización y demuestra que entiende cómo un flujo se convierte en sistema."
      />

      <div className="panel">
        <PanelHeader icon={ListChecks} label="Agenda" title="Secuencia recomendada de sesión" />
        <div className="agenda-list">
          {workshopAgenda.map((item) => (
            <article key={item.block}>
              <span>{item.minutes}</span>
              <div>
                <h3>{item.block}</h3>
                <p>{item.objective}</p>
                <small><strong>Artefacto:</strong> {item.artifact}</small>
                <small><strong>Movimiento docente:</strong> {item.instructorMove}</small>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--two">
        <div className="panel">
          <PanelHeader icon={ClipboardCheck} label="Rúbrica" title="Cómo evaluar participación" />
          <div className="rubric-list">
            {rubric.map((item) => (
              <article key={item.criterion}>
                <strong>{item.weight}</strong>
                <div>
                  <h3>{item.criterion}</h3>
                  <p>{item.observable}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <PanelHeader icon={Map} label="Dinámica" title="Preguntas que activan pensamiento de proceso" />
          <div className="question-bank">
            {[
              '¿Dónde empieza realmente el flujo y qué evento lo dispara?',
              '¿Qué información mínima necesita el siguiente rol para no detenerse?',
              '¿Qué decisión cambia la ruta del proceso?',
              '¿Qué documento o evidencia demuestra que la actividad terminó?',
              '¿Qué pasa cuando la respuesta llega tarde o incompleta?',
              '¿Qué parte se puede convertir en formulario, log, alerta o GPT?',
              '¿Qué métrica probaría que el proceso mejoró?',
              '¿Qué excepción ocurre con frecuencia y nadie registra?',
            ].map((question) => (
              <article key={question}>
                <AlertTriangle size={16} />
                <p>{question}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  return (
    <section className="section-stack">
      <SectionHero
        icon={Radar}
        eyebrow="Implementación"
        title="Roadmap para pasar de taller a sistema operativo digital"
        text="El objetivo es que cada sesión deje activos reutilizables: diagnóstico, mapa, estándar, log, dashboard, GPT y ritual de gestión."
      />

      <div className="roadmap">
        {roadmap.map((phase) => (
          <article key={phase.phase}>
            <span>{phase.phase}</span>
            <h3>{phase.name}</h3>
            <small>{phase.duration}</small>
            <ul>
              {phase.deliverables.map((deliverable) => (
                <li key={deliverable}>{deliverable}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="panel">
        <PanelHeader icon={AlertTriangle} label="Riesgos ocultos" title="Qué puede romper la implementación" />
        <div className="risk-grid">
          {risks.map((risk) => (
            <article className={toneIcon[risk.tone]} key={risk.risk}>
              <h3>{risk.risk}</h3>
              <p><strong>Impacto:</strong> {risk.impact}</p>
              <p><strong>Mitigación:</strong> {risk.mitigation}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHero({
  icon: Icon,
  eyebrow,
  title,
  text,
}: {
  icon: typeof ClipboardCheck;
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="section-hero">
      <div className="hero-icon">
        <Icon size={26} />
      </div>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

function PanelHeader({
  icon: Icon,
  label,
  title,
}: {
  icon: typeof ClipboardCheck;
  label: string;
  title: string;
}) {
  return (
    <div className="panel-header">
      <div>
        <Icon size={18} />
        <span>{label}</span>
      </div>
      <h2>{title}</h2>
    </div>
  );
}

function Progress({ value, target }: { value: number; target: number }) {
  return (
    <div className="progress-track" aria-label={`Actual ${value} meta ${target}`}>
      <span style={{ width: `${target}%` }} />
      <strong style={{ width: `${value}%` }} />
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="detail-list">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

export default App;
