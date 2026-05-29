import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crosshair,
  Flame,
  Gauge,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  Trash2,
  XCircle,
} from 'lucide-react';
import { generateExercises, generateFlashAnzanExercise } from './lib/exerciseGenerator';
import { calculateAnzanMetrics, calculateMetrics, formatDuration } from './lib/scoring';
import { clearSessions, loadSessions, saveSession } from './lib/storage';
import { AICoreBackground } from './components/visuals/AICoreBackground';
import type {
  AnzanAdvanceMode,
  AnzanConfig,
  AnzanPreset,
  AnzanExercise,
  AnzanOperationMode,
  AnswerChoice,
  Category,
  ChoiceKey,
  DrillKind,
  Exercise,
  Level,
  TrainingConfig,
  TrainingMode,
  TrainingSession,
  UserAnswer,
} from './types';
import {
  anzanAdvanceLabels,
  anzanOperationLabels,
  anzanPresetLabels,
  categoryLabels,
  drillLabels,
  levelLabels,
  modeLabels,
} from './types';

type Screen = 'setup' | 'training' | 'results';

const defaultConfig: TrainingConfig = {
  level: 'level1',
  category: 'mixed',
  amount: 10,
  mode: 'mixed',
  instantFeedback: true,
};

const defaultAnzanConfig: AnzanConfig = {
  digits: 2,
  terms: 8,
  displayMs: 750,
  operationMode: 'addition',
  advanceMode: 'timed',
  instantFeedback: true,
  preset: 'medium',
};

const categoryOptions: Category[] = [
  'mixed',
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'fractions',
  'powers',
  'roots',
  'algebra',
  'combined',
  'percentages',
  'series',
  'reasoning',
];

const levelOptions: Level[] = ['level1', 'level2', 'level3', 'level4', 'level5'];
const modeOptions: TrainingMode[] = ['mixed', 'speed', 'accuracy'];
const drillOptions: DrillKind[] = ['operations', 'flashAnzan'];
const anzanOperationOptions: AnzanOperationMode[] = ['addition', 'additionSubtraction'];
const anzanAdvanceOptions: AnzanAdvanceMode[] = ['timed', 'manual'];
const anzanPresetOptions: Array<Exclude<AnzanPreset, 'custom'>> = ['easy', 'medium', 'hard', 'expert'];
const amountOptions = [10, 20, 30, 50, 100];
const choiceKeys: ChoiceKey[] = ['A', 'B', 'C', 'D'];

const anzanPresets: Record<Exclude<AnzanPreset, 'custom'>, Pick<AnzanConfig, 'digits' | 'terms' | 'displayMs' | 'operationMode' | 'advanceMode'>> = {
  easy: { digits: 1, terms: 5, displayMs: 1000, operationMode: 'addition', advanceMode: 'timed' },
  medium: { digits: 2, terms: 8, displayMs: 750, operationMode: 'addition', advanceMode: 'timed' },
  hard: { digits: 3, terms: 10, displayMs: 500, operationMode: 'additionSubtraction', advanceMode: 'timed' },
  expert: { digits: 4, terms: 15, displayMs: 350, operationMode: 'additionSubtraction', advanceMode: 'timed' },
};

function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [activeDrill, setActiveDrill] = useState<DrillKind>('operations');
  const [config, setConfig] = useState<TrainingConfig>(defaultConfig);
  const [anzanConfig, setAnzanConfig] = useState<AnzanConfig>(defaultAnzanConfig);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [anzanExercise, setAnzanExercise] = useState<AnzanExercise | null>(null);
  const [anzanIndex, setAnzanIndex] = useState(0);
  const [anzanPhase, setAnzanPhase] = useState<'sequence' | 'answer'>('sequence');
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedKey, setSelectedKey] = useState<ChoiceKey | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);
  const [answerStartedAt, setAnswerStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [questionElapsedMs, setQuestionElapsedMs] = useState(0);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  useEffect(() => {
    if (screen !== 'training' || !startedAt || finishedAt) return;

    const interval = window.setInterval(() => {
      const now = Date.now();
      setElapsedMs(now - startedAt);
      if (activeDrill === 'operations' && questionStartedAt) {
        setQuestionElapsedMs(now - questionStartedAt);
      }
      if (activeDrill === 'flashAnzan' && answerStartedAt && anzanPhase === 'answer') {
        setQuestionElapsedMs(now - answerStartedAt);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [activeDrill, answerStartedAt, anzanPhase, finishedAt, questionStartedAt, screen, startedAt]);

  const currentExercise = exercises[currentIndex];
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const latestSession = sessions[0];

  const bestComparable = useMemo(() => {
    return sessions
      .filter(
        (session) =>
          (session.kind ?? 'operations') === 'operations' &&
          'category' in session.config &&
          session.config.category === config.category &&
          session.config.level === config.level &&
          session.config.amount === config.amount,
      )
      .sort((a, b) => b.metrics.speedScore - a.metrics.speedScore)[0];
  }, [config.amount, config.category, config.level, sessions]);

  const startTraining = useCallback(() => {
    const nextExercises = generateExercises(config);
    const now = Date.now();
    setActiveDrill('operations');
    setExercises(nextExercises);
    setAnzanExercise(null);
    setAnswers([]);
    setCurrentIndex(0);
    setFeedback(null);
    setSelectedKey(null);
    setIsLocked(false);
    setFinishedAt(null);
    setElapsedMs(0);
    setQuestionElapsedMs(0);
    setStartedAt(now);
    setQuestionStartedAt(now);
    setScreen('training');
  }, [config]);

  const startAnzanTraining = useCallback(() => {
    const nextExercise = generateFlashAnzanExercise(anzanConfig);
    const now = Date.now();
    setActiveDrill('flashAnzan');
    setAnzanExercise(nextExercise);
    setAnzanIndex(0);
    setAnzanPhase('sequence');
    setExercises([]);
    setAnswers([]);
    setCurrentIndex(0);
    setFeedback(null);
    setSelectedKey(null);
    setIsLocked(false);
    setFinishedAt(null);
    setElapsedMs(0);
    setQuestionElapsedMs(0);
    setStartedAt(now);
    setQuestionStartedAt(now);
    setAnswerStartedAt(null);
    setScreen('training');
  }, [anzanConfig]);

  const submitChoice = useCallback(
    (choice: AnswerChoice) => {
      if (!currentExercise || !startedAt || !questionStartedAt || isLocked) return;

      const now = Date.now();
      const responseTimeMs = now - questionStartedAt;
      const nextAnswer: UserAnswer = {
        exerciseId: currentExercise.id,
        category: currentExercise.category,
        prompt: currentExercise.prompt,
        input: `${choice.key}: ${choice.label}`,
        correctAnswer: currentExercise.answerLabel,
        isCorrect: choice.isCorrect,
        answeredAtMs: now - startedAt,
        responseTimeMs,
      };
      const nextAnswers = [...answers, nextAnswer];
      const isLast = currentIndex + 1 >= exercises.length;
      const transitionDelay = config.instantFeedback ? 520 : 160;

      setAnswers(nextAnswers);
      setSelectedKey(choice.key);
      setFeedback(choice.isCorrect ? 'correct' : 'incorrect');
      setIsLocked(true);
      setQuestionElapsedMs(responseTimeMs);

      if (isLast) {
        const total = now - startedAt;
        const metrics = calculateMetrics(nextAnswers, total, config);
        const session: TrainingSession = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        kind: 'operations',
        config,
        metrics,
        answers: nextAnswers,
      };

        setFinishedAt(now);
        setElapsedMs(total);
        setSessions(saveSession(session));
        window.setTimeout(() => setScreen('results'), transitionDelay);
        return;
      }

      window.setTimeout(() => {
        const nextStart = Date.now();
        setCurrentIndex((value) => value + 1);
        setSelectedKey(null);
        setFeedback(null);
        setIsLocked(false);
        setQuestionStartedAt(nextStart);
        setQuestionElapsedMs(0);
      }, transitionDelay);
    },
    [answers, config, currentExercise, currentIndex, exercises.length, isLocked, questionStartedAt, startedAt],
  );

  const moveAnzan = useCallback(
    (direction: 1 | -1) => {
      if (!anzanExercise || anzanPhase !== 'sequence' || anzanConfig.advanceMode !== 'manual') return;

      setAnzanIndex((value) => {
        const next = value + direction;
        if (next < 0) return 0;
        if (next >= anzanExercise.terms.length) {
          setAnzanPhase('answer');
          setAnswerStartedAt(Date.now());
          setQuestionElapsedMs(0);
          return value;
        }
        return next;
      });
    },
    [anzanConfig.advanceMode, anzanExercise, anzanPhase],
  );

  const openAnzanAnswer = useCallback(() => {
    if (!anzanExercise || anzanPhase !== 'sequence') return;
    setAnzanPhase('answer');
    setAnswerStartedAt(Date.now());
    setQuestionElapsedMs(0);
  }, [anzanExercise, anzanPhase]);

  const submitAnzanChoice = useCallback(
    (choice: AnswerChoice) => {
      if (!anzanExercise || !startedAt || !answerStartedAt || isLocked) return;

      const now = Date.now();
      const nextAnswer: UserAnswer = {
        exerciseId: anzanExercise.id,
        category: anzanConfig.operationMode === 'additionSubtraction' ? 'subtraction' : 'addition',
        prompt: anzanExercise.prompt,
        input: `${choice.key}: ${choice.label}`,
        correctAnswer: anzanExercise.answerLabel,
        isCorrect: choice.isCorrect,
        answeredAtMs: now - startedAt,
        responseTimeMs: now - answerStartedAt,
      };
      const metrics = calculateAnzanMetrics(nextAnswer, now - startedAt, anzanConfig);
      const session: TrainingSession = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        kind: 'flashAnzan',
        config: anzanConfig,
        metrics,
        answers: [nextAnswer],
      };

      setAnswers([nextAnswer]);
      setSelectedKey(choice.key);
      setFeedback(choice.isCorrect ? 'correct' : 'incorrect');
      setIsLocked(true);
      setFinishedAt(now);
      setElapsedMs(now - startedAt);
      setQuestionElapsedMs(now - answerStartedAt);
      setSessions(saveSession(session));
      window.setTimeout(() => setScreen('results'), anzanConfig.instantFeedback ? 780 : 220);
    },
    [answerStartedAt, anzanConfig, anzanExercise, isLocked, startedAt],
  );

  useEffect(() => {
    if (
      screen !== 'training' ||
      activeDrill !== 'flashAnzan' ||
      !anzanExercise ||
      anzanPhase !== 'sequence' ||
      anzanConfig.advanceMode !== 'timed'
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setAnzanIndex((value) => {
        const next = value + 1;
        if (next >= anzanExercise.terms.length) {
          setAnzanPhase('answer');
          setAnswerStartedAt(Date.now());
          setQuestionElapsedMs(0);
          return value;
        }
        return next;
      });
    }, anzanConfig.displayMs);

    return () => window.clearTimeout(timeout);
  }, [activeDrill, anzanConfig.advanceMode, anzanConfig.displayMs, anzanExercise, anzanIndex, anzanPhase, screen]);

  useEffect(() => {
    if (screen !== 'training' || isLocked) return;

    const handleKey = (event: KeyboardEvent) => {
      if (activeDrill === 'flashAnzan' && anzanPhase === 'sequence' && anzanConfig.advanceMode === 'manual') {
        if (event.key === 'ArrowRight') moveAnzan(1);
        if (event.key === 'ArrowLeft') moveAnzan(-1);
        return;
      }

      const key = event.key.toUpperCase() as ChoiceKey;
      if (!choiceKeys.includes(key)) return;

      if (activeDrill === 'operations' && currentExercise) {
        const choice = currentExercise.choices.find((item) => item.key === key);
        if (choice) submitChoice(choice);
      }

      if (activeDrill === 'flashAnzan' && anzanExercise && anzanPhase === 'answer') {
        const choice = anzanExercise.choices.find((item) => item.key === key);
        if (choice) submitAnzanChoice(choice);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    activeDrill,
    anzanConfig.advanceMode,
    anzanExercise,
    anzanPhase,
    currentExercise,
    isLocked,
    moveAnzan,
    screen,
    submitAnzanChoice,
    submitChoice,
  ]);

  const resetToSetup = () => {
    setScreen('setup');
    setFeedback(null);
    setSelectedKey(null);
    setIsLocked(false);
    setAnzanPhase('sequence');
    setAnzanIndex(0);
  };

  return (
    <main className="min-h-screen bg-[#F4F7FF] text-[#0A244C]">
      <nav className="border-b border-white/10 bg-[#040F20] text-[#FDFDFD]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#2165FF] shadow-[0_0_28px_rgba(33,101,255,0.45)]">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#4D84FF]">TrainerMath V1</p>
              <p className="font-display text-lg font-black tracking-tight">Alejandro Palpan</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#7A8AA0] sm:flex">
            <ShieldCheck size={16} />
            Mental speed system
          </div>
        </div>
      </nav>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {screen === 'setup' && (
          <>
            <Hero sessions={sessions} latestSession={latestSession} onStart={startTraining} />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <section className="grid gap-4">
                <DrillSwitcher activeDrill={activeDrill} onChange={setActiveDrill} />
                <SuggestedRoutes
                  onOperations={(nextConfig) => {
                    setActiveDrill('operations');
                    setConfig({ ...config, ...nextConfig });
                  }}
                  onAnzan={(nextConfig) => {
                    setActiveDrill('flashAnzan');
                    setAnzanConfig({ ...anzanConfig, ...nextConfig });
                  }}
                />
                {activeDrill === 'operations' ? (
                  <TrainingSetup
                    config={config}
                    onChange={setConfig}
                    onStart={startTraining}
                    bestComparable={bestComparable}
                  />
                ) : (
                  <AnzanSetup
                    config={anzanConfig}
                    onChange={setAnzanConfig}
                    onStart={startAnzanTraining}
                  />
                )}
              </section>
              <SessionHistory
                sessions={sessions}
                onClear={() => {
                  clearSessions();
                  setSessions([]);
                }}
              />
            </div>
          </>
        )}

        {screen === 'training' && currentExercise && (
          <TrainingScreen
            config={config}
            exercise={currentExercise}
            currentIndex={currentIndex}
            total={exercises.length}
            feedback={feedback}
            selectedKey={selectedKey}
            isLocked={isLocked}
            elapsedMs={elapsedMs}
            questionElapsedMs={questionElapsedMs}
            correctCount={correctCount}
            incorrectCount={answers.length - correctCount}
            onSelect={submitChoice}
            onCancel={resetToSetup}
          />
        )}

        {screen === 'training' && activeDrill === 'flashAnzan' && anzanExercise && (
          <FlashAnzanScreen
            config={anzanConfig}
            exercise={anzanExercise}
            index={anzanIndex}
            phase={anzanPhase}
            feedback={feedback}
            selectedKey={selectedKey}
            isLocked={isLocked}
            elapsedMs={elapsedMs}
            answerElapsedMs={questionElapsedMs}
            onSelect={submitAnzanChoice}
            onMove={moveAnzan}
            onAnswer={openAnzanAnswer}
            onCancel={resetToSetup}
          />
        )}

        {screen === 'results' && latestSession && (
          <ResultsScreen
            session={latestSession}
            onRepeat={(latestSession.kind ?? 'operations') === 'flashAnzan' ? startAnzanTraining : startTraining}
            onSetup={resetToSetup}
          />
        )}
      </div>
    </main>
  );
}

function Hero({
  sessions,
  latestSession,
  onStart,
}: {
  sessions: TrainingSession[];
  latestSession?: TrainingSession;
  onStart: () => void;
}) {
  const bestElo = sessions.length ? Math.max(...sessions.map((item) => getMetricElo(item.metrics))) : 0;

  return (
    <section className="relative overflow-hidden rounded-lg border border-[#18C8FF]/20 bg-[#050711] text-white shadow-[0_24px_90px_rgba(4,15,32,0.28)]">
      <AICoreBackground variant="hero" intensity="high" interactive={false} />
      <div className="absolute inset-0 technical-grid opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050711] via-[#050711]/88 to-[#050711]/26" />
      <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:p-10">
        <div className="flex flex-col justify-between gap-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-[#2165FF]/35 bg-[#2165FF]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">
              <Sparkles size={15} />
              AI mental core
            </div>
            <h1 className="font-display max-w-3xl text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl">
              TrainerMath V1.2
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#C7D3E6]">
              Entrenamiento de cálculo mental con núcleo visual IA, alternativas A/B/C/D, cronómetro por pregunta y diagnóstico final de precisión, ritmo y foco de mejora.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(33,101,255,0.35)] transition hover:bg-[#4D84FF]"
              onClick={onStart}
            >
              <Play size={18} />
              Iniciar entrenamiento
            </button>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:border-[#4D84FF] hover:text-[#8DB1FF]"
              href="#config"
            >
              Configurar reto
              <ChevronRight size={18} />
            </a>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">Panel de valor</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MetricPill label="Sesiones" value={sessions.length.toString()} />
              <MetricPill label="Mejor ELO" value={bestElo.toString()} />
              <MetricPill label="Última" value={latestSession ? `${latestSession.metrics.accuracy}%` : '--'} />
            </div>
          </div>
          <div className="rounded-lg border border-[#18C8FF]/20 bg-[#050711]/55 p-4 backdrop-blur">
            <p className="text-sm font-black text-white">Núcleo visual WebGL</p>
            <p className="mt-2 text-sm leading-6 text-[#C7D3E6]">
              Esfera neuronal reutilizable para heroes, dashboards IA y demos premium sin competir con la acción principal.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DrillSwitcher({
  activeDrill,
  onChange,
}: {
  activeDrill: DrillKind;
  onChange: (drill: DrillKind) => void;
}) {
  return (
    <div className="rounded-lg border border-[#DCE5F2] bg-white p-2 shadow-soft">
      <div className="grid gap-2 sm:grid-cols-2">
        {drillOptions.map((drill) => (
          <button
            key={drill}
            className={`flex min-h-20 items-center gap-4 rounded-lg border px-4 py-3 text-left transition ${
              activeDrill === drill
                ? 'border-[#2165FF] bg-[#040F20] text-white shadow-[0_16px_36px_rgba(4,15,32,0.18)]'
                : 'border-[#DCE5F2] bg-[#F4F7FF] text-[#0A244C] hover:border-[#4D84FF]'
            }`}
            onClick={() => onChange(drill)}
          >
            <span className={`grid h-11 w-11 place-items-center rounded-md ${activeDrill === drill ? 'bg-[#2165FF]' : 'bg-white'}`}>
              {drill === 'operations' ? <Target size={20} /> : <Brain size={20} />}
            </span>
            <span>
              <span className="block font-display text-lg font-black">{drillLabels[drill]}</span>
              <span className={`text-xs font-bold ${activeDrill === drill ? 'text-[#C7D3E6]' : 'text-[#7A8AA0]'}`}>
                {drill === 'operations' ? 'Cálculo base con A/B/C/D' : 'Memoria visual para sumas y restas'}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SuggestedRoutes({
  onOperations,
  onAnzan,
}: {
  onOperations: (config: Partial<TrainingConfig>) => void;
  onAnzan: (config: Partial<AnzanConfig>) => void;
}) {
  const routes = [
    {
      title: 'Sprint rápido',
      copy: '10 preguntas mixtas para activar velocidad.',
      icon: <Gauge size={18} />,
      onClick: () => onOperations({ level: 'level2', category: 'mixed', amount: 10, mode: 'speed' }),
    },
    {
      title: 'Precisión',
      copy: '20 preguntas con foco en exactitud.',
      icon: <Crosshair size={18} />,
      onClick: () => onOperations({ level: 'level2', category: 'algebra', amount: 20, mode: 'accuracy' }),
    },
    {
      title: 'Resistencia 100',
      copy: '100 preguntas para medir fatiga y estabilidad.',
      icon: <Flame size={18} />,
      onClick: () => onOperations({ level: 'level3', category: 'mixed', amount: 100, mode: 'mixed' }),
    },
    {
      title: 'Flash Anzan',
      copy: 'Memoria visual con aparición automática.',
      icon: <Brain size={18} />,
      onClick: () => onAnzan({ ...anzanPresets.medium, preset: 'medium' }),
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {routes.map((route) => (
        <button
          key={route.title}
          className="group rounded-lg border border-[#DCE5F2] bg-white p-4 text-left shadow-soft transition hover:border-[#2165FF] hover:-translate-y-0.5"
          onClick={route.onClick}
        >
          <span className="mb-3 inline-flex rounded-md bg-[#F4F7FF] p-2 text-[#2165FF] transition group-hover:bg-[#2165FF] group-hover:text-white">
            {route.icon}
          </span>
          <span className="block font-display text-base font-black text-[#0A244C]">{route.title}</span>
          <span className="mt-1 block text-xs font-semibold leading-5 text-[#7A8AA0]">{route.copy}</span>
        </button>
      ))}
    </div>
  );
}

interface TrainingSetupProps {
  config: TrainingConfig;
  onChange: (config: TrainingConfig) => void;
  onStart: () => void;
  bestComparable?: TrainingSession;
}

interface AnzanSetupProps {
  config: AnzanConfig;
  onChange: (config: AnzanConfig) => void;
  onStart: () => void;
}

function AnzanSetup({ config, onChange, onStart }: AnzanSetupProps) {
  const setPartial = (partial: Partial<AnzanConfig>) => onChange({ ...config, ...partial });
  const applyPreset = (preset: Exclude<AnzanPreset, 'custom'>) => {
    onChange({ ...config, ...anzanPresets[preset], preset });
  };

  return (
    <section id="config" className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-7">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Flash Anzan Lab</p>
          <h2 className="font-display mt-2 text-2xl font-black tracking-tight text-[#0A244C]">Entrena memoria de suma rápida</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#7A8AA0]">
            Visualiza números uno por uno, retén el acumulado y responde al final con A/B/C/D.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(33,101,255,0.24)] transition hover:bg-[#4D84FF]"
          onClick={onStart}
        >
          <Play size={18} />
          Iniciar Anzan
        </button>
      </div>

      <div className="grid gap-6">
        <div>
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">
            Presets rápidos
          </h3>
          <div className="grid gap-2 sm:grid-cols-4">
            {anzanPresetOptions.map((preset) => (
              <button
                key={preset}
                className={`rounded-lg border p-4 text-left transition ${
                  config.preset === preset
                    ? 'border-[#2165FF] bg-[#040F20] text-white shadow-[0_14px_28px_rgba(4,15,32,0.2)]'
                    : 'border-[#DCE5F2] bg-[#F4F7FF] text-[#0A244C] hover:border-[#4D84FF]'
                }`}
                onClick={() => applyPreset(preset)}
              >
                <span className="block font-display text-base font-black">{anzanPresetLabels[preset]}</span>
                <span className={`mt-1 block text-xs font-bold ${config.preset === preset ? 'text-[#C7D3E6]' : 'text-[#7A8AA0]'}`}>
                  {anzanPresets[preset].digits} dig. · {anzanPresets[preset].terms} nums · {anzanPresets[preset].displayMs} ms
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <NumberConfig
            label="Dígitos"
            value={config.digits}
            min={1}
            max={5}
            suffix="dig."
            onChange={(digits) => setPartial({ digits, preset: 'custom' })}
          />
          <NumberConfig
            label="Cantidad"
            value={config.terms}
            min={3}
            max={50}
            suffix="números"
            onChange={(terms) => setPartial({ terms, preset: 'custom' })}
          />
          <NumberConfig
            label="Aparición"
            value={config.displayMs}
            min={150}
            max={3000}
            step={50}
            suffix="ms"
            onChange={(displayMs) => setPartial({ displayMs, preset: 'custom' })}
          />
        </div>

        <Selector
          title="Tipo de secuencia"
          items={anzanOperationOptions}
          labels={anzanOperationLabels}
          selected={config.operationMode}
          onSelect={(operationMode) => setPartial({ operationMode, preset: 'custom' })}
        />

        <Selector
          title="Control de aparición"
          items={anzanAdvanceOptions}
          labels={anzanAdvanceLabels}
          selected={config.advanceMode}
          onSelect={(advanceMode) => setPartial({ advanceMode, preset: 'custom' })}
        />

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] px-4 py-3">
          <span>
            <span className="block text-sm font-black text-[#0A244C]">Animación y feedback</span>
            <span className="text-xs font-medium text-[#7A8AA0]">Celebra aciertos y marca errores con explicación.</span>
          </span>
          <input
            className="h-5 w-5 accent-[#2165FF]"
            type="checkbox"
            checked={config.instantFeedback}
            onChange={(event) => setPartial({ instantFeedback: event.target.checked })}
          />
        </label>

        <div className="rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-4">
          <p className="text-sm font-black text-[#0A244C]">Reto configurado</p>
          <p className="mt-1 text-sm leading-6 text-[#7A8AA0]">
            {config.terms} números de {config.digits} dígito(s), {anzanOperationLabels[config.operationMode].toLowerCase()}, modo {anzanAdvanceLabels[config.advanceMode].toLowerCase()}.
          </p>
        </div>
      </div>
    </section>
  );
}

function NumberConfig({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-4">
      <span className="text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">{label}</span>
      <div className="mt-3 flex items-center gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-[#DCE5F2] bg-white px-3 py-3 text-lg font-black text-[#0A244C] outline-none focus:border-[#4D84FF] focus:ring-4 focus:ring-[#4D84FF]/15"
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))}
        />
        <span className="text-xs font-black text-[#7A8AA0]">{suffix}</span>
      </div>
    </label>
  );
}

function TrainingSetup({ config, onChange, onStart, bestComparable }: TrainingSetupProps) {
  const setPartial = (partial: Partial<TrainingConfig>) => onChange({ ...config, ...partial });

  return (
    <section id="config" className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-7">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Mission control</p>
          <h2 className="font-display mt-2 text-2xl font-black tracking-tight text-[#0A244C]">Configura tu sprint</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#7A8AA0]">
            Define el foco del entrenamiento y mide iteraciones comparables.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(33,101,255,0.24)] transition hover:bg-[#4D84FF] focus:outline-none focus:ring-4 focus:ring-[#4D84FF]/20"
          onClick={onStart}
        >
          <Play size={18} />
          Iniciar
        </button>
      </div>

      <div className="grid gap-6">
        <Selector
          title="Nivel"
          items={levelOptions}
          labels={levelLabels}
          selected={config.level}
          onSelect={(level) => setPartial({ level })}
        />

        <Selector
          title="Operaciones"
          items={categoryOptions}
          labels={categoryLabels}
          selected={config.category}
          onSelect={(category) => setPartial({ category })}
          grid
        />

        <Selector
          title="Modo"
          items={modeOptions}
          labels={modeLabels}
          selected={config.mode}
          onSelect={(mode) => setPartial({ mode })}
        />

        <div>
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">
            Cantidad de operaciones
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {amountOptions.map((amount) => (
              <button
                key={amount}
                className={`rounded-lg border px-4 py-3 text-sm font-black transition ${
                  config.amount === amount
                    ? 'border-[#2165FF] bg-[#2165FF] text-white'
                    : 'border-[#DCE5F2] bg-white text-[#0A244C] hover:border-[#4D84FF]'
                }`}
                onClick={() => setPartial({ amount })}
              >
                {amount}
              </button>
            ))}
            <input
              className="rounded-lg border border-[#DCE5F2] px-4 py-3 text-center text-sm font-black text-[#0A244C] outline-none focus:border-[#4D84FF] focus:ring-4 focus:ring-[#4D84FF]/15"
              min={5}
              max={100}
              type="number"
              value={amountOptions.includes(config.amount) ? '' : config.amount}
              placeholder="Otro"
              onChange={(event) =>
                setPartial({
                  amount: Math.min(100, Math.max(5, Number(event.target.value) || 10)),
                })
              }
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] px-4 py-3">
          <span>
            <span className="block text-sm font-black text-[#0A244C]">Feedback inmediato</span>
            <span className="text-xs font-medium text-[#7A8AA0]">Muestra si fallaste antes de pasar a la siguiente tarjeta.</span>
          </span>
          <input
            className="h-5 w-5 accent-[#2165FF]"
            type="checkbox"
            checked={config.instantFeedback}
            onChange={(event) => setPartial({ instantFeedback: event.target.checked })}
          />
        </label>

        {bestComparable && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-black text-emerald-950">Referencia anterior</p>
            <p className="mt-1 text-sm text-emerald-800">
              Mejor puntaje comparable: {bestComparable.metrics.speedScore} con {bestComparable.metrics.accuracy}% de precisión y {formatDuration(bestComparable.metrics.averageTimeMs)} por operación.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

interface SelectorProps<T extends string> {
  title: string;
  items: T[];
  labels: Record<T, string>;
  selected: T;
  onSelect: (item: T) => void;
  grid?: boolean;
}

function Selector<T extends string>({ title, items, labels, selected, onSelect, grid }: SelectorProps<T>) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">{title}</h3>
      <div className={`grid gap-2 ${grid ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {items.map((item) => (
          <button
            key={item}
            className={`min-h-12 rounded-lg border px-3 py-3 text-sm font-black transition ${
              selected === item
                ? 'border-[#2165FF] bg-[#2165FF] text-white shadow-[0_10px_22px_rgba(33,101,255,0.2)]'
                : 'border-[#DCE5F2] bg-white text-[#0A244C] hover:border-[#4D84FF] hover:bg-[#F4F7FF]'
            }`}
            onClick={() => onSelect(item)}
          >
            {labels[item]}
          </button>
        ))}
      </div>
    </div>
  );
}

interface TrainingScreenProps {
  config: TrainingConfig;
  exercise: Exercise;
  currentIndex: number;
  total: number;
  feedback: 'correct' | 'incorrect' | null;
  selectedKey: ChoiceKey | null;
  isLocked: boolean;
  elapsedMs: number;
  questionElapsedMs: number;
  correctCount: number;
  incorrectCount: number;
  onSelect: (choice: AnswerChoice) => void;
  onCancel: () => void;
}

function TrainingScreen({
  config,
  exercise,
  currentIndex,
  total,
  feedback,
  selectedKey,
  isLocked,
  elapsedMs,
  questionElapsedMs,
  correctCount,
  incorrectCount,
  onSelect,
  onCancel,
}: TrainingScreenProps) {
  const progress = ((currentIndex + 1) / total) * 100;

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-[#0A244C] bg-[#040F20] p-4 text-white shadow-[0_18px_46px_rgba(4,15,32,0.18)]">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">
              {categoryLabels[exercise.category]} · {levelLabels[config.level]}
            </p>
            <h2 className="font-display mt-1 text-2xl font-black tracking-tight">
              Operación {currentIndex + 1} / {total}
            </h2>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-black text-white transition hover:border-rose-300 hover:text-rose-200"
            onClick={onCancel}
          >
            <RotateCcw size={17} />
            Salir
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <TrainingMetric icon={<Clock3 size={18} />} label="Tiempo total" value={formatDuration(elapsedMs)} />
          <TrainingMetric icon={<Gauge size={18} />} label="Esta pregunta" value={formatDuration(questionElapsedMs)} />
          <TrainingMetric icon={<Target size={18} />} label="Aciertos" value={correctCount.toString()} tone="green" />
          <TrainingMetric icon={<XCircle size={18} />} label="Errores" value={incorrectCount.toString()} tone="rose" />
          <TrainingMetric icon={<BarChart3 size={18} />} label="Modo" value={modeLabels[config.mode]} />
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#2165FF] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div
        key={exercise.id}
        className={`trainer-card-slide rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-8 ${
          feedback === 'correct' ? 'success-pulse' : feedback === 'incorrect' ? 'wrong-shake' : ''
        }`}
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Tarjeta de cálculo</p>
          <div className="mx-auto mt-5 flex min-h-32 items-center justify-center text-balance font-display text-5xl font-black tracking-tight text-[#0A244C] sm:text-7xl">
            {exercise.prompt}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {exercise.choices.map((choice) => (
              <ChoiceButton
                key={choice.key}
                choice={choice}
                selectedKey={selectedKey}
                isLocked={isLocked}
                onSelect={onSelect}
              />
            ))}
          </div>

          {feedback && (
            <div
              className={`mx-auto mt-6 inline-flex max-w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-black ${
                feedback === 'correct'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {feedback === 'correct' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {feedback === 'correct' ? 'Correcto' : `Correcta: ${exercise.answerLabel} · ${exercise.explanation}`}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FlashAnzanScreen({
  config,
  exercise,
  index,
  phase,
  feedback,
  selectedKey,
  isLocked,
  elapsedMs,
  answerElapsedMs,
  onSelect,
  onMove,
  onAnswer,
  onCancel,
}: {
  config: AnzanConfig;
  exercise: AnzanExercise;
  index: number;
  phase: 'sequence' | 'answer';
  feedback: 'correct' | 'incorrect' | null;
  selectedKey: ChoiceKey | null;
  isLocked: boolean;
  elapsedMs: number;
  answerElapsedMs: number;
  onSelect: (choice: AnswerChoice) => void;
  onMove: (direction: 1 | -1) => void;
  onAnswer: () => void;
  onCancel: () => void;
}) {
  const currentTerm = exercise.terms[index];
  const progress = phase === 'answer' ? 100 : ((index + 1) / exercise.terms.length) * 100;

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-[#0A244C] bg-[#040F20] p-4 text-white shadow-[0_18px_46px_rgba(4,15,32,0.18)]">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">
              Flash Anzan · {anzanOperationLabels[config.operationMode]}
            </p>
            <h2 className="font-display mt-1 text-2xl font-black tracking-tight">
              {phase === 'sequence' ? `Número ${index + 1} / ${exercise.terms.length}` : 'Marca el resultado final'}
            </h2>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-black text-white transition hover:border-rose-300 hover:text-rose-200"
            onClick={onCancel}
          >
            <RotateCcw size={17} />
            Salir
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <TrainingMetric icon={<Clock3 size={18} />} label="Tiempo total" value={formatDuration(elapsedMs)} />
          <TrainingMetric icon={<Gauge size={18} />} label="Respuesta" value={phase === 'answer' ? formatDuration(answerElapsedMs) : '--'} />
          <TrainingMetric icon={<Brain size={18} />} label="Dígitos" value={config.digits.toString()} />
          <TrainingMetric icon={<BarChart3 size={18} />} label="Cantidad" value={config.terms.toString()} />
          <TrainingMetric icon={<Flame size={18} />} label="Modo" value={anzanAdvanceLabels[config.advanceMode]} />
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#2165FF] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={`trainer-card-slide rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-8 ${feedback === 'correct' ? 'success-pulse' : feedback === 'incorrect' ? 'wrong-shake' : ''}`}>
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">
            {phase === 'sequence' ? 'Retén el acumulado' : 'Resultado final'}
          </p>

          {phase === 'sequence' && currentTerm && (
            <>
              <div
                key={currentTerm.id}
                className={`flash-number mx-auto mt-7 grid min-h-56 max-w-2xl place-items-center rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] font-display text-7xl font-black tracking-tight sm:text-9xl ${
                  currentTerm.signedValue < 0 ? 'text-rose-600' : 'text-[#2165FF]'
                }`}
              >
                {currentTerm.label}
              </div>

              {config.advanceMode === 'manual' ? (
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#DCE5F2] px-5 py-3 text-sm font-black text-[#0A244C] transition hover:border-[#4D84FF]"
                    onClick={() => onMove(-1)}
                  >
                    <ArrowLeft size={18} />
                    Anterior
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-5 py-3 text-sm font-black text-white transition hover:bg-[#4D84FF]"
                    onClick={() => onMove(1)}
                  >
                    Siguiente
                    <ArrowRight size={18} />
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#040F20] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0A244C]"
                    onClick={onAnswer}
                  >
                    Responder
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : (
                <p className="mt-5 text-sm font-bold text-[#7A8AA0]">
                  Aparición automática cada {config.displayMs} ms
                </p>
              )}
            </>
          )}

          {phase === 'answer' && (
            <>
              <div className="mx-auto mt-6 rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-5">
                <p className="text-sm font-black text-[#0A244C]">¿Cuál fue el acumulado final?</p>
                <p className="mt-1 text-xs font-bold text-[#7A8AA0]">También puedes presionar A, B, C o D en el teclado.</p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {exercise.choices.map((choice) => (
                  <ChoiceButton
                    key={choice.key}
                    choice={choice}
                    selectedKey={selectedKey}
                    isLocked={isLocked}
                    onSelect={onSelect}
                  />
                ))}
              </div>

              {feedback && (
                <div
                  className={`mx-auto mt-6 inline-flex max-w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-black ${
                    feedback === 'correct'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {feedback === 'correct' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  {feedback === 'correct' ? 'Correcto. Memoria activa sólida.' : `Correcta: ${exercise.answerLabel} · ${exercise.explanation}`}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ChoiceButton({
  choice,
  selectedKey,
  isLocked,
  onSelect,
}: {
  choice: AnswerChoice;
  selectedKey: ChoiceKey | null;
  isLocked: boolean;
  onSelect: (choice: AnswerChoice) => void;
}) {
  const isSelected = selectedKey === choice.key;
  const revealCorrect = isLocked && choice.isCorrect;
  const revealWrong = isLocked && isSelected && !choice.isCorrect;

  return (
    <button
      className={`choice-card group flex min-h-24 items-center gap-4 rounded-lg border p-4 text-left transition ${
        revealCorrect
          ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
          : revealWrong
            ? 'border-rose-300 bg-rose-50 text-rose-800'
            : 'border-[#DCE5F2] bg-[#F4F7FF] text-[#0A244C] hover:border-[#2165FF] hover:bg-white hover:shadow-[0_12px_26px_rgba(33,101,255,0.12)]'
      }`}
      disabled={isLocked}
      onClick={() => onSelect(choice)}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#040F20] font-display text-xl font-black text-white transition group-hover:bg-[#2165FF]">
        {choice.key}
      </span>
      <span className="font-display text-2xl font-black tracking-tight sm:text-3xl">{choice.label}</span>
    </button>
  );
}

interface ResultsScreenProps {
  session: TrainingSession;
  onRepeat: () => void;
  onSetup: () => void;
}

function getSessionTitle(session: TrainingSession) {
  if (session.kind === 'flashAnzan') return 'Flash Anzan';
  if ('category' in session.config) return categoryLabels[session.config.category];
  return 'Operaciones';
}

function getSessionDetail(session: TrainingSession) {
  if (session.kind === 'flashAnzan' && 'digits' in session.config) {
    return `${session.config.terms} números · ${session.config.digits} dígito(s)`;
  }

  if ('amount' in session.config) {
    return `${levelLabels[session.config.level] ?? String(session.config.level)} · ${session.config.amount} operaciones`;
  }

  return 'Sesión';
}

function getMetricElo(metrics: TrainingSession['metrics']) {
  return metrics.elo ?? Math.round(900 + (metrics.speedScore ?? 0) * 5);
}

function ResultsScreen({ session, onRepeat, onSetup }: ResultsScreenProps) {
  const { metrics } = session;
  const focus = metrics.improvementFocus?.length
    ? metrics.improvementFocus
    : [metrics.recommendation ?? 'Repite el reto para crear una línea base comparable.'];
  const isAnzan = session.kind === 'flashAnzan';
  const title = getSessionTitle(session);
  const detail = getSessionDetail(session);
  const elo = getMetricElo(metrics);
  const levelTag = metrics.levelTag ?? 'Base inicial';

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="rounded-lg border border-[#0A244C] bg-[#040F20] p-6 text-white shadow-[0_24px_70px_rgba(4,15,32,0.22)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">Diagnóstico final</p>
        <h2 className="font-display mt-2 text-4xl font-black tracking-tight sm:text-6xl">
          {levelTag}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#C7D3E6]">
          {metrics.analysis ?? metrics.recommendation}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <ResultMetric icon={<Flame size={18} />} label="ELO" value={elo.toString()} />
          <ResultMetric icon={<BarChart3 size={18} />} label="Puntaje" value={(metrics.speedScore ?? 0).toString()} />
          <ResultMetric icon={<TimerReset size={18} />} label="Total" value={formatDuration(metrics.totalTimeMs)} />
          <ResultMetric icon={<Clock3 size={18} />} label={isAnzan ? 'Respuesta' : 'Promedio'} value={formatDuration(metrics.averageTimeMs)} />
          <ResultMetric icon={<CheckCircle2 size={18} />} label="Precisión" value={`${metrics.accuracy}%`} tone="green" />
          <ResultMetric icon={<XCircle size={18} />} label="Errores" value={metrics.incorrect.toString()} tone="rose" />
        </div>

        <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <p className="text-sm font-black text-white">Qué mejorar ahora</p>
          <ul className="mt-3 grid gap-2">
            {focus.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-[#C7D3E6]">
                <ChevronRight className="mt-1 shrink-0 text-[#4D84FF]" size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(33,101,255,0.35)] transition hover:bg-[#4D84FF]"
            onClick={onRepeat}
          >
            <Play size={18} />
            Repetir reto
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:border-[#4D84FF] hover:text-[#8DB1FF]"
            onClick={onSetup}
          >
            <RotateCcw size={18} />
            Cambiar entrenamiento
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Lectura operativa</p>
          <div className="mt-5 space-y-4">
            <ResultLine label="Entrenamiento" value={title} />
            <ResultLine label="Configuración" value={detail} />
            <ResultLine label="Estado" value={metrics.status ?? 'Sin datos'} />
            <ResultLine label="Racha ELO" value={`${metrics.streakImpact >= 0 ? '+' : ''}${metrics.streakImpact ?? 0}`} />
            <ResultLine label="Foco débil" value={metrics.weakestCategory ?? 'Sin datos'} />
            <ResultLine label="Mejor área" value={metrics.bestCategory ?? 'Sin datos'} />
            <ResultLine label="Tarjeta lenta" value={metrics.slowestPrompt ?? '--'} />
            <ResultLine label="Resistencia" value={metrics.enduranceInsight ?? '--'} />
          </div>
        </div>

        <QuestionReview answers={session.answers} />
      </div>
    </section>
  );
}

function QuestionReview({ answers }: { answers: UserAnswer[] }) {
  return (
    <div className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Tiempo por pregunta</p>
      <div className="mt-4 max-h-[430px] space-y-2 overflow-auto pr-1">
        {answers.map((answer, index) => (
          <div
            key={`${answer.exerciseId}-${index}`}
            className="grid grid-cols-[36px_minmax(0,1fr)_82px] items-center gap-3 rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-3"
          >
            <span className={`grid h-8 w-8 place-items-center rounded-md text-xs font-black text-white ${answer.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#0A244C]">{answer.prompt ?? 'Operación'}</p>
              <p className="truncate text-xs font-semibold text-[#7A8AA0]">
                Marcaste {answer.input}; correcta {answer.correctAnswer ?? '--'}
              </p>
            </div>
            <span className="text-right text-sm font-black text-[#0A244C]">
              {formatDuration(answer.responseTimeMs ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SessionHistoryProps {
  sessions: TrainingSession[];
  onClear: () => void;
}

function SessionHistory({ sessions, onClear }: SessionHistoryProps) {
  const top = sessions.slice(0, 8);

  return (
    <aside className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Evidencia</p>
          <h2 className="font-display mt-1 text-xl font-black tracking-tight text-[#0A244C]">Historial</h2>
        </div>
        {sessions.length > 0 && (
          <button
            className="rounded-lg border border-[#DCE5F2] p-2 text-[#7A8AA0] transition hover:border-rose-200 hover:text-rose-600"
            onClick={onClear}
            aria-label="Borrar historial"
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>

      {top.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#DCE5F2] bg-[#F4F7FF] p-6 text-sm leading-6 text-[#7A8AA0]">
          Aún no hay sesiones. Ejecuta un sprint de 10 operaciones para crear tu primera línea base.
        </div>
      ) : (
        <div className="space-y-3">
          {top.map((session) => (
            <div key={session.id} className="rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#0A244C]">
                    {getSessionTitle(session)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#7A8AA0]">
                    {new Intl.DateTimeFormat('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(session.createdAt))}
                  </p>
                </div>
                <span className="rounded-md bg-white px-3 py-1 text-sm font-black text-[#2165FF]">
                  {getMetricElo(session.metrics)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Precisión" value={`${session.metrics.accuracy}%`} />
                <MiniStat label="Tiempo" value={formatDuration(session.metrics.totalTimeMs)} />
                <MiniStat label="Prom." value={formatDuration(session.metrics.averageTimeMs)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function TrainingMetric({
  icon,
  label,
  value,
  tone = 'blue',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: 'blue' | 'green' | 'rose';
}) {
  const tones = {
    blue: 'text-[#8DB1FF]',
    green: 'text-emerald-300',
    rose: 'text-rose-300',
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <div className={`mb-2 inline-flex ${tones[tone]}`}>{icon}</div>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7A8AA0]">{label}</p>
      <p className="mt-1 break-words font-display text-2xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

function ResultMetric({
  icon,
  label,
  value,
  tone = 'blue',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: 'blue' | 'green' | 'rose';
}) {
  const tones = {
    blue: 'text-[#8DB1FF]',
    green: 'text-emerald-300',
    rose: 'text-rose-300',
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className={`mb-3 inline-flex ${tones[tone]}`}>{icon}</div>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7A8AA0]">{label}</p>
      <p className="mt-1 break-words font-display text-2xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.07] px-3 py-3 text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8DB1FF]">{label}</p>
      <p className="font-display text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-2 py-2">
      <p className="text-[11px] font-bold text-[#7A8AA0]">{label}</p>
      <p className="text-sm font-black text-[#0A244C]">{value}</p>
    </div>
  );
}

function ResultLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#DCE5F2] pb-3">
      <span className="text-sm text-[#7A8AA0]">{label}</span>
      <span className="max-w-[190px] truncate text-right text-sm font-black text-[#0A244C]">{value}</span>
    </div>
  );
}

export default App;
