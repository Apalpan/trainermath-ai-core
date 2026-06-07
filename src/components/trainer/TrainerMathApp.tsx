import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BookOpenCheck,
  Brain,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cloud,
  Flame,
  Gauge,
  LineChart,
  Medal,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Trash2,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { generateCepreExercises } from '../../lib/cepreGenerator';
import { generateExercises, generateFlashAnzanExercise } from '../../lib/exerciseGenerator';
import { calculateAnzanMetrics, calculateCepreMetrics, calculateMetrics, formatDuration } from '../../lib/scoring';
import { analyzeSessions, displayPace, displaySessionConfig } from '../../lib/sessionAnalytics';
import type { SuggestedTraining, TrainerInsights } from '../../lib/sessionAnalytics';
import { clearSessions, loadSessions, saveSession, updateSessionSyncStatus } from '../../lib/storage';
import { flushSheetSync, getPendingSyncCount, getSheetEndpoint, queueSheetSync, setSheetEndpoint, TARGET_SHEET_URL } from '../../lib/sheetSync';
import type {
  AnswerChoice,
  AnzanConfig,
  AnzanExercise,
  AnzanPreset,
  Category,
  CepreBlock,
  CepreConfig,
  CepreMode,
  ChoiceKey,
  DrillKind,
  Exercise,
  Level,
  TrainerProduct,
  TrainingConfig,
  TrainingMode,
  TrainingSession,
  UserAnswer,
} from '../../types';
import {
  anzanAdvanceLabels,
  anzanOperationLabels,
  anzanPresetLabels,
  categoryLabels,
  cepreBlockLabels,
  cepreModeLabels,
  drillLabels,
  levelLabels,
  modeLabels,
} from '../../types';

type Screen = 'setup' | 'training' | 'results';
type AnzanPhase = 'sequence' | 'answer';

const defaultConfig: TrainingConfig = {
  level: 'level1',
  category: 'mixed',
  amount: 25,
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

const defaultCepreConfig: CepreConfig = {
  block: 'mixed',
  level: 'level2',
  amount: 30,
  mode: 'diagnostic',
  instantFeedback: true,
};

const categoryOptions: Category[] = [
  'mixed',
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'fractions',
  'percentages',
  'ratios',
  'divisibility',
  'averages',
  'algebra',
  'combined',
  'powers',
  'roots',
  'series',
  'geometry',
  'trigonometry',
  'statistics',
  'probability',
  'combinatorics',
  'reasoning',
];

const cepreBlockOptions: CepreBlock[] = ['mixed', 'numbers', 'algebra', 'geometry', 'readingComprehension', 'readingInterpretive', 'readingCritical'];
const cepreModeOptions: CepreMode[] = ['diagnostic', 'practice', 'simulation', 'errorReview'];
const levelOptions: Level[] = ['level1', 'level2', 'level3', 'level4', 'level5'];
const modeOptions: TrainingMode[] = ['mixed', 'speed', 'accuracy'];
const amountOptions = [10, 20, 30, 50, 100];
const anzanPresetOptions: Array<Exclude<AnzanPreset, 'custom'>> = ['easy', 'medium', 'hard', 'expert'];
const choiceKeys: ChoiceKey[] = ['A', 'B', 'C', 'D'];

const anzanPresets: Record<Exclude<AnzanPreset, 'custom'>, Pick<AnzanConfig, 'digits' | 'terms' | 'displayMs' | 'operationMode' | 'advanceMode'>> = {
  easy: { digits: 1, terms: 5, displayMs: 1000, operationMode: 'addition', advanceMode: 'timed' },
  medium: { digits: 2, terms: 8, displayMs: 750, operationMode: 'addition', advanceMode: 'timed' },
  hard: { digits: 3, terms: 10, displayMs: 500, operationMode: 'additionSubtraction', advanceMode: 'timed' },
  expert: { digits: 4, terms: 15, displayMs: 350, operationMode: 'additionSubtraction', advanceMode: 'timed' },
};

const productCards: Array<{ id: TrainerProduct; title: string; subtitle: string; icon: ReactNode }> = [
  { id: 'math', title: 'TrainerMath', subtitle: 'Cálculo mental, Flash Anzan y resistencia', icon: <Calculator size={20} /> },
  { id: 'cepre', title: 'Entrenador Examen CEPRE', subtitle: 'Matemática + lectura con reporte por microtema', icon: <BookOpenCheck size={20} /> },
];

const capabilities = [
  { title: 'Cálculo mental', text: 'Automatiza operaciones base para no perder tiempo operativo.' },
  { title: 'Patrones rápidos', text: 'Clasifica si es porcentaje, razón, ecuación, geometría o probabilidad.' },
  { title: 'Traducción algebraica', text: 'Convierte texto en ecuación antes de operar.' },
  { title: 'Lectura activa', text: 'Ubica tesis, evidencia, inferencia y falacia antes de marcar.' },
  { title: 'Presión y control', text: 'Mide fatiga, velocidad y errores bajo cronómetro.' },
];

const weeklyPlan = [
  'Lunes: números, fracciones, porcentajes, razones y MCD/MCM.',
  'Martes: álgebra operativa, exponentes, productos notables y ecuaciones.',
  'Miércoles: lectura comprensiva e interpretativa.',
  'Jueves: geometría, ángulos, triángulos, áreas y semejanza.',
  'Viernes: lectura crítica, tesis, argumento y falacias.',
  'Sábado: simulacro mixto de 50 a 100 preguntas.',
  'Domingo: reparación de errores y repetición de fallas.',
];

const getMetricElo = (metrics: TrainingSession['metrics']) => metrics.elo ?? Math.round(900 + (metrics.speedScore ?? 0) * 5);

const isCepreConfig = (config: TrainingSession['config']): config is CepreConfig => 'block' in config;

const getSessionTitle = (session: TrainingSession) => {
  if (session.kind === 'flashAnzan') return 'Flash Anzan';
  if (session.kind === 'cepreExam' && isCepreConfig(session.config)) return cepreBlockLabels[session.config.block];
  if ('category' in session.config) return categoryLabels[session.config.category];
  return 'Entrenamiento';
};

const getSessionDetail = (session: TrainingSession) => {
  if (session.kind === 'flashAnzan' && 'digits' in session.config) {
    return `${session.config.terms} números - ${session.config.digits} dígito(s)`;
  }
  if (session.kind === 'cepreExam' && isCepreConfig(session.config)) {
    return `${levelLabels[session.config.level]} - ${session.config.amount} preguntas`;
  }
  if ('amount' in session.config) {
    return `${levelLabels[session.config.level]} - ${session.config.amount} preguntas`;
  }
  return 'Sesión';
};

export default function TrainerMathApp() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [product, setProduct] = useState<TrainerProduct>('math');
  const [activeDrill, setActiveDrill] = useState<DrillKind>('operations');
  const [config, setConfig] = useState<TrainingConfig>(defaultConfig);
  const [anzanConfig, setAnzanConfig] = useState<AnzanConfig>(defaultAnzanConfig);
  const [cepreConfig, setCepreConfig] = useState<CepreConfig>(defaultCepreConfig);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [anzanExercise, setAnzanExercise] = useState<AnzanExercise | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<ChoiceKey | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);
  const [answerStartedAt, setAnswerStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [questionElapsedMs, setQuestionElapsedMs] = useState(0);
  const [anzanIndex, setAnzanIndex] = useState(0);
  const [anzanPhase, setAnzanPhase] = useState<AnzanPhase>('sequence');
  const [sheetEndpoint, setSheetEndpointState] = useState('');
  const [syncPending, setSyncPending] = useState(0);
  const [syncMessage, setSyncMessage] = useState('Conecta Apps Script para enviar intentos al Sheet.');

  useEffect(() => {
    setSessions(loadSessions());
    setSheetEndpointState(getSheetEndpoint());
    setSyncPending(getPendingSyncCount());
  }, []);

  useEffect(() => {
    if (screen !== 'training' || !startedAt) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setElapsedMs(now - startedAt);
      if ((activeDrill === 'operations' || activeDrill === 'cepreExam') && questionStartedAt) setQuestionElapsedMs(now - questionStartedAt);
      if (activeDrill === 'flashAnzan' && anzanPhase === 'answer' && answerStartedAt) setQuestionElapsedMs(now - answerStartedAt);
    }, 100);
    return () => window.clearInterval(timer);
  }, [activeDrill, answerStartedAt, anzanPhase, questionStartedAt, screen, startedAt]);

  const latestSession = sessions[0];
  const insights = useMemo(() => analyzeSessions(sessions), [sessions]);
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const currentExercise = exercises[currentIndex];

  const persistSession = useCallback((session: TrainingSession) => {
    const pendingSession: TrainingSession = { ...session, syncStatus: 'pending' };
    setSessions(saveSession(pendingSession));
    const pending = queueSheetSync(pendingSession);
    setSyncPending(pending);
    void flushSheetSync().then((result) => {
      setSyncPending(result.pending);
      if (!result.configured) {
        setSyncMessage(`${result.pending} intento(s) en cola local. Falta endpoint Apps Script.`);
        return;
      }
      const status = result.pending === 0 ? 'synced' : 'pending';
      setSessions(updateSessionSyncStatus(session.id, status));
      setSyncMessage(result.sent > 0 ? `Se enviaron ${result.sent} intento(s) al Sheet.` : 'No había intentos pendientes por enviar.');
    });
  }, []);

  const resetRunState = (now: number) => {
    setAnswers([]);
    setCurrentIndex(0);
    setSelectedKey(null);
    setFeedback(null);
    setIsLocked(false);
    setStartedAt(now);
    setQuestionStartedAt(now);
    setAnswerStartedAt(null);
    setElapsedMs(0);
    setQuestionElapsedMs(0);
  };

  const startOperations = useCallback((nextConfig = config) => {
    const now = Date.now();
    setProduct('math');
    setActiveDrill('operations');
    setConfig(nextConfig);
    setExercises(generateExercises(nextConfig));
    setAnzanExercise(null);
    resetRunState(now);
    setScreen('training');
  }, [config]);

  const startCepre = useCallback((nextConfig = cepreConfig) => {
    const now = Date.now();
    setProduct('cepre');
    setActiveDrill('cepreExam');
    setCepreConfig(nextConfig);
    setExercises(generateCepreExercises(nextConfig));
    setAnzanExercise(null);
    resetRunState(now);
    setScreen('training');
  }, [cepreConfig]);

  const startAnzan = useCallback((nextConfig = anzanConfig) => {
    const now = Date.now();
    setProduct('math');
    setActiveDrill('flashAnzan');
    setAnzanConfig(nextConfig);
    setAnzanExercise(generateFlashAnzanExercise(nextConfig));
    setExercises([]);
    resetRunState(now);
    setAnzanIndex(0);
    setAnzanPhase('sequence');
    setScreen('training');
  }, [anzanConfig]);

  const finishQuestionSet = (nextAnswers: UserAnswer[], totalTimeMs: number) => {
    if (activeDrill === 'cepreExam') {
      persistSession({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        kind: 'cepreExam',
        config: cepreConfig,
        metrics: calculateCepreMetrics(nextAnswers, totalTimeMs, cepreConfig),
        answers: nextAnswers,
      });
      window.setTimeout(() => setScreen('results'), cepreConfig.instantFeedback ? 520 : 180);
      return;
    }

    persistSession({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      kind: 'operations',
      config,
      metrics: calculateMetrics(nextAnswers, totalTimeMs, config),
      answers: nextAnswers,
    });
    window.setTimeout(() => setScreen('results'), config.instantFeedback ? 520 : 180);
  };

  const submitChoice = useCallback((choice: AnswerChoice) => {
    if (!currentExercise || !startedAt || !questionStartedAt || isLocked) return;
    const now = Date.now();
    const nextAnswer: UserAnswer = {
      exerciseId: currentExercise.id,
      category: currentExercise.category,
      prompt: currentExercise.prompt,
      input: `${choice.key}: ${choice.label}`,
      correctAnswer: currentExercise.answerLabel,
      isCorrect: choice.isCorrect,
      answeredAtMs: now - startedAt,
      responseTimeMs: now - questionStartedAt,
      trainer: currentExercise.trainer || (activeDrill === 'cepreExam' ? 'cepre' : 'math'),
      block: currentExercise.block,
      topic: currentExercise.topic,
      microtopic: currentExercise.microtopic,
      questionType: currentExercise.questionType,
      explanation: currentExercise.explanation,
      errorType: choice.isCorrect ? 'ninguno' : currentExercise.expectedError || (currentExercise.questionType === 'lectura' ? 'lectura' : 'calculo'),
    };
    const nextAnswers = [...answers, nextAnswer];
    const isLast = currentIndex + 1 >= exercises.length;
    setAnswers(nextAnswers);
    setSelectedKey(choice.key);
    setFeedback(choice.isCorrect ? 'correct' : 'incorrect');
    setIsLocked(true);
    setQuestionElapsedMs(now - questionStartedAt);

    if (isLast) {
      finishQuestionSet(nextAnswers, now - startedAt);
      return;
    }

    const delay = activeDrill === 'cepreExam' ? (cepreConfig.instantFeedback ? 640 : 160) : config.instantFeedback ? 520 : 160;
    window.setTimeout(() => {
      setCurrentIndex((value) => value + 1);
      setSelectedKey(null);
      setFeedback(null);
      setIsLocked(false);
      setQuestionStartedAt(Date.now());
      setQuestionElapsedMs(0);
    }, delay);
  }, [activeDrill, answers, cepreConfig, config, currentExercise, currentIndex, exercises.length, isLocked, questionStartedAt, startedAt]);

  const moveAnzan = useCallback((direction: 1 | -1) => {
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
  }, [anzanConfig.advanceMode, anzanExercise, anzanPhase]);

  useEffect(() => {
    if (screen !== 'training' || activeDrill !== 'flashAnzan' || !anzanExercise || anzanPhase !== 'sequence' || anzanConfig.advanceMode !== 'timed') return;
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

  const submitAnzanChoice = useCallback((choice: AnswerChoice) => {
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
      trainer: 'math',
      topic: 'Flash Anzan',
      microtopic: `${anzanConfig.terms} términos · ${anzanConfig.digits} dígitos`,
      questionType: 'calculo',
      explanation: anzanExercise.explanation,
      errorType: choice.isCorrect ? 'ninguno' : 'calculo',
    };
    persistSession({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      kind: 'flashAnzan',
      config: anzanConfig,
      metrics: calculateAnzanMetrics(nextAnswer, now - startedAt, anzanConfig),
      answers: [nextAnswer],
    });
    setAnswers([nextAnswer]);
    setSelectedKey(choice.key);
    setFeedback(choice.isCorrect ? 'correct' : 'incorrect');
    setIsLocked(true);
    setElapsedMs(now - startedAt);
    setQuestionElapsedMs(now - answerStartedAt);
    window.setTimeout(() => setScreen('results'), anzanConfig.instantFeedback ? 760 : 220);
  }, [answerStartedAt, anzanConfig, anzanExercise, isLocked, persistSession, startedAt]);

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
      if ((activeDrill === 'operations' || activeDrill === 'cepreExam') && currentExercise) {
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
  }, [activeDrill, anzanConfig.advanceMode, anzanExercise, anzanPhase, currentExercise, isLocked, moveAnzan, screen, submitAnzanChoice, submitChoice]);

  const resetToSetup = () => {
    setScreen('setup');
    setSelectedKey(null);
    setFeedback(null);
    setIsLocked(false);
  };

  const startSuggested = (route: SuggestedTraining) => {
    if (route.kind === 'flashAnzan') {
      startAnzan({ ...anzanConfig, ...(route.config as Partial<AnzanConfig>) });
      return;
    }
    if (route.kind === 'cepreExam') {
      startCepre({ ...cepreConfig, ...(route.config as Partial<CepreConfig>) });
      return;
    }
    startOperations({ ...config, ...(route.config as Partial<TrainingConfig>) });
  };

  const saveEndpointAndFlush = async () => {
    setSheetEndpoint(sheetEndpoint);
    const result = await flushSheetSync();
    setSyncPending(result.pending);
    setSyncMessage(result.configured ? `Endpoint guardado. Enviados: ${result.sent}. Pendientes: ${result.pending}.` : 'Endpoint vacío. Los intentos se quedan en cola local.');
  };

  return (
    <main className="min-h-screen bg-[#F4F7FF] text-[#0A244C]">
      <nav className="border-b border-white/10 bg-[#040F20] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#2165FF] shadow-[0_0_28px_rgba(33,101,255,0.45)]">
              <Brain size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">TrainerMath 2.0</p>
              <p className="font-display text-lg font-black">Sistema de entrenamiento matemático</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A8AA0]">by Alejandro Palpan</p>
            </div>
          </div>
          <a className="hidden text-xs font-black uppercase tracking-[0.18em] text-[#8DB1FF] sm:block" href={TARGET_SHEET_URL} target="_blank" rel="noreferrer">
            Sheet de intentos
          </a>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {screen === 'setup' && (
          <>
            <Hero insights={insights} product={product} onStart={() => startSuggested(insights.suggestedTrainings[0])} onCepre={() => startCepre({ ...cepreConfig, block: 'mixed', amount: 30 })} />
            <ProductSwitcher product={product} onChange={(next) => { setProduct(next); setActiveDrill(next === 'cepre' ? 'cepreExam' : 'operations'); }} />
            <ProgressDashboard insights={insights} onStartRoute={startSuggested} />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <section className="grid content-start gap-4">
                {product === 'math' ? (
                  <>
                    <DrillSwitcher activeDrill={activeDrill} onChange={setActiveDrill} />
                    <SuggestedRoutes routes={insights.suggestedTrainings} onStartRoute={startSuggested} />
                    {activeDrill === 'operations' ? (
                      <TrainingSetup config={config} onChange={setConfig} onStart={() => startOperations()} />
                    ) : (
                      <AnzanSetup config={anzanConfig} onChange={setAnzanConfig} onStart={() => startAnzan()} />
                    )}
                  </>
                ) : (
                  <>
                    <CepreRoutes onStart={startCepre} />
                    <CepreSetup config={cepreConfig} onChange={setCepreConfig} onStart={() => startCepre()} />
                  </>
                )}
              </section>
              <aside className="grid content-start gap-4">
                <SheetSyncPanel endpoint={sheetEndpoint} pending={syncPending} message={syncMessage} onEndpointChange={setSheetEndpointState} onSave={saveEndpointAndFlush} />
                <AchievementsPanel achievements={insights.achievements} />
                <LeaderboardPanel sessions={insights.leaderboard} />
                <CapabilityPanel />
                <HistoryPanel sessions={sessions} onClear={() => { clearSessions(); setSessions([]); }} />
              </aside>
            </div>
          </>
        )}

        {screen === 'training' && (activeDrill === 'operations' || activeDrill === 'cepreExam') && currentExercise && (
          <OperationsTraining
            drill={activeDrill}
            config={activeDrill === 'cepreExam' ? cepreConfig : config}
            exercise={currentExercise}
            index={currentIndex}
            total={exercises.length}
            elapsedMs={elapsedMs}
            questionElapsedMs={questionElapsedMs}
            correctCount={correctCount}
            incorrectCount={answers.length - correctCount}
            selectedKey={selectedKey}
            feedback={feedback}
            isLocked={isLocked}
            onSelect={submitChoice}
            onCancel={resetToSetup}
          />
        )}

        {screen === 'training' && activeDrill === 'flashAnzan' && anzanExercise && (
          <FlashAnzanTraining
            config={anzanConfig}
            exercise={anzanExercise}
            index={anzanIndex}
            phase={anzanPhase}
            elapsedMs={elapsedMs}
            answerElapsedMs={questionElapsedMs}
            selectedKey={selectedKey}
            feedback={feedback}
            isLocked={isLocked}
            onSelect={submitAnzanChoice}
            onMove={moveAnzan}
            onAnswer={() => { setAnzanPhase('answer'); setAnswerStartedAt(Date.now()); setQuestionElapsedMs(0); }}
            onCancel={resetToSetup}
          />
        )}

        {screen === 'results' && latestSession && (
          <ResultsScreen
            session={latestSession}
            onRepeat={() => {
              if (latestSession.kind === 'flashAnzan') startAnzan(latestSession.config as AnzanConfig);
              else if (latestSession.kind === 'cepreExam') startCepre(latestSession.config as CepreConfig);
              else startOperations(latestSession.config as TrainingConfig);
            }}
            onSetup={resetToSetup}
          />
        )}
      </div>
    </main>
  );
}

function Hero({ insights, product, onStart, onCepre }: { insights: TrainerInsights; product: TrainerProduct; onStart: () => void; onCepre: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-[#0A244C] bg-[#040F20] p-6 text-white shadow-[0_24px_70px_rgba(4,15,32,0.22)] sm:p-8 lg:p-10">
      <div className="absolute inset-0 technical-grid opacity-35" />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <p className="mb-4 inline-flex rounded-md border border-[#2165FF]/35 bg-[#2165FF]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">
            Leer - clasificar - traducir - operar - verificar
          </p>
          <h1 className="font-display max-w-4xl text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl">
            TrainerMath 2.0 para velocidad, precisión y examen
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#C7D3E6]">
            Dos entrenadores en una plataforma: cálculo mental con Flash Anzan y preparación tipo examen CEPRE con matemática, lectura, ELO, reporte y registro en Sheets.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-5 py-3 text-sm font-black text-white transition hover:bg-[#4D84FF]" onClick={onStart}>
              <Play size={18} /> Ruta recomendada
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:border-[#4D84FF]" onClick={onCepre}>
              Diagnóstico CEPRE <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <HeroCommandPanel insights={insights} activeProduct={product} />
      </div>
    </section>
  );
}

function HeroCommandPanel({ insights, activeProduct }: { insights: TrainerInsights; activeProduct: TrainerProduct }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8DB1FF]">Estado actual</p>
          <h2 className="font-display mt-2 text-3xl font-black text-white">{insights.status}</h2>
          <p className="mt-2 text-sm leading-6 text-[#C7D3E6]">{insights.risk}</p>
        </div>
        <span className="rounded-md bg-[#2165FF] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">{activeProduct === 'cepre' ? 'Examen' : 'Sprint'}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <MetricPill label="ELO actual" value={insights.currentElo ? insights.currentElo.toString() : '--'} />
        <MetricPill label="Mejor ELO" value={insights.bestElo ? insights.bestElo.toString() : '--'} />
        <MetricPill label="Racha" value={insights.streak.toString()} />
        <MetricPill label="Preguntas" value={insights.totalQuestions.toString()} />
      </div>
      <div className="mt-5 rounded-lg border border-[#4D84FF]/35 bg-[#2165FF]/15 px-4 py-3 text-sm font-bold text-[#C7D3E6]">
        <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-[#8DB1FF]">Próximo objetivo</span>
        {insights.nextObjective}
      </div>
    </div>
  );
}

function ProductSwitcher({ product, onChange }: { product: TrainerProduct; onChange: (product: TrainerProduct) => void }) {
  return (
    <section className="grid gap-3 lg:grid-cols-2">
      {productCards.map((item) => (
        <button key={item.id} className={`rounded-lg border p-5 text-left shadow-soft transition hover:-translate-y-0.5 ${product === item.id ? 'border-[#2165FF] bg-[#040F20] text-white' : 'border-[#DCE5F2] bg-white text-[#0A244C] hover:border-[#4D84FF]'}`} onClick={() => onChange(item.id)}>
          <span className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#2165FF] text-white">{item.icon}</span>
            <span>
              <span className="block font-display text-2xl font-black">{item.title}</span>
              <span className={`mt-1 block text-sm font-bold ${product === item.id ? 'text-[#C7D3E6]' : 'text-[#7A8AA0]'}`}>{item.subtitle}</span>
            </span>
          </span>
        </button>
      ))}
    </section>
  );
}

function ProgressDashboard({ insights, onStartRoute }: { insights: TrainerInsights; onStartRoute: (route: SuggestedTraining) => void }) {
  const unlocked = insights.achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Dashboard de progreso</p>
            <h2 className="font-display mt-1 text-2xl font-black text-[#0A244C]">Evidencia, foco y estabilidad</h2>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#F4F7FF] px-3 py-2 text-sm font-black text-[#2165FF]"><Sparkles size={17} />{unlocked}/{insights.achievements.length} logros</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetric icon={<TrendingUp size={18} />} label="Precisión media" value={insights.averageAccuracy ? `${insights.averageAccuracy}%` : '--'} detail={insights.status} />
          <DashboardMetric icon={<Clock3 size={18} />} label="Tiempo medio" value={displayPace(insights.averagePaceMs)} detail="por respuesta" />
          <DashboardMetric icon={<Target size={18} />} label="Foco débil" value={insights.weakTopic} detail="prioridad de práctica" />
          <DashboardMetric icon={<Trophy size={18} />} label="Mejor bloque" value={insights.bestTopic} detail="ventaja actual" />
        </div>
        <TopicBars topics={insights.topicInsights} />
      </div>

      <div className="rounded-lg border border-[#0A244C] bg-[#040F20] p-5 text-white shadow-[0_18px_52px_rgba(4,15,32,0.18)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">Siguiente mejor acción</p>
        <h2 className="font-display mt-1 text-2xl font-black">{insights.suggestedTrainings[0].title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#C7D3E6]">{insights.suggestedTrainings[0].copy}</p>
        <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-5 py-3 text-sm font-black text-white transition hover:bg-[#4D84FF]" onClick={() => onStartRoute(insights.suggestedTrainings[0])}>
          <Zap size={18} /> Ejecutar ahora
        </button>
        <div className="mt-5 grid gap-2">
          {insights.suggestedTrainings.slice(1, 4).map((route) => (
            <button key={route.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-sm font-black text-white transition hover:border-[#4D84FF]" onClick={() => onStartRoute(route)}>
              <span>
                <span className="block text-[11px] uppercase tracking-[0.16em] text-[#8DB1FF]">{route.badge}</span>
                <span>{route.title}</span>
              </span>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function TopicBars({ topics }: { topics: TrainerInsights['topicInsights'] }) {
  const visibleTopics = topics.length ? topics.slice(0, 5) : [{ label: 'Sin historial', accuracy: 0, averageMs: 0, attempts: 0 }];

  return (
    <div className="mt-6 rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]"><LineChart size={15} />Mapa de habilidad</p>
        <p className="text-xs font-bold text-[#7A8AA0]">ordenado por prioridad</p>
      </div>
      <div className="grid gap-3">
        {visibleTopics.map((topic) => (
          <div key={topic.label} className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-[#0A244C]">{topic.label}</span>
              <span className="text-xs font-black text-[#7A8AA0]">{topic.accuracy ? `${topic.accuracy}% · ${displayPace(topic.averageMs)}` : 'pendiente'}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className={`h-full rounded-full ${topic.accuracy >= 85 ? 'bg-emerald-500' : topic.accuracy >= 70 ? 'bg-[#2165FF]' : 'bg-rose-500'}`} style={{ width: `${topic.accuracy}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DrillSwitcher({ activeDrill, onChange }: { activeDrill: DrillKind; onChange: (drill: DrillKind) => void }) {
  const drills: DrillKind[] = ['operations', 'flashAnzan'];
  return (
    <div className="rounded-lg border border-[#DCE5F2] bg-white p-2 shadow-soft">
      <div className="grid gap-2 sm:grid-cols-2">
        {drills.map((drill) => (
          <button key={drill} className={`flex min-h-20 items-center gap-4 rounded-lg border px-4 py-3 text-left transition ${activeDrill === drill ? 'border-[#2165FF] bg-[#040F20] text-white' : 'border-[#DCE5F2] bg-[#F4F7FF] text-[#0A244C] hover:border-[#4D84FF]'}`} onClick={() => onChange(drill)}>
            <span className="grid h-11 w-11 place-items-center rounded-md bg-[#2165FF] text-white">{drill === 'operations' ? <Target size={20} /> : <Brain size={20} />}</span>
            <span>
              <span className="block font-display text-lg font-black">{drillLabels[drill]}</span>
              <span className={`text-xs font-bold ${activeDrill === drill ? 'text-[#C7D3E6]' : 'text-[#7A8AA0]'}`}>{drill === 'operations' ? 'Mapa completo de habilidades' : 'Memoria visual para sumas y restas'}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SuggestedRoutes({ routes, onStartRoute }: { routes: SuggestedTraining[]; onStartRoute: (route: SuggestedTraining) => void }) {
  const icons = [<ShieldCheck size={18} />, <BookOpenCheck size={18} />, <Gauge size={18} />, <Flame size={18} />, <Brain size={18} />];
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {routes.map((route, index) => (
        <button key={route.id} className={`group min-h-28 rounded-lg border border-[#DCE5F2] bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-[#2165FF] ${index === 0 ? 'lg:col-span-2' : ''}`} onClick={() => onStartRoute(route)}>
          <span className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#F4F7FF] text-[#2165FF] transition group-hover:bg-[#2165FF] group-hover:text-white">{icons[index] ?? <Target size={18} />}</span>
            <span className="min-w-0 flex-1">
              <span className="mb-2 inline-flex rounded-md bg-[#040F20] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">{route.badge}</span>
              <span className="block font-display text-lg font-black leading-tight text-[#0A244C]">{route.title}</span>
              <span className="mt-1 block text-sm font-semibold leading-5 text-[#7A8AA0]">{route.copy}</span>
            </span>
            <ChevronRight className="mt-1 shrink-0 text-[#7A8AA0] transition group-hover:text-[#2165FF]" size={18} />
          </span>
        </button>
      ))}
    </div>
  );
}

function CepreRoutes({ onStart }: { onStart: (config: CepreConfig) => void }) {
  const routes: Array<{ title: string; text: string; config: CepreConfig; badge: string }> = [
    { title: 'Diagnóstico mixto', text: 'Matemática y lectura para detectar bloque débil.', badge: 'Base real', config: { ...defaultCepreConfig, block: 'mixed', amount: 30, mode: 'diagnostic' } },
    { title: 'Álgebra intensiva', text: 'Ecuaciones, sistemas, productos notables y polinomios.', badge: 'Matemática', config: { ...defaultCepreConfig, block: 'algebra', amount: 20, mode: 'practice' } },
    { title: 'Lectura crítica', text: 'Tesis, argumento, inferencia y falacias.', badge: 'Lectura', config: { ...defaultCepreConfig, block: 'readingCritical', amount: 20, mode: 'practice' } },
    { title: 'Simulacro 100', text: 'Volumen largo para resistencia y fatiga.', badge: 'Resistencia', config: { ...defaultCepreConfig, block: 'mixed', amount: 100, mode: 'simulation', level: 'level3' } },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {routes.map((route) => (
        <button key={route.title} className="group rounded-lg border border-[#DCE5F2] bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-[#2165FF]" onClick={() => onStart(route.config)}>
          <span className="mb-2 inline-flex rounded-md bg-[#040F20] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">{route.badge}</span>
          <span className="block font-display text-xl font-black text-[#0A244C]">{route.title}</span>
          <span className="mt-1 block text-sm font-semibold leading-5 text-[#7A8AA0]">{route.text}</span>
        </button>
      ))}
    </div>
  );
}

function TrainingSetup({ config, onChange, onStart }: { config: TrainingConfig; onChange: (config: TrainingConfig) => void; onStart: () => void }) {
  const setPartial = (partial: Partial<TrainingConfig>) => onChange({ ...config, ...partial });
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-7">
      <HeaderBlock eyebrow="Mission control" title="Configura entrenamiento" text="Primero automatiza operación base. Luego sube a patrón, problema tipo, simulacro y registro de errores." action="Iniciar" onAction={onStart} />
      <div className="mt-6 grid gap-6">
        <Selector title="Nivel" items={levelOptions} labels={levelLabels} selected={config.level} onSelect={(level) => setPartial({ level })} />
        <Selector title="Bloque / tema" items={categoryOptions} labels={categoryLabels} selected={config.category} onSelect={(category) => setPartial({ category })} grid />
        <Selector title="Modo" items={modeOptions} labels={modeLabels} selected={config.mode} onSelect={(mode) => setPartial({ mode })} />
        <AmountSelector value={config.amount} onChange={(amount) => setPartial({ amount })} />
      </div>
    </section>
  );
}

function CepreSetup({ config, onChange, onStart }: { config: CepreConfig; onChange: (config: CepreConfig) => void; onStart: () => void }) {
  const setPartial = (partial: Partial<CepreConfig>) => onChange({ ...config, ...partial });
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-7">
      <HeaderBlock eyebrow="Exam trainer" title="Configura Examen CEPRE" text="Entrena matemática y lectura como bloques separados. Cada pregunta guarda microtema, tiempo, error y explicación." action="Iniciar examen" onAction={onStart} />
      <div className="mt-6 grid gap-6">
        <Selector title="Bloque" items={cepreBlockOptions} labels={cepreBlockLabels} selected={config.block} onSelect={(block) => setPartial({ block })} grid />
        <Selector title="Nivel" items={levelOptions} labels={levelLabels} selected={config.level} onSelect={(level) => setPartial({ level })} />
        <Selector title="Modo" items={cepreModeOptions} labels={cepreModeLabels} selected={config.mode} onSelect={(mode) => setPartial({ mode })} />
        <AmountSelector value={config.amount} onChange={(amount) => setPartial({ amount })} />
      </div>
    </section>
  );
}

function AmountSelector({ value, onChange }: { value: number; onChange: (amount: number) => void }) {
  const [customAmount, setCustomAmount] = useState(amountOptions.includes(value) ? '' : String(value));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    setCustomAmount(amountOptions.includes(value) ? '' : String(value));
  }, [isEditing, value]);

  const updateCustomAmount = (input: string) => {
    const rawValue = input.replace(/\D/g, '').slice(0, 3);
    setCustomAmount(rawValue);
    const parsed = Number(rawValue);
    if (rawValue && parsed >= 5 && parsed <= 150) onChange(parsed);
  };

  const commit = () => {
    if (!customAmount) {
      setIsEditing(false);
      return;
    }
    const amount = Math.min(150, Math.max(5, Math.round(Number(customAmount) || value)));
    setCustomAmount(String(amount));
    setIsEditing(false);
    onChange(amount);
  };

  return (
    <div>
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">Cantidad de preguntas</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        {amountOptions.map((amount) => (
          <button key={amount} className={`rounded-lg border px-4 py-3 text-sm font-black transition ${value === amount && !customAmount ? 'border-[#2165FF] bg-[#2165FF] text-white' : 'border-[#DCE5F2] bg-white text-[#0A244C] hover:border-[#4D84FF]'}`} onClick={() => { setIsEditing(false); setCustomAmount(''); onChange(amount); }}>
            {amount}
          </button>
        ))}
        <input className={`rounded-lg border px-4 py-3 text-center text-sm font-black text-[#0A244C] outline-none focus:border-[#4D84FF] ${customAmount ? 'border-[#2165FF] bg-[#F4F7FF]' : 'border-[#DCE5F2] bg-white'}`} inputMode="numeric" min={5} max={150} type="text" value={customAmount} placeholder="Manual" onFocus={() => setIsEditing(true)} onChange={(event) => updateCustomAmount(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-[#7A8AA0]">Manual acepta de 5 a 150 preguntas. La opción 100 queda disponible como preset.</p>
    </div>
  );
}

function AnzanSetup({ config, onChange, onStart }: { config: AnzanConfig; onChange: (config: AnzanConfig) => void; onStart: () => void }) {
  const setPartial = (partial: Partial<AnzanConfig>) => onChange({ ...config, ...partial });
  const applyPreset = (preset: Exclude<AnzanPreset, 'custom'>) => onChange({ ...config, ...anzanPresets[preset], preset });
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-7">
      <HeaderBlock eyebrow="Flash Anzan Lab" title="Entrena memoria operativa" text="Números aparecen uno por uno. Retén el acumulado y marca A/B/C/D al final." action="Iniciar Anzan" onAction={onStart} />
      <div className="mt-6 grid gap-6">
        <div>
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">Presets</h3>
          <div className="grid gap-2 sm:grid-cols-4">
            {anzanPresetOptions.map((preset) => (
              <button key={preset} className={`rounded-lg border p-4 text-left transition ${config.preset === preset ? 'border-[#2165FF] bg-[#040F20] text-white' : 'border-[#DCE5F2] bg-[#F4F7FF] text-[#0A244C] hover:border-[#4D84FF]'}`} onClick={() => applyPreset(preset)}>
                <span className="block font-display text-base font-black">{anzanPresetLabels[preset]}</span>
                <span className={`mt-1 block text-xs font-bold ${config.preset === preset ? 'text-[#C7D3E6]' : 'text-[#7A8AA0]'}`}>{anzanPresets[preset].digits} díg. · {anzanPresets[preset].terms} núm. · {anzanPresets[preset].displayMs} ms</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberConfig label="Dígitos" value={config.digits} min={1} max={5} suffix="díg." onChange={(digits) => setPartial({ digits, preset: 'custom' })} />
          <NumberConfig label="Cantidad" value={config.terms} min={3} max={50} suffix="núm." onChange={(terms) => setPartial({ terms, preset: 'custom' })} />
          <NumberConfig label="Aparición" value={config.displayMs} min={150} max={3000} step={50} suffix="ms" onChange={(displayMs) => setPartial({ displayMs, preset: 'custom' })} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Selector title="Secuencia" items={['addition', 'additionSubtraction']} labels={anzanOperationLabels} selected={config.operationMode} onSelect={(operationMode) => setPartial({ operationMode, preset: 'custom' })} />
          <Selector title="Control" items={['timed', 'manual']} labels={anzanAdvanceLabels} selected={config.advanceMode} onSelect={(advanceMode) => setPartial({ advanceMode, preset: 'custom' })} />
        </div>
      </div>
    </section>
  );
}

function OperationsTraining(props: {
  drill: DrillKind;
  config: TrainingConfig | CepreConfig;
  exercise: Exercise;
  index: number;
  total: number;
  elapsedMs: number;
  questionElapsedMs: number;
  correctCount: number;
  incorrectCount: number;
  selectedKey: ChoiceKey | null;
  feedback: 'correct' | 'incorrect' | null;
  isLocked: boolean;
  onSelect: (choice: AnswerChoice) => void;
  onCancel: () => void;
}) {
  const progress = ((props.index + 1) / props.total) * 100;
  const level = 'level' in props.config ? props.config.level : 'level1';
  const mode = 'mode' in props.config ? props.config.mode : 'mixed';
  const label = props.drill === 'cepreExam'
    ? `${props.exercise.topic || 'CEPRE'} · ${props.exercise.microtopic || cepreBlockLabels[props.exercise.block || 'mixed']}`
    : `${categoryLabels[props.exercise.category]} · ${levelLabels[level]}`;
  const modeLabel = props.drill === 'cepreExam' ? cepreModeLabels[(mode as CepreMode)] : modeLabels[(mode as TrainingMode)];

  return (
    <section className="grid gap-5">
      <TrainingTop label={label} title={`Pregunta ${props.index + 1} / ${props.total}`} elapsedMs={props.elapsedMs} questionElapsedMs={props.questionElapsedMs} correct={props.correctCount} incorrect={props.incorrectCount} mode={modeLabel} progress={progress} onCancel={props.onCancel} />
      <QuestionCard prompt={props.exercise.prompt} choices={props.exercise.choices} feedback={props.feedback} selectedKey={props.selectedKey} isLocked={props.isLocked} explanation={props.exercise.explanation} answerLabel={props.exercise.answerLabel} onSelect={props.onSelect} />
    </section>
  );
}

function FlashAnzanTraining(props: {
  config: AnzanConfig;
  exercise: AnzanExercise;
  index: number;
  phase: AnzanPhase;
  elapsedMs: number;
  answerElapsedMs: number;
  selectedKey: ChoiceKey | null;
  feedback: 'correct' | 'incorrect' | null;
  isLocked: boolean;
  onSelect: (choice: AnswerChoice) => void;
  onMove: (direction: 1 | -1) => void;
  onAnswer: () => void;
  onCancel: () => void;
}) {
  const term = props.exercise.terms[props.index];
  const progress = props.phase === 'answer' ? 100 : ((props.index + 1) / props.exercise.terms.length) * 100;
  return (
    <section className="grid gap-5">
      <TrainingTop label={`Flash Anzan · ${anzanOperationLabels[props.config.operationMode]}`} title={props.phase === 'sequence' ? `Número ${props.index + 1} / ${props.exercise.terms.length}` : 'Resultado final'} elapsedMs={props.elapsedMs} questionElapsedMs={props.phase === 'answer' ? props.answerElapsedMs : 0} correct={0} incorrect={0} mode={anzanAdvanceLabels[props.config.advanceMode]} progress={progress} onCancel={props.onCancel} />
      <div className={`trainer-card-slide rounded-lg border border-[#DCE5F2] bg-white p-5 text-center shadow-soft sm:p-8 ${props.feedback === 'correct' ? 'success-pulse' : props.feedback === 'incorrect' ? 'wrong-shake' : ''}`}>
        {props.phase === 'sequence' && term && (
          <>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Retén el acumulado</p>
            <div key={term.id} className={`flash-number mx-auto mt-7 grid min-h-56 max-w-2xl place-items-center rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] font-display text-7xl font-black sm:text-9xl ${term.signedValue < 0 ? 'text-rose-600' : 'text-[#2165FF]'}`}>
              {term.label}
            </div>
            {props.config.advanceMode === 'manual' ? (
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#DCE5F2] px-5 py-3 text-sm font-black" onClick={() => props.onMove(-1)}><ArrowLeft size={18} />Anterior</button>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-5 py-3 text-sm font-black text-white" onClick={() => props.onMove(1)}>Siguiente<ArrowRight size={18} /></button>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#040F20] px-5 py-3 text-sm font-black text-white" onClick={props.onAnswer}>Responder<ChevronRight size={18} /></button>
              </div>
            ) : (
              <p className="mt-5 text-sm font-bold text-[#7A8AA0]">Aparición automática cada {props.config.displayMs} ms</p>
            )}
          </>
        )}
        {props.phase === 'answer' && (
          <QuestionCard prompt="¿Cuál fue el acumulado final?" choices={props.exercise.choices} feedback={props.feedback} selectedKey={props.selectedKey} isLocked={props.isLocked} explanation={props.exercise.explanation} answerLabel={props.exercise.answerLabel} onSelect={props.onSelect} />
        )}
      </div>
    </section>
  );
}

function QuestionCard({ prompt, choices, feedback, selectedKey, isLocked, explanation, answerLabel, onSelect }: { prompt: string; choices: AnswerChoice[]; feedback: 'correct' | 'incorrect' | null; selectedKey: ChoiceKey | null; isLocked: boolean; explanation: string; answerLabel: string; onSelect: (choice: AnswerChoice) => void }) {
  const isLong = prompt.length > 120;
  return (
    <div className={`trainer-card-slide rounded-lg border border-[#DCE5F2] bg-white p-5 text-center shadow-soft sm:p-8 ${feedback === 'correct' ? 'success-pulse' : feedback === 'incorrect' ? 'wrong-shake' : ''}`}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Marca A/B/C/D</p>
      <div className={`mx-auto mt-5 flex min-h-28 max-w-5xl items-center justify-center whitespace-pre-line text-balance font-display font-black tracking-tight text-[#0A244C] ${isLong ? 'text-xl leading-tight sm:text-3xl' : 'text-4xl sm:text-6xl'}`}>{prompt}</div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {choices.map((choice) => (
          <ChoiceButton key={choice.key} choice={choice} selectedKey={selectedKey} isLocked={isLocked} onSelect={onSelect} />
        ))}
      </div>
      {feedback && (
        <div className={`mx-auto mt-6 inline-flex max-w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-black ${feedback === 'correct' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {feedback === 'correct' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {feedback === 'correct' ? `Correcto: ${answerLabel}` : `Correcta: ${answerLabel} · ${explanation}`}
        </div>
      )}
    </div>
  );
}

function ChoiceButton({ choice, selectedKey, isLocked, onSelect }: { choice: AnswerChoice; selectedKey: ChoiceKey | null; isLocked: boolean; onSelect: (choice: AnswerChoice) => void }) {
  const isSelected = selectedKey === choice.key;
  const revealCorrect = isLocked && choice.isCorrect;
  const revealWrong = isLocked && isSelected && !choice.isCorrect;
  return (
    <button className={`choice-card group flex min-h-24 items-center gap-4 rounded-lg border p-4 text-left transition ${revealCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : revealWrong ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-[#DCE5F2] bg-[#F4F7FF] text-[#0A244C] hover:border-[#2165FF] hover:bg-white'}`} disabled={isLocked} onClick={() => onSelect(choice)}>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#040F20] font-display text-xl font-black text-white transition group-hover:bg-[#2165FF]">{choice.key}</span>
      <span className="min-w-0 break-words font-display text-xl font-black tracking-tight sm:text-2xl">{choice.label}</span>
    </button>
  );
}

function ResultsScreen({ session, onRepeat, onSetup }: { session: TrainingSession; onRepeat: () => void; onSetup: () => void }) {
  const { metrics } = session;
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="rounded-lg border border-[#0A244C] bg-[#040F20] p-6 text-white shadow-[0_24px_70px_rgba(4,15,32,0.22)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">Reporte de estatus</p>
        <h2 className="font-display mt-2 text-4xl font-black tracking-tight sm:text-6xl">{metrics.levelTag}</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#C7D3E6]">{metrics.analysis}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <ResultMetric label="ELO" value={getMetricElo(metrics).toString()} />
          <ResultMetric label="Score" value={metrics.speedScore.toString()} />
          <ResultMetric label="Total" value={formatDuration(metrics.totalTimeMs)} />
          <ResultMetric label="Prom." value={formatDuration(metrics.averageTimeMs)} />
          <ResultMetric label="Precisión" value={`${metrics.accuracy}%`} tone="green" />
          <ResultMetric label="Errores" value={metrics.incorrect.toString()} tone="rose" />
        </div>
        <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <p className="text-sm font-black text-white">Plan de mejora</p>
          <ul className="mt-3 grid gap-2">
            {metrics.improvementFocus.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-[#C7D3E6]"><ChevronRight className="mt-1 shrink-0 text-[#4D84FF]" size={16} />{item}</li>
            ))}
          </ul>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-5 py-3 text-sm font-black text-white" onClick={onRepeat}><Play size={18} />Repetir</button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-black text-white" onClick={onSetup}><RotateCcw size={18} />Configurar</button>
        </div>
      </div>
      <div className="grid gap-4">
        <InfoCard title="Lectura operativa" items={[
          ['Entrenamiento', getSessionTitle(session)],
          ['Configuración', getSessionDetail(session)],
          ['Estado', metrics.status],
          ['Sheets', session.syncStatus === 'synced' ? 'Enviado' : 'Pendiente'],
          ['Racha ELO', `${metrics.streakImpact >= 0 ? '+' : ''}${metrics.streakImpact}`],
          ['Foco débil', metrics.weakestCategory],
          ['Mejor área', metrics.bestCategory],
          ['Resistencia', metrics.enduranceInsight],
        ]} />
        <QuestionReview answers={session.answers} />
      </div>
    </section>
  );
}

function SheetSyncPanel({ endpoint, pending, message, onEndpointChange, onSave }: { endpoint: string; pending: number; message: string; onEndpointChange: (endpoint: string) => void; onSave: () => void }) {
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Sheets sync</p>
          <h2 className="font-display text-xl font-black">Registro de intentos</h2>
        </div>
        <Cloud className="text-[#2165FF]" size={22} />
      </div>
      <p className="mt-3 text-sm leading-6 text-[#7A8AA0]">{message}</p>
      <div className="mt-4 rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7A8AA0]">Pendientes</p>
        <p className="font-display text-3xl font-black text-[#0A244C]">{pending}</p>
      </div>
      <label className="mt-4 block">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7A8AA0]">Endpoint Apps Script</span>
        <input className="mt-2 w-full rounded-lg border border-[#DCE5F2] bg-white px-3 py-3 text-sm font-semibold text-[#0A244C] outline-none focus:border-[#2165FF]" placeholder="https://script.google.com/macros/s/..." value={endpoint} onChange={(event) => onEndpointChange(event.target.value)} />
      </label>
      <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-4 py-3 text-sm font-black text-white" onClick={onSave}>
        Guardar y sincronizar
      </button>
      <a className="mt-3 block text-xs font-black uppercase tracking-[0.12em] text-[#2165FF]" href={TARGET_SHEET_URL} target="_blank" rel="noreferrer">Abrir Google Sheet</a>
    </section>
  );
}

function AchievementsPanel({ achievements }: { achievements: TrainerInsights['achievements'] }) {
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Gamificación</p>
          <h2 className="font-display text-xl font-black">Logros</h2>
        </div>
        <Award className="text-[#2165FF]" size={22} />
      </div>
      <div className="mt-4 grid gap-3">
        {achievements.slice(0, 7).map((achievement) => (
          <div key={achievement.id} className={`rounded-lg border p-3 ${achievement.unlocked ? 'border-emerald-200 bg-emerald-50' : 'border-[#DCE5F2] bg-[#F4F7FF]'}`}>
            <div className="flex items-start gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md text-white ${achievement.unlocked ? 'bg-emerald-500' : 'bg-[#7A8AA0]'}`}>
                {achievement.unlocked ? <Trophy size={17} /> : <Medal size={17} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#0A244C]">{achievement.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#7A8AA0]">{achievement.description}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className={`h-full rounded-full ${achievement.unlocked ? 'bg-emerald-500' : 'bg-[#2165FF]'}`} style={{ width: `${achievement.progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LeaderboardPanel({ sessions }: { sessions: TrainingSession[] }) {
  return (
    <section className="rounded-lg border border-[#0A244C] bg-[#040F20] p-5 text-white shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">Ranking local</p>
          <h2 className="font-display text-xl font-black">Top sesiones</h2>
        </div>
        <Medal className="text-[#8DB1FF]" size={22} />
      </div>
      {sessions.length === 0 ? (
        <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-[#C7D3E6]">Completa sesiones para crear tu ranking personal.</p>
      ) : (
        <div className="mt-4 grid gap-2">
          {sessions.map((session, index) => (
            <div key={session.id} className="grid grid-cols-[32px_minmax(0,1fr)_72px] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-3">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-[#2165FF] text-xs font-black text-white">{index + 1}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{getSessionTitle(session)}</p>
                <p className="truncate text-xs font-semibold text-[#7A8AA0]">{displaySessionConfig(session)}</p>
              </div>
              <span className="text-right font-display text-lg font-black text-[#8DB1FF]">{getMetricElo(session.metrics)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CapabilityPanel() {
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Plan maestro</p>
      <h2 className="font-display mt-1 text-xl font-black text-[#0A244C]">5 capacidades</h2>
      <div className="mt-4 grid gap-3">
        {capabilities.map((item) => (
          <div key={item.title} className="rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-3">
            <p className="text-sm font-black text-[#0A244C]">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-[#7A8AA0]">{item.text}</p>
          </div>
        ))}
      </div>
      <details className="mt-4 rounded-lg border border-[#DCE5F2] bg-white p-3">
        <summary className="cursor-pointer text-sm font-black text-[#0A244C]">Rutina semanal</summary>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-[#7A8AA0]">
          {weeklyPlan.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>
    </section>
  );
}

function HistoryPanel({ sessions, onClear }: { sessions: TrainingSession[]; onClear: () => void }) {
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Bitácora</p>
          <h2 className="font-display text-xl font-black">Historial</h2>
        </div>
        {sessions.length > 0 && <button className="rounded-lg border border-[#DCE5F2] p-2 text-[#7A8AA0]" onClick={onClear} aria-label="Borrar historial"><Trash2 size={17} /></button>}
      </div>
      {sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#DCE5F2] bg-[#F4F7FF] p-4 text-sm text-[#7A8AA0]">Haz un diagnóstico para crear tu línea base.</p>
      ) : (
        <div className="grid gap-3">
          {sessions.slice(0, 8).map((session) => (
            <div key={session.id} className="rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black">{getSessionTitle(session)}</p>
                  <p className="mt-1 text-xs font-semibold text-[#7A8AA0]">{new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(session.createdAt))}</p>
                </div>
                <span className="rounded-md bg-white px-3 py-1 text-sm font-black text-[#2165FF]">{getMetricElo(session.metrics)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TrainingTop({ label, title, elapsedMs, questionElapsedMs, correct, incorrect, mode, progress, onCancel }: { label: string; title: string; elapsedMs: number; questionElapsedMs: number; correct: number; incorrect: number; mode: string; progress: number; onCancel: () => void }) {
  return (
    <div className="rounded-lg border border-[#0A244C] bg-[#040F20] p-4 text-white shadow-[0_18px_46px_rgba(4,15,32,0.18)]">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">{label}</p>
          <h2 className="font-display mt-1 text-2xl font-black">{title}</h2>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-black" onClick={onCancel}><RotateCcw size={17} />Salir</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <TrainingMetric icon={<Clock3 size={18} />} label="Total" value={formatDuration(elapsedMs)} />
        <TrainingMetric icon={<Gauge size={18} />} label="Pregunta" value={questionElapsedMs ? formatDuration(questionElapsedMs) : '--'} />
        <TrainingMetric icon={<Target size={18} />} label="Aciertos" value={correct.toString()} />
        <TrainingMetric icon={<XCircle size={18} />} label="Errores" value={incorrect.toString()} />
        <TrainingMetric icon={<BarChart3 size={18} />} label="Modo" value={mode} />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#2165FF]" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

function Selector<T extends string>({ title, items, labels, selected, onSelect, grid }: { title: string; items: T[]; labels: Record<T, string>; selected: T; onSelect: (item: T) => void; grid?: boolean }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">{title}</h3>
      <div className={`grid gap-2 ${grid ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {items.map((item) => (
          <button key={item} className={`min-h-12 rounded-lg border px-3 py-3 text-sm font-black transition ${selected === item ? 'border-[#2165FF] bg-[#2165FF] text-white' : 'border-[#DCE5F2] bg-white text-[#0A244C] hover:border-[#4D84FF]'}`} onClick={() => onSelect(item)}>
            {labels[item]}
          </button>
        ))}
      </div>
    </div>
  );
}

function HeaderBlock({ eyebrow, title, text, action, onAction }: { eyebrow: string; title: string; text: string; action: string; onAction: () => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">{eyebrow}</p>
        <h2 className="font-display mt-2 text-2xl font-black tracking-tight text-[#0A244C]">{title}</h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-[#7A8AA0]">{text}</p>
      </div>
      <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-5 py-3 text-sm font-black text-white" onClick={onAction}><Play size={18} />{action}</button>
    </div>
  );
}

function NumberConfig({ label, value, min, max, step = 1, suffix, onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <label className="rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-4">
      <span className="text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">{label}</span>
      <div className="mt-3 flex items-center gap-2">
        <input className="min-w-0 flex-1 rounded-lg border border-[#DCE5F2] bg-white px-3 py-3 text-lg font-black text-[#0A244C] outline-none" type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} />
        <span className="text-xs font-black text-[#7A8AA0]">{suffix}</span>
      </div>
    </label>
  );
}

function DashboardMetric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-4">
      <div className="mb-3 inline-flex rounded-md bg-white p-2 text-[#2165FF]">{icon}</div>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7A8AA0]">{label}</p>
      <p className="mt-1 break-words font-display text-2xl font-black leading-tight text-[#0A244C]">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#7A8AA0]">{detail}</p>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.07] px-3 py-3 text-center"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8DB1FF]">{label}</p><p className="font-display text-2xl font-black text-white">{value}</p></div>;
}

function TrainingMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3"><div className="mb-2 inline-flex text-[#8DB1FF]">{icon}</div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7A8AA0]">{label}</p><p className="mt-1 break-words font-display text-2xl font-black tracking-tight text-white">{value}</p></div>;
}

function ResultMetric({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'green' | 'rose' }) {
  const color = tone === 'green' ? 'text-emerald-300' : tone === 'rose' ? 'text-rose-300' : 'text-[#8DB1FF]';
  return <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7A8AA0]">{label}</p><p className={`mt-1 break-words font-display text-2xl font-black tracking-tight ${color}`}>{value}</p></div>;
}

function InfoCard({ title, items }: { title: string; items: Array<[string, string]> }) {
  return <div className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">{title}</p><div className="mt-5 space-y-4">{items.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-[#DCE5F2] pb-3"><span className="text-sm text-[#7A8AA0]">{label}</span><span className="max-w-[210px] truncate text-right text-sm font-black text-[#0A244C]">{value}</span></div>)}</div></div>;
}

function QuestionReview({ answers }: { answers: UserAnswer[] }) {
  return (
    <div className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2165FF]">Bitácora de errores y tiempo</p>
      <div className="mt-4 max-h-[430px] space-y-2 overflow-auto pr-1">
        {answers.map((answer, index) => (
          <div key={`${answer.exerciseId}-${index}`} className="grid grid-cols-[36px_minmax(0,1fr)_82px] items-center gap-3 rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-3">
            <span className={`grid h-8 w-8 place-items-center rounded-md text-xs font-black text-white ${answer.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}>{index + 1}</span>
            <div className="min-w-0"><p className="truncate text-sm font-black text-[#0A244C]">{answer.topic ? `${answer.topic}: ` : ''}{answer.prompt}</p><p className="truncate text-xs font-semibold text-[#7A8AA0]">Marcaste {answer.input}; correcta {answer.correctAnswer}</p></div>
            <span className="text-right text-sm font-black text-[#0A244C]">{formatDuration(answer.responseTimeMs)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
