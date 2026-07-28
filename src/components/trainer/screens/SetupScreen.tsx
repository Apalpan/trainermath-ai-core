import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, Brain, Calculator, ChevronDown, Eye, Layers, Play, Target, Timer } from 'lucide-react';
import type { FlashDeckId } from '../../../lib/flashCards';
import { flashDeckMetas, getDeckStats } from '../../../lib/flashCards';
import type {
  AnzanConfig,
  AnzanPreset,
  BlitzConfig,
  BlitzDurationSec,
  CepreConfig,
  DigitSpanConfig,
  DoubleX2Config,
  DoubleX2StepLimit,
  DrillKind,
  Level,
  MultiplicationConfig,
  PracticeTopic,
  TrainingConfig,
  TrainingMode,
} from '../../../types';
import {
  anzanPresetLabels,
  categoryLabels,
  cepreBlockLabels,
  cepreModeLabels,
  drillLabels,
  levelLabels,
  modeLabels,
  multiplicationTypeLabels,
  practiceTopicLabels,
} from '../../../types';
import { Keycap, SectionLabel } from '../components/ui';

export interface FlashCardsSetup {
  decks: FlashDeckId[];
  amount: number;
}

interface SetupProps {
  drill: DrillKind;
  operations: TrainingConfig;
  multiplication: MultiplicationConfig;
  anzan: AnzanConfig;
  x2: DoubleX2Config;
  cepre: CepreConfig;
  flashCards: FlashCardsSetup;
  blitz: BlitzConfig;
  digitSpan: DigitSpanConfig;
  onChangeOperations: (config: TrainingConfig) => void;
  onChangeMultiplication: (config: MultiplicationConfig) => void;
  onChangeAnzan: (config: AnzanConfig) => void;
  onChangeX2: (config: DoubleX2Config) => void;
  onChangeCepre: (config: CepreConfig) => void;
  onChangeFlashCards: (config: FlashCardsSetup) => void;
  onChangeBlitz: (config: BlitzConfig) => void;
  onChangeDigitSpan: (config: DigitSpanConfig) => void;
  onStart: () => void;
  onBack: () => void;
}

const drillIcons: Record<DrillKind, ReactNode> = {
  flashAnzan: <Brain size={30} />,
  blitz: <Timer size={30} />,
  operations: <Target size={30} />,
  digitSpan: <Eye size={30} />,
  multiplicationSprint: <Calculator size={30} />,
  flashCards: <Layers size={30} />,
  doubleX2: <ArrowRight size={30} />,
  cepreExam: <BookOpenCheck size={30} />,
};

const drillTaglines: Record<DrillKind, string> = {
  operations: 'Aritmética, fracciones, álgebra y variantes de cálculo rápido con dificultad adaptativa.',
  multiplicationSprint: 'Automatiza productos 1×1, 1×2, 2×2 y encadenados.',
  flashAnzan: 'Retén la secuencia. Un número a la vez. Varias rondas.',
  doubleX2: 'Duplica sin parar. ¿Hasta dónde llegas sin romper el ritmo?',
  cepreExam: 'Números y álgebra con formato de examen por microtema.',
  flashCards: 'Memoriza los datos que hacen rápido al cálculo: tablas, cuadrados, equivalencias.',
  blitz: 'Un cronómetro fijo, un score que batir mañana. La dificultad se adapta sola.',
  digitSpan: 'Un número aparece 1.2 segundos y desaparece. Retenlo. El span crece contigo.',
};

interface Preset<T> {
  name: string;
  detail: string;
  apply: T;
}

const operationPresets: Preset<Partial<TrainingConfig>>[] = [
  { name: 'Rápido', detail: '10 preguntas · Nivel 1', apply: { level: 'level1', topics: ['mixed'], category: 'mixed', mode: 'speed', amount: 10 } },
  { name: 'Estándar', detail: '25 preguntas · Nivel 2', apply: { level: 'level2', topics: ['mixed'], category: 'mixed', mode: 'mixed', amount: 25 } },
  { name: 'Reto', detail: '25 preguntas · Nivel 4', apply: { level: 'level4', topics: ['mixed'], category: 'mixed', mode: 'accuracy', amount: 25 } },
  { name: 'Maratón', detail: '50 preguntas · Nivel 3', apply: { level: 'level3', topics: ['mixed'], category: 'mixed', mode: 'mixed', amount: 50 } },
];

const multiplicationPresets: Preset<Partial<MultiplicationConfig>>[] = [
  { name: 'Tablas', detail: '1×1 · Nivel 1 · 20', apply: { multiplicationType: 'oneByOne', level: 'level1', amount: 20, mode: 'speed' } },
  { name: 'Sprint', detail: 'Mixto · Nivel 2 · 30', apply: { multiplicationType: 'mixed', level: 'level2', amount: 30, mode: 'speed' } },
  { name: 'Encadenadas', detail: '3 factores · Nivel 3', apply: { multiplicationType: 'chain', chainFactorCount: 3, level: 'level3', amount: 20, mode: 'mixed' } },
  { name: 'Doble', detail: 'Doble infinito · Nivel 3', apply: { multiplicationType: 'doubleInfinity', level: 'level3', amount: 20, mode: 'mixed' } },
];

const anzanPresets: Record<Exclude<AnzanPreset, 'custom'>, Pick<AnzanConfig, 'digits' | 'terms' | 'displayMs' | 'operationMode' | 'advanceMode'>> = {
  easy: { digits: 1, terms: 5, displayMs: 1000, operationMode: 'addition', advanceMode: 'timed' },
  medium: { digits: 2, terms: 8, displayMs: 750, operationMode: 'addition', advanceMode: 'timed' },
  hard: { digits: 3, terms: 10, displayMs: 550, operationMode: 'additionSubtraction', advanceMode: 'timed' },
  expert: { digits: 4, terms: 15, displayMs: 700, operationMode: 'additionSubtraction', advanceMode: 'timed' },
};

const ceprePresets: Preset<Partial<CepreConfig>>[] = [
  { name: 'Diagnóstico', detail: '30 preguntas · mixto', apply: { mode: 'diagnostic', block: 'mixed', level: 'level2', amount: 30 } },
  { name: 'Práctica', detail: '20 preguntas · Nivel 2', apply: { mode: 'practice', block: 'mixed', level: 'level2', amount: 20 } },
  { name: 'Simulacro', detail: '30 preguntas · presión', apply: { mode: 'simulation', block: 'mixed', level: 'level3', amount: 30 } },
];

const topicGroups: Array<{ title: string; topics: PracticeTopic[] }> = [
  { title: 'Aritmética', topics: ['addition', 'subtraction', 'multiplication', 'division', 'combined'] },
  { title: 'Cálculo rápido', topics: ['complements', 'doubleHalf', 'estimation', 'squares', 'specialProducts', 'chainMultiplication', 'doubleX2'] },
  { title: 'Fracciones y proporciones', topics: ['fractions', 'percentages', 'ratios', 'averages'] },
  { title: 'Avanzado', topics: ['algebra', 'powers', 'roots', 'series', 'divisibility'] },
];

const configMatchesPreset = (config: Record<string, unknown>, apply: Record<string, unknown>) =>
  Object.entries(apply).every(([key, value]) => JSON.stringify(config[key]) === JSON.stringify(value));

export default function SetupScreen(props: SetupProps) {
  const { drill, onStart, onBack } = props;
  const [customOpen, setCustomOpen] = useState(false);

  const presetCount = drill === 'operations' || drill === 'multiplicationSprint' || drill === 'flashAnzan'
    ? 4
    : drill === 'cepreExam' || drill === 'blitz' || drill === 'digitSpan' ? 3 : 0;

  // el preset activo se DERIVA de la config real: si el usuario personaliza,
  // ningún preset queda resaltado (el highlight nunca miente)
  const presetIndex = useMemo(() => {
    if (drill === 'operations') return operationPresets.findIndex((preset) => configMatchesPreset(props.operations as unknown as Record<string, unknown>, preset.apply as Record<string, unknown>));
    if (drill === 'multiplicationSprint') return multiplicationPresets.findIndex((preset) => configMatchesPreset(props.multiplication as unknown as Record<string, unknown>, preset.apply as Record<string, unknown>));
    if (drill === 'flashAnzan') return (['easy', 'medium', 'hard', 'expert'] as const).indexOf(props.anzan.preset as 'easy');
    if (drill === 'cepreExam') return ceprePresets.findIndex((preset) => configMatchesPreset(props.cepre as unknown as Record<string, unknown>, preset.apply as Record<string, unknown>));
    if (drill === 'blitz') return ([60, 120, 180] as const).indexOf(props.blitz.durationSec);
    if (drill === 'digitSpan') return props.digitSpan.startDigits === undefined ? 0 : props.digitSpan.startDigits === 4 ? 1 : props.digitSpan.startDigits === 6 ? 2 : -1;
    return -1;
  }, [drill, props.anzan.preset, props.blitz.durationSec, props.cepre, props.digitSpan.startDigits, props.multiplication, props.operations]);

  const applyPreset = (index: number) => {
    if (drill === 'operations') props.onChangeOperations({ ...props.operations, ...operationPresets[index].apply });
    if (drill === 'multiplicationSprint') props.onChangeMultiplication({ ...props.multiplication, ...multiplicationPresets[index].apply });
    if (drill === 'flashAnzan') {
      const key = (['easy', 'medium', 'hard', 'expert'] as const)[index];
      props.onChangeAnzan({ ...props.anzan, ...anzanPresets[key], preset: key });
    }
    if (drill === 'cepreExam') props.onChangeCepre({ ...props.cepre, ...ceprePresets[index].apply });
    if (drill === 'blitz') props.onChangeBlitz({ ...props.blitz, durationSec: ([60, 120, 180] as const)[index] as BlitzDurationSec });
    if (drill === 'digitSpan') props.onChangeDigitSpan({ ...props.digitSpan, startDigits: [undefined, 4, 6][index] });
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onBack();
        return;
      }
      if (event.key === 'Enter') {
        // si el foco está sobre un control, Enter lo activa (no roba la acción)
        if (target && target.closest('button, a, select, [role="button"]')) return;
        event.preventDefault();
        onStart();
        return;
      }
      const digit = Number(event.key);
      if (digit >= 1 && digit <= presetCount) applyPreset(digit - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drill, presetCount, onBack, onStart, props.operations, props.multiplication, props.anzan, props.cepre]);

  const presets: Array<Preset<unknown>> = drill === 'operations'
    ? operationPresets
    : drill === 'multiplicationSprint'
      ? multiplicationPresets
      : drill === 'flashAnzan'
        ? (['easy', 'medium', 'hard', 'expert'] as const).map((key) => ({
            name: anzanPresetLabels[key],
            detail: `${anzanPresets[key].digits} díg · ${anzanPresets[key].terms} núm · ${anzanPresets[key].displayMs} ms`,
            apply: {},
          }))
        : drill === 'cepreExam'
          ? ceprePresets
          : drill === 'blitz'
            ? [
                { name: 'Sprint 60', detail: '60 segundos', apply: {} },
                { name: 'Ronda 120', detail: '2 minutos', apply: {} },
                { name: 'Resistencia 180', detail: '3 minutos', apply: {} },
              ]
            : drill === 'digitSpan'
              ? [
                  { name: 'Continuar', detail: 'Desde donde quedaste', apply: {} },
                  { name: 'Desde 4', detail: '4 dígitos', apply: {} },
                  { name: 'Desde 6', detail: '6 dígitos', apply: {} },
                ]
              : [];

  return (
    <div className="tm-screen mx-auto w-full max-w-2xl px-5 pb-6 pt-8 sm:pt-12">
      <button type="button" className="tm-btn-ghost tm-press inline-flex items-center gap-2 px-4 py-2.5 text-sm" onClick={onBack}>
        <ArrowLeft size={16} /> Inicio
      </button>

      <div className="mt-6 flex items-center gap-4" data-drill={drill}>
        <div className="tm-game-hero">{drillIcons[drill]}</div>
        <div>
          <h1 className="tm-display text-3xl font-bold" style={{ color: 'var(--tm-fg)' }}>{drillLabels[drill]}</h1>
          <p className="mt-1 max-w-lg text-sm leading-6" style={{ color: 'var(--tm-fg-mid)' }}>{drillTaglines[drill]}</p>
        </div>
      </div>

      {presets.length > 0 && (
        <div className="mt-8">
          <SectionLabel>Presets — teclas 1 a {presets.length}</SectionLabel>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {presets.map((preset, index) => (
              <button
                key={preset.name}
                type="button"
                className="tm-seg tm-press flex items-center justify-between gap-3 px-4 py-4 text-left"
                data-active={presetIndex === index ? 'true' : 'false'}
                onClick={() => applyPreset(index)}
              >
                <span>
                  <span className="tm-display block text-base font-bold">{preset.name}</span>
                  <span className="mt-0.5 block text-xs font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>{preset.detail}</span>
                </span>
                <Keycap label={String(index + 1)} />
              </button>
            ))}
          </div>
        </div>
      )}

      {drill === 'flashAnzan' && (
        <div className="mt-6">
          <SectionLabel>Rondas por sesión</SectionLabel>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[3, 5, 10].map((rounds) => (
              <button
                key={rounds}
                type="button"
                className="tm-seg tm-press px-4 py-3.5 text-sm"
                data-active={(props.anzan.rounds ?? 5) === rounds ? 'true' : 'false'}
                onClick={() => props.onChangeAnzan({ ...props.anzan, rounds })}
              >
                {rounds} rondas
              </button>
            ))}
          </div>
        </div>
      )}

      {drill === 'doubleX2' && <X2Setup config={props.x2} onChange={props.onChangeX2} />}
      {drill === 'flashCards' && <FlashCardsSetupPanel config={props.flashCards} onChange={props.onChangeFlashCards} />}

      {drill !== 'doubleX2' && drill !== 'flashCards' && drill !== 'digitSpan' && (
        <div className="mt-8">
          <button
            type="button"
            className="tm-btn-ghost tm-press inline-flex items-center gap-2 px-4 py-2.5 text-sm"
            aria-expanded={customOpen}
            onClick={() => setCustomOpen((value) => !value)}
          >
            Personalizar
            <ChevronDown size={15} style={{ transform: customOpen ? 'rotate(180deg)' : undefined, transition: 'transform 180ms var(--ease-out)' }} />
          </button>

          {customOpen && (
            <div className="tm-screen mt-4 grid gap-6">
              {drill === 'operations' && <OperationsCustom config={props.operations} onChange={(config) => { props.onChangeOperations(config); }} />}
              {drill === 'multiplicationSprint' && <MultiplicationCustom config={props.multiplication} onChange={props.onChangeMultiplication} />}
              {drill === 'flashAnzan' && <AnzanCustom config={props.anzan} onChange={props.onChangeAnzan} />}
              {drill === 'cepreExam' && <CepreCustom config={props.cepre} onChange={props.onChangeCepre} />}
              {drill === 'blitz' && <BlitzCustom config={props.blitz} onChange={props.onChangeBlitz} />}
            </div>
          )}
        </div>
      )}

      <div
        className="sticky bottom-0 z-30 -mx-5 mt-8 px-5 pb-5 pt-6"
        style={{ background: 'linear-gradient(to top, var(--tm-bg) 60%, transparent)', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <p className="mb-2 text-center text-xs font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>
          {presetIndex >= 0 && presets[presetIndex]
            ? `${presets[presetIndex].name} · ${presets[presetIndex].detail}`
            : 'Configuración personalizada'}
        </p>
        <button
          type="button"
          className="tm-btn-cta tm-press mx-auto flex w-full max-w-2xl items-center justify-center gap-2 px-6 py-4 text-base font-extrabold"
          onClick={onStart}
        >
          <Play size={18} /> Empezar
          <Keycap label="Enter" />
        </button>
      </div>
    </div>
  );
}

/* ---------- primitivas ---------- */

function Seg<T extends string>({ title, items, labels, selected, onSelect, columns = 3 }: {
  title: string;
  items: readonly T[];
  labels: Record<T, string>;
  selected: T;
  onSelect: (item: T) => void;
  columns?: number;
}) {
  return (
    <div>
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <button key={item} type="button" className="tm-seg tm-press min-h-11 px-3 py-2.5 text-sm" data-active={selected === item ? 'true' : 'false'} onClick={() => onSelect(item)}>
            {labels[item]}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberField({ label, value, min, max, step = 1, suffix, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const parsed = Number(draft);
    const fallback = Number.isFinite(parsed) ? parsed : value;
    const stepped = step === 1 ? Math.round(fallback) : Math.round(fallback / step) * step;
    const next = Math.min(max, Math.max(min, stepped));
    setDraft(String(next));
    onChange(next);
  };
  return (
    <label className="tm-card block p-4">
      <span className="tm-eyebrow">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <input
          className="tm-display w-full min-w-0 bg-transparent text-xl font-bold outline-none"
          style={{ color: 'var(--tm-fg)' }}
          inputMode="numeric"
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, '').slice(0, 5))}
          onBlur={commit}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.stopPropagation(); event.currentTarget.blur(); } }}
        />
        <span className="text-xs font-bold" style={{ color: 'var(--tm-fg-muted)' }}>{suffix}</span>
      </div>
    </label>
  );
}

const amountOptions = [10, 20, 30, 50, 100];

function AmountSeg({ value, onChange }: { value: number; onChange: (amount: number) => void }) {
  return (
    <div>
      <SectionLabel>Cantidad</SectionLabel>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {amountOptions.map((amount) => (
          <button key={amount} type="button" className="tm-seg tm-press min-h-11 px-2 py-2.5 text-sm" data-active={value === amount ? 'true' : 'false'} onClick={() => onChange(amount)}>
            {amount}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- paneles custom por drill ---------- */

const levelOptions: Level[] = ['level1', 'level2', 'level3', 'level4', 'level5'];
const modeOptions: TrainingMode[] = ['mixed', 'speed', 'accuracy'];

function OperationsCustom({ config, onChange }: { config: TrainingConfig; onChange: (config: TrainingConfig) => void }) {
  const selected = config.topics ?? [config.category];
  const isAll = selected.includes('mixed');
  const toggleTopic = (topic: PracticeTopic) => {
    if (topic === 'mixed') {
      onChange({ ...config, topics: ['mixed'], category: 'mixed' });
      return;
    }
    const base = selected.filter((item) => item !== 'mixed');
    const next = base.includes(topic) ? base.filter((item) => item !== topic) : [...base, topic];
    const category: TrainingConfig['category'] = next.find(
      (item): item is Exclude<TrainingConfig['category'], 'mixed'> => item in categoryLabels,
    ) ?? 'mixed';
    onChange({ ...config, topics: next.length ? next : ['mixed'], category: next.length ? category : 'mixed' });
  };

  return (
    <>
      <Seg title="Nivel" items={levelOptions} labels={levelLabels} selected={config.level} onSelect={(level) => onChange({ ...config, level })} columns={5} />
      <div>
        <SectionLabel>Temas</SectionLabel>
        <button type="button" className="tm-seg tm-press mt-3 w-full px-4 py-3 text-sm" data-active={isAll ? 'true' : 'false'} onClick={() => toggleTopic('mixed')}>
          Todo (mixto)
        </button>
        <div className="mt-3 grid gap-4">
          {topicGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-bold" style={{ color: 'var(--tm-fg-muted)' }}>{group.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.topics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className="tm-seg tm-press px-3.5 py-2 text-sm"
                    data-active={!isAll && selected.includes(topic) ? 'true' : 'false'}
                    onClick={() => toggleTopic(topic)}
                  >
                    {practiceTopicLabels[topic]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Seg title="Modo" items={modeOptions} labels={modeLabels} selected={config.mode} onSelect={(mode) => onChange({ ...config, mode })} />
      <AmountSeg value={config.amount} onChange={(amount) => onChange({ ...config, amount })} />
    </>
  );
}

const multiplicationTypes = ['mixed', 'oneByOne', 'oneByTwo', 'twoByTwo', 'chain', 'doubleInfinity'] as const;

function MultiplicationCustom({ config, onChange }: { config: MultiplicationConfig; onChange: (config: MultiplicationConfig) => void }) {
  return (
    <>
      <Seg title="Tipo" items={multiplicationTypes} labels={multiplicationTypeLabels} selected={config.multiplicationType} onSelect={(multiplicationType) => onChange({ ...config, multiplicationType })} columns={2} />
      {config.multiplicationType === 'chain' && (
        <Seg
          title="Factores encadenados"
          items={['2', '3', '4'] as const}
          labels={{ '2': '2 factores', '3': '3 factores', '4': '4 factores' }}
          selected={String(config.chainFactorCount ?? 3) as '2' | '3' | '4'}
          onSelect={(count) => onChange({ ...config, chainFactorCount: Number(count) as 2 | 3 | 4 })}
        />
      )}
      <Seg title="Nivel" items={levelOptions} labels={levelLabels} selected={config.level} onSelect={(level) => onChange({ ...config, level })} columns={5} />
      <Seg title="Modo" items={modeOptions} labels={modeLabels} selected={config.mode} onSelect={(mode) => onChange({ ...config, mode })} />
      <AmountSeg value={config.amount} onChange={(amount) => onChange({ ...config, amount })} />
    </>
  );
}

function AnzanCustom({ config, onChange }: { config: AnzanConfig; onChange: (config: AnzanConfig) => void }) {
  const setCustom = (partial: Partial<AnzanConfig>) => onChange({ ...config, ...partial, preset: 'custom' });
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="Dígitos" value={config.digits} min={1} max={5} suffix="díg" onChange={(digits) => setCustom({ digits })} />
        <NumberField label="Números" value={config.terms} min={3} max={50} suffix="núm" onChange={(terms) => setCustom({ terms })} />
        <NumberField label="Aparición" value={config.displayMs} min={150} max={3000} step={50} suffix="ms" onChange={(displayMs) => setCustom({ displayMs })} />
      </div>
      <Seg
        title="Secuencia"
        items={['addition', 'additionSubtraction'] as const}
        labels={{ addition: 'Solo sumas', additionSubtraction: 'Sumas y restas' }}
        selected={config.operationMode}
        onSelect={(operationMode) => setCustom({ operationMode })}
        columns={2}
      />
      <Seg
        title="Control"
        items={['timed', 'manual'] as const}
        labels={{ timed: 'Automático', manual: 'Con flechas' }}
        selected={config.advanceMode}
        onSelect={(advanceMode) => setCustom({ advanceMode })}
        columns={2}
      />
      <Seg
        title="Progresión entre rondas"
        items={['speed', 'none'] as const}
        labels={{ speed: 'Acelera al acertar', none: 'Ritmo fijo' }}
        selected={config.progression ?? 'speed'}
        onSelect={(progression) => onChange({ ...config, progression })}
        columns={2}
      />
    </>
  );
}

const cepreBlocks = ['mixed', 'numbers', 'algebra'] as const;
const cepreModes = ['diagnostic', 'practice', 'simulation', 'errorReview'] as const;

function CepreCustom({ config, onChange }: { config: CepreConfig; onChange: (config: CepreConfig) => void }) {
  return (
    <>
      <Seg title="Bloque" items={cepreBlocks} labels={cepreBlockLabels} selected={config.block} onSelect={(block) => onChange({ ...config, block })} />
      <Seg title="Nivel" items={levelOptions} labels={levelLabels} selected={config.level} onSelect={(level) => onChange({ ...config, level })} columns={5} />
      <Seg title="Modo" items={cepreModes} labels={cepreModeLabels} selected={config.mode} onSelect={(mode) => onChange({ ...config, mode })} columns={2} />
      <AmountSeg value={config.amount} onChange={(amount) => onChange({ ...config, amount })} />
    </>
  );
}

function BlitzCustom({ config, onChange }: { config: BlitzConfig; onChange: (config: BlitzConfig) => void }) {
  const selected = config.topics ?? ['mixed'];
  const isAll = selected.includes('mixed');
  const toggleTopic = (topic: PracticeTopic) => {
    if (topic === 'mixed') {
      onChange({ ...config, topics: ['mixed'], category: 'mixed' });
      return;
    }
    const base = selected.filter((item) => item !== 'mixed');
    const next = base.includes(topic) ? base.filter((item) => item !== topic) : [...base, topic];
    const category: BlitzConfig['category'] = next.find(
      (item): item is Exclude<BlitzConfig['category'], 'mixed'> => item in categoryLabels,
    ) ?? 'mixed';
    onChange({ ...config, topics: next.length ? next : ['mixed'], category: next.length ? category : 'mixed' });
  };
  return (
    <>
      <Seg title="Nivel" items={levelOptions} labels={levelLabels} selected={config.level} onSelect={(level) => onChange({ ...config, level })} columns={5} />
      <div>
        <SectionLabel>Temas</SectionLabel>
        <button type="button" className="tm-seg tm-press mt-3 w-full px-4 py-3 text-sm" data-active={isAll ? 'true' : 'false'} onClick={() => toggleTopic('mixed')}>
          Todo (mixto)
        </button>
        <div className="mt-3 grid gap-4">
          {topicGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-bold" style={{ color: 'var(--tm-fg-muted)' }}>{group.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.topics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className="tm-seg tm-press px-3.5 py-2 text-sm"
                    data-active={!isAll && selected.includes(topic) ? 'true' : 'false'}
                    onClick={() => toggleTopic(topic)}
                  >
                    {practiceTopicLabels[topic]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function X2Setup({ config, onChange }: { config: DoubleX2Config; onChange: (config: DoubleX2Config) => void }) {
  const stepLimits: DoubleX2StepLimit[] = [10, 20, 30, 'infinite'];
  return (
    <div className="mt-8 grid gap-6">
      <NumberField label="Número inicial" value={config.start} min={1} max={999999} suffix="inicio" onChange={(start) => onChange({ ...config, start })} />
      <div>
        <SectionLabel>Límite de pasos</SectionLabel>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {stepLimits.map((limit) => (
            <button
              key={String(limit)}
              type="button"
              className="tm-seg tm-press min-h-11 px-3 py-2.5 text-sm"
              data-active={config.stepLimit === limit ? 'true' : 'false'}
              onClick={() => onChange({ ...config, stepLimit: limit })}
            >
              {limit === 'infinite' ? 'Infinito' : `${limit}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlashCardsSetupPanel({ config, onChange }: { config: FlashCardsSetup; onChange: (config: FlashCardsSetup) => void }) {
  const stats = useMemo(() => Object.fromEntries(flashDeckMetas.map((meta) => [meta.id, getDeckStats(meta.id)])), []);
  const toggleDeck = (deckId: FlashDeckId) => {
    const next = config.decks.includes(deckId) ? config.decks.filter((item) => item !== deckId) : [...config.decks, deckId];
    onChange({ ...config, decks: next.length ? next : [deckId] });
  };
  return (
    <div className="mt-8 grid gap-6">
      <div>
        <SectionLabel>Mazos</SectionLabel>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {flashDeckMetas.map((meta) => {
            const deckStats = stats[meta.id];
            const active = config.decks.includes(meta.id);
            return (
              <button key={meta.id} type="button" className="tm-seg tm-press px-4 py-3.5 text-left" data-active={active ? 'true' : 'false'} onClick={() => toggleDeck(meta.id)}>
                <span className="tm-display block text-sm font-bold">{meta.title}</span>
                <span className="mt-0.5 block text-xs font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>{meta.description}</span>
                <span className="mt-2 block text-[11px] font-bold" style={{ color: active ? 'var(--tm-blue)' : 'var(--tm-fg-muted)' }}>
                  {deckStats.mastered}/{deckStats.total} dominadas · {deckStats.fresh} nuevas
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <SectionLabel>Tarjetas por sesión</SectionLabel>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[10, 15, 25].map((amount) => (
            <button key={amount} type="button" className="tm-seg tm-press min-h-11 px-3 py-2.5 text-sm" data-active={config.amount === amount ? 'true' : 'false'} onClick={() => onChange({ ...config, amount })}>
              {amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
