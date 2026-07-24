import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Home, Play, Settings2, Sparkles, TrendingUp } from 'lucide-react';
import type { RankDef, SessionRecordResult } from '../../../lib/gameSystem';
import { getRankProgress } from '../../../lib/gameSystem';
import { formatCompactNumber, formatDuration } from '../../../lib/scoring';
import type { TrainingSession } from '../../../types';
import { Keycap, RankBadge, SectionLabel, StatChip, useCountUp } from '../components/ui';

export interface GameOutcome {
  xpEarned: number;
  bestCombo: number;
  records: SessionRecordResult;
  rankBefore: RankDef;
  rankAfter: RankDef;
}

export default function ResultsScreen({
  session,
  outcome,
  onRepeat,
  onConfigure,
  onHome,
}: {
  session: TrainingSession;
  outcome: GameOutcome;
  onRepeat: () => void;
  onConfigure: () => void;
  onHome: () => void;
}) {
  const { metrics } = session;
  const [showDetail, setShowDetail] = useState(false);
  const rankUp = outcome.rankAfter.index > outcome.rankBefore.index;
  const elo = metrics.generalElo ?? metrics.elo ?? 1000;
  const eloDelta = metrics.eloDelta ?? 0;

  const hero = useMemo(() => {
    if (session.kind === 'flashAnzan') {
      const rounds = metrics.rounds ?? 1;
      return { value: metrics.correct, suffix: `/${rounds}`, label: 'Rondas correctas' };
    }
    if (session.kind === 'doubleX2') {
      return { value: metrics.completed ?? metrics.correct, suffix: '', label: 'Pasos de duplicación' };
    }
    return { value: metrics.accuracy, suffix: '%', label: 'Precisión' };
  }, [metrics, session.kind]);

  const heroValue = useCountUp(hero.value, 900);
  const xpValue = useCountUp(outcome.xpEarned, 1100);

  const headline = rankUp
    ? `ASCENSO — ${outcome.rankAfter.name}`
    : outcome.records.newBestElo
      ? 'RÉCORD DE ELO'
      : metrics.accuracy === 100 && metrics.correct > 0
        ? 'RONDA PERFECTA'
        : outcome.records.newBestCombo
          ? `MEJOR COMBO ×${outcome.bestCombo}`
          : null;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); onRepeat(); }
      if (event.key.toLowerCase() === 'c') { event.preventDefault(); onConfigure(); }
      if (event.key === 'Escape') { event.preventDefault(); onHome(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onConfigure, onHome, onRepeat]);

  return (
    <div className="tm-screen mx-auto w-full max-w-2xl px-5 pb-16 pt-10 text-center sm:pt-16">
      {headline && (
        <p
          className="tm-display inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.2em]"
          style={{ color: 'var(--tm-accent)' }}
          aria-live="polite"
        >
          <Sparkles size={15} /> {headline}
        </p>
      )}

      <div className="mt-4">
        <SectionLabel>{hero.label}</SectionLabel>
        <p className="tm-display tm-hero-size mt-1 font-bold" style={{ color: 'var(--tm-fg)' }}>
          {heroValue}
          <span style={{ color: 'var(--tm-fg-muted)', fontSize: '0.45em' }}>{hero.suffix}</span>
        </p>
        <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--tm-fg-mid)' }}>
          {session.kind === 'flashAnzan'
            ? `Mejor racha ${metrics.bestStreak ?? 0} · recall prom. ${formatDuration(metrics.averageTimeMs)}`
            : session.kind === 'doubleX2'
              ? `Máximo ${metrics.maxValue ? formatCompactNumber(metrics.maxValue) : '--'}`
              : `${metrics.correct}/${metrics.correct + metrics.incorrect} correctas`}
        </p>
      </div>

      <div className={`mx-auto mt-8 max-w-md ${rankUp ? 'tm-glow-ring rounded-2xl' : ''}`}>
        <div className="tm-card flex items-center gap-4 p-5 text-left">
          <RankBadge rank={outcome.rankAfter} celebrate={rankUp} />
          <div className="min-w-0 flex-1">
            <p className="tm-display truncate text-sm font-bold" style={{ color: 'var(--tm-fg)' }}>{outcome.rankAfter.name}</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="tm-xp-track flex-1">
                <div className="tm-xp-bar" style={{ width: `${Math.round(getRankProgress(elo) * 100)}%` }} />
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--tm-fg-muted)' }}>ELO {elo}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="tm-display text-lg font-bold" style={{ color: eloDelta >= 0 ? 'var(--tm-good)' : 'var(--tm-bad)' }}>
              {eloDelta >= 0 ? '+' : ''}{eloDelta}
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em]" style={{ color: 'var(--tm-fg-muted)' }}>ELO</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-3">
        <StatChip label="Tiempo prom." value={formatDuration(metrics.averageTimeMs)} />
        <StatChip label="Mejor combo" value={outcome.bestCombo ? `×${outcome.bestCombo}` : '—'} tone={outcome.records.newBestCombo ? 'accent' : undefined} />
        <StatChip label="XP ganado" value={`+${xpValue}`} tone="good" />
      </div>

      <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
        <button type="button" className="tm-btn-cta tm-press flex flex-1 items-center justify-center gap-2 px-5 py-4 text-sm font-extrabold" onClick={onRepeat}>
          <Play size={16} /> Otra ronda <Keycap label="R" />
        </button>
        <button type="button" className="tm-btn-ghost tm-press flex items-center justify-center gap-2 px-5 py-4 text-sm" onClick={onConfigure}>
          <Settings2 size={16} /> Cambiar
        </button>
        <button type="button" className="tm-btn-ghost tm-press flex items-center justify-center gap-2 px-5 py-4 text-sm" onClick={onHome} aria-label="Volver al inicio">
          <Home size={16} />
        </button>
      </div>

      <div className="mx-auto mt-8 max-w-md text-left">
        <button
          type="button"
          className="tm-btn-ghost tm-press inline-flex items-center gap-2 px-4 py-2.5 text-sm"
          aria-expanded={showDetail}
          onClick={() => setShowDetail((value) => !value)}
        >
          Ver análisis
          <ChevronDown size={15} style={{ transform: showDetail ? 'rotate(180deg)' : undefined, transition: 'transform 180ms var(--ease-out)' }} />
        </button>

        {showDetail && (
          <div className="tm-card tm-screen mt-3 grid gap-4 p-5">
            <p className="text-sm font-medium leading-6" style={{ color: 'var(--tm-fg-mid)' }}>{metrics.analysis}</p>
            <div className="grid gap-2">
              <DetailRow label="Estado" value={metrics.status} />
              <DetailRow label="Foco débil" value={metrics.weakestCategory} />
              <DetailRow label="Mejor área" value={metrics.bestCategory} />
              <DetailRow label="Más rápida" value={formatDuration(metrics.fastestTimeMs)} />
              <DetailRow label="Más lenta" value={formatDuration(metrics.slowestTimeMs)} />
              {metrics.avgRung !== undefined && <DetailRow label="Dificultad adaptativa" value={`peldaño ${metrics.endRung} (pico ${metrics.peakRung})`} />}
              {metrics.minDisplayMs !== undefined && <DetailRow label="Aparición mínima" value={`${metrics.minDisplayMs} ms`} />}
              <DetailRow label="Sheets" value={session.syncStatus === 'synced' ? 'Enviado' : 'Pendiente'} />
            </div>
            <div className="flex items-start gap-2 rounded-lg p-3" style={{ background: 'var(--tm-blue-soft)' }}>
              <TrendingUp size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--tm-blue)' }} />
              <p className="text-sm font-medium leading-5" style={{ color: 'var(--tm-fg-mid)' }}>{metrics.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2" style={{ borderColor: 'var(--tm-border)' }}>
      <span className="text-xs font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>{label}</span>
      <span className="max-w-[220px] truncate text-right text-xs font-bold" style={{ color: 'var(--tm-fg)' }}>{value}</span>
    </div>
  );
}
