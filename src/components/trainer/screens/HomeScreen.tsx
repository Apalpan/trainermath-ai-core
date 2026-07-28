import { cloneElement, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  Calculator,
  Cloud,
  Eye,
  Flame,
  Layers,
  Moon,
  Sun,
  Target,
  Timer,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { TrainerInsights } from '../../../lib/sessionAnalytics';
import { displaySessionConfig } from '../../../lib/sessionAnalytics';
import type { DailyGoalState, StreakState } from '../../../lib/gameSystem';
import { getNextRank, getRankForElo, getRankProgress, loadXp } from '../../../lib/gameSystem';
import { TARGET_SHEET_URL } from '../../../lib/sheetSync';
import type { DrillKind, TrainingSession } from '../../../types';
import { ProgressRing, RankBadge, SectionLabel, Sparkline } from '../components/ui';

interface DrillCardDef {
  drill: DrillKind;
  title: string;
  tagline: string;
  icon: ReactNode;
  featured?: boolean;
}

const drillCards: DrillCardDef[] = [
  { drill: 'flashAnzan', title: 'Flash Anzan', tagline: 'Retén la secuencia. Un número a la vez.', icon: <Brain size={20} />, featured: true },
  { drill: 'blitz', title: 'Contrarreloj', tagline: '¿Cuántas resuelves en 60 segundos?', icon: <Timer size={20} /> },
  { drill: 'operations', title: 'Operaciones', tagline: 'Aritmética, fracciones y álgebra adaptativas', icon: <Target size={20} /> },
  { drill: 'digitSpan', title: 'Memoria de Dígitos', tagline: 'Retén el número. Amplía tu span.', icon: <Eye size={20} /> },
  { drill: 'multiplicationSprint', title: 'Multiplicación Sprint', tagline: '1×1, 2×2 y encadenadas por velocidad', icon: <Calculator size={20} /> },
  { drill: 'flashCards', title: 'Flash Cards', tagline: 'Memoriza tablas, cuadrados y equivalencias', icon: <Layers size={20} /> },
  { drill: 'doubleX2', title: 'Multiplicar x2', tagline: 'Duplicación progresiva sin frenos', icon: <ArrowRight size={20} /> },
  { drill: 'cepreExam', title: 'Examen CEPRE', tagline: 'Números y álgebra en formato examen', icon: <BookOpenCheck size={20} /> },
];

export default function HomeScreen({
  sessions,
  insights,
  daily,
  dayStreak,
  theme,
  soundOn,
  sheetPanel,
  onSelectDrill,
  onToggleTheme,
  onToggleSound,
  onToggleSheetPanel,
}: {
  sessions: TrainingSession[];
  insights: TrainerInsights;
  daily: DailyGoalState;
  dayStreak: StreakState;
  theme: 'dark' | 'light';
  soundOn: boolean;
  sheetPanel: ReactNode;
  onSelectDrill: (drill: DrillKind) => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onToggleSheetPanel: () => void;
}) {
  const elo = insights.currentElo || 1000;
  const rank = getRankForElo(elo);
  const nextRank = getNextRank(rank);
  const rankProgress = getRankProgress(elo);
  const xp = useMemo(() => loadXp(), []);
  const [showProgress, setShowProgress] = useState(false);

  const eloHistory = useMemo(
    () => [...sessions].reverse().map((session) => session.metrics.generalElo ?? session.metrics.elo ?? 1000).slice(-10),
    [sessions],
  );

  const bestByDrill = useMemo(() => {
    const map = new Map<DrillKind, number>();
    for (const session of sessions) {
      const value = session.metrics.modeElo ?? session.metrics.elo ?? 0;
      if (!map.has(session.kind)) map.set(session.kind, value);
    }
    return map;
  }, [sessions]);

  const dailyPct = Math.min(100, Math.round((daily.completedOpsToday / daily.targetOps) * 100));
  const [staggerHub] = useState(() => !hubStaggerPlayed);
  useMemo(() => {
    hubStaggerPlayed = true;
  }, []);

  return (
    <div className="tm-screen mx-auto w-full max-w-5xl px-5 pb-16 pt-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'var(--tm-blue-soft)', color: 'var(--tm-blue)' }}>
            <Brain size={20} />
          </div>
          <div>
            <p className="tm-display text-base font-bold" style={{ color: 'var(--tm-fg)' }}>Trainer Math</p>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--tm-fg-muted)' }}>GEN+ Neural Training</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HeaderIcon label={soundOn ? 'Silenciar sonido' : 'Activar sonido'} onClick={onToggleSound}>
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </HeaderIcon>
          <HeaderIcon label="Sincronización con Sheets" onClick={onToggleSheetPanel}>
            <Cloud size={16} />
          </HeaderIcon>
          <HeaderIcon label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </HeaderIcon>
        </div>
      </header>

      {sheetPanel}

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <h1 className="tm-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--tm-fg)' }}>¿Qué entrenas hoy?</h1>
          <div className={`mt-5 grid gap-3 sm:grid-cols-2 ${staggerHub ? 'tm-stagger' : ''}`}>
            {drillCards.map((card) => {
              const best = bestByDrill.get(card.drill);
              return (
                <button
                  key={card.drill}
                  type="button"
                  className={`tm-card tm-drill tm-press group text-left ${card.featured ? 'sm:col-span-2' : ''}`}
                  data-drill={card.drill}
                  style={{ padding: card.featured ? '1.5rem' : '1.15rem', boxShadow: card.featured ? 'var(--tm-shadow-md), var(--tm-hairline)' : undefined }}
                  onClick={() => onSelectDrill(card.drill)}
                >
                  <span className="tm-drill-watermark" aria-hidden="true">
                    {cloneElement(card.icon as ReactElement<{ size?: number }>, { size: card.featured ? 120 : 92 })}
                  </span>
                  <span className="flex items-start justify-between gap-3">
                    <span className={`tm-drill-icon shrink-0 ${card.featured ? 'h-12 w-12' : 'h-10 w-10'}`}>
                      {card.icon}
                    </span>
                    {best ? (
                      <span className="text-xs font-bold" style={{ color: 'var(--tm-fg-muted)' }}>ELO {best}</span>
                    ) : card.featured && sessions.length === 0 ? (
                      <span className="text-xs font-bold" style={{ color: 'var(--tm-blue)' }}>Empieza aquí</span>
                    ) : null}
                  </span>
                  <span className="flex items-end justify-between gap-3">
                    <span className="min-w-0">
                      <span className={`tm-display mt-3 block font-bold ${card.featured ? 'text-xl' : 'text-base'}`} style={{ color: 'var(--tm-fg)' }}>
                        {card.title}
                      </span>
                      <span className="mt-1 block text-sm font-medium leading-5" style={{ color: 'var(--tm-fg-mid)' }}>{card.tagline}</span>
                    </span>
                    {card.featured && (
                      <ArrowRight
                        size={18}
                        className="mb-1 shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                        style={{ color: 'var(--tm-fg-mid)' }}
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <section className="tm-card p-5">
            <div className="flex items-center gap-4">
              <RankBadge rank={rank} />
              <div className="min-w-0">
                <p className="tm-display truncate text-base font-bold" style={{ color: 'var(--tm-fg)' }}>{rank.name}</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>ELO {elo}{nextRank ? ` · siguiente: ${nextRank.name}` : ' · rango máximo'}</p>
              </div>
            </div>
            <div className="tm-xp-track mt-4">
              <div className="tm-xp-bar" style={{ width: `${Math.round(rankProgress * 100)}%` }} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <ProgressRing
                value={daily.completedOpsToday / daily.targetOps}
                size={64}
                stroke={5}
                color={dailyPct >= 100 ? 'var(--tm-good)' : 'var(--tm-blue)'}
                label={`Meta diaria: ${daily.completedOpsToday} de ${daily.targetOps} operaciones`}
              >
                <span className="tm-display text-xs font-bold" style={{ color: 'var(--tm-fg)' }}>{dailyPct}%</span>
              </ProgressRing>
              <div className="grid flex-1 grid-cols-2 gap-2">
                <MiniStat
                  label="Racha"
                  value={dayStreak.dayStreak ? `${dayStreak.dayStreak}d` : '—'}
                  sub={dayStreak.bestDayStreak ? `mejor ${dayStreak.bestDayStreak}` : ''}
                  icon={dayStreak.dayStreak >= 2 ? <Flame size={12} /> : undefined}
                />
                <MiniStat label="XP hoy" value={String(xp.todayXp)} sub={`total ${formatXp(xp.lifetimeXp)}`} />
              </div>
            </div>
            <p className="mt-2 text-[10.5px] font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>
              Meta de hoy · {daily.completedOpsToday}/{daily.targetOps} ops
            </p>
          </section>

          <section className="tm-card p-5">
            <div className="flex items-center justify-between">
              <SectionLabel>Progreso</SectionLabel>
              {sessions.length > 3 && (
                <button type="button" className="tm-press -m-2 min-h-11 p-2 text-xs font-bold" style={{ color: 'var(--tm-blue)' }} onClick={() => setShowProgress((value) => !value)}>
                  {showProgress ? 'Menos' : 'Ver top'}
                </button>
              )}
            </div>
            <div className="mt-3">
              <Sparkline values={eloHistory} />
            </div>
            {sessions.length === 0 && (
              <p className="mt-2 text-xs font-semibold leading-5" style={{ color: 'var(--tm-fg-muted)' }}>
                Completa tu primera ronda para ver tu progreso.
              </p>
            )}
            {showProgress && insights.leaderboard.length > 0 && (
              <div className="mt-3 grid gap-2">
                {insights.leaderboard.slice(0, 3).map((session, index) => (
                  <div key={session.id} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: 'var(--tm-blue-soft)' }}>
                    <span className="tm-display text-xs font-bold" style={{ color: 'var(--tm-blue)' }}>{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold" style={{ color: 'var(--tm-fg)' }}>{sessionTitle(session)}</p>
                      <p className="truncate text-[10px] font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>{displaySessionConfig(session)}</p>
                    </div>
                    <span className="tm-display text-sm font-bold" style={{ color: 'var(--tm-fg-mid)' }}>{session.metrics.generalElo ?? session.metrics.elo}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function HeaderIcon({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" className="tm-btn-ghost tm-press grid h-11 w-11 place-items-center" style={{ padding: 0 }} aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function MiniStat({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl px-2.5 py-2" style={{ background: 'var(--tm-blue-soft)' }}>
      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.12em]" style={{ color: 'var(--tm-fg-muted)' }}>{label}</p>
      <p className="tm-display mt-0.5 flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--tm-fg)' }}>
        {icon && <span style={{ color: 'var(--tm-accent)' }}>{icon}</span>}
        {value}
      </p>
      {sub ? <p className="text-[10.5px] font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>{sub}</p> : null}
    </div>
  );
}

// el stagger del hub corre UNA vez por carga de app: re-escalonar 8 tiles
// después de cada ronda pasa de premium a molesto
let hubStaggerPlayed = false;

const sessionTitle = (session: TrainingSession) => {
  const titles: Record<DrillKind, string> = {
    operations: 'Operaciones',
    flashAnzan: 'Flash Anzan',
    multiplicationSprint: 'Multiplicación',
    doubleX2: 'Multiplicar x2',
    cepreExam: 'CEPRE',
    flashCards: 'Flash Cards',
    blitz: 'Contrarreloj',
    digitSpan: 'Memoria de Dígitos',
  };
  return titles[session.kind];
};

const formatXp = (value: number) => (value >= 10000 ? `${Math.round(value / 1000)}k` : String(value));

export function SheetSyncPanel({
  endpoint,
  pending,
  message,
  onEndpointChange,
  onSave,
  onClose,
}: {
  endpoint: string;
  pending: number;
  message: string;
  onEndpointChange: (endpoint: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <section className="tm-card tm-screen mt-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Sincronización con Google Sheets</SectionLabel>
          <p className="mt-1 text-sm font-medium leading-6" style={{ color: 'var(--tm-fg-mid)' }}>{message}</p>
          <p className="mt-1 text-xs font-bold" style={{ color: 'var(--tm-fg-muted)' }}>{pending} intento(s) en cola local</p>
        </div>
        <button type="button" className="tm-btn-ghost grid h-11 w-11 shrink-0 place-items-center" style={{ padding: 0 }} aria-label="Cerrar panel" onClick={onClose}>
          <X size={15} />
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          className="tm-card min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base font-medium outline-none"
          style={{ color: 'var(--tm-fg)' }}
          placeholder="https://script.google.com/macros/s/.../exec"
          value={endpoint}
          onChange={(event) => onEndpointChange(event.target.value)}
        />
        <div className="flex gap-2">
          <button type="button" className="tm-btn-ghost tm-press px-4 py-2.5 text-sm" onClick={onSave}>Guardar</button>
          <a className="tm-btn-ghost tm-press inline-flex items-center px-4 py-2.5 text-sm" href={TARGET_SHEET_URL} target="_blank" rel="noreferrer">Abrir Sheet</a>
        </div>
      </div>
    </section>
  );
}
