import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cloud,
  Cpu,
  Gauge,
  Medal,
  Moon,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Target,
  XCircle,
} from 'lucide-react';
import { generateCepreExercises } from '../../lib/cepreGenerator';
import { generateExercises, generateFlashAnzanExercise } from '../../lib/exerciseGenerator';
import { generateMultiplicationExercises } from '../../lib/multiplicationGenerator';
import { calculateAnzanMetrics, calculateCepreMetrics, calculateDoubleX2Metrics, calculateMetrics, calculateMultiplicationMetrics, formatCompactNumber, formatDuration } from '../../lib/scoring';
import { analyzeSessions, displaySessionConfig } from '../../lib/sessionAnalytics';
import type { TrainerInsights } from '../../lib/sessionAnalytics';
import { loadSessions, saveSession, updateSessionSyncStatus } from '../../lib/storage';
import { flushSheetSync, getPendingSyncCount, getSheetEndpoint, queueSheetSync, setSheetEndpoint, TARGET_SHEET_URL } from '../../lib/sheetSync';
import type {
  AnswerChoice,
  AnzanConfig,
  AnzanExercise,
  AnzanPreset,
  Category,
  ChainFactorCount,
  CepreBlock,
  CepreConfig,
  CepreMode,
  ChoiceKey,
  DoubleX2Config,
  DoubleX2StepLimit,
  DrillKind,
  Exercise,
  Level,
  MultiplicationConfig,
  MultiplicationType,
  PracticeTopic,
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
  multiplicationTypeLabels,
  practiceTopicLabels,
} from '../../types';

type Screen = 'setup' | 'training' | 'results';
type AnzanPhase = 'sequence' | 'answer';
type X2Phase = 'setup' | 'running';
type TrainerTheme = 'dark' | 'light';

const TOPIC_SELECTION_KEY = 'trainermath-v2:selected-topics';
const THEME_KEY = 'trainermath-v2:theme';

const defaultConfig: TrainingConfig = {
  level: 'level1',
  category: 'mixed',
  topics: ['mixed'],
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

const defaultMultiplicationConfig: MultiplicationConfig = {
  level: 'level2',
  amount: 30,
  mode: 'speed',
  multiplicationType: 'mixed',
  chainFactorCount: 3,
  instantFeedback: true,
};

const defaultDoubleX2Config: DoubleX2Config = {
  start: 12,
  stepLimit: 20,
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
];

const cepreBlockOptions: CepreBlock[] = ['mixed', 'numbers', 'algebra'];
const cepreModeOptions: CepreMode[] = ['diagnostic', 'practice', 'simulation', 'errorReview'];
const multiplicationTypeOptions: MultiplicationType[] = ['mixed', 'oneByOne', 'oneByTwo', 'twoByTwo', 'chain', 'doubleInfinity'];
const chainFactorOptions: ChainFactorCount[] = [2, 3, 4];
const stepLimitOptions: DoubleX2StepLimit[] = [10, 20, 30, 'infinite'];
const practiceTopicOptions: PracticeTopic[] = [
  'addition',
  'subtraction',
  'multiplication',
  'chainMultiplication',
  'doubleX2',
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
];
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
  { id: 'math', title: 'Trainer Math 2.0', subtitle: 'Operaciones, x2, multiplicaciones y Flash Anzan', icon: <Calculator size={20} /> },
  { id: 'cepre', title: 'Entrenador Examen CEPRE', subtitle: 'Números, álgebra y simulación por microtema', icon: <BookOpenCheck size={20} /> },
];

const getMetricElo = (metrics: TrainingSession['metrics']) => metrics.elo ?? Math.round(900 + (metrics.speedScore ?? 0) * 5);

const safeTopicSelection = (value: unknown): PracticeTopic[] | null => {
  if (!Array.isArray(value)) return null;
  const allowed = value.filter((item): item is PracticeTopic => typeof item === 'string' && item in practiceTopicLabels);
  return allowed;
};

const readStoredTopics = () => {
  try {
    const raw = localStorage.getItem(TOPIC_SELECTION_KEY);
    if (!raw) return null;
    return safeTopicSelection(JSON.parse(raw));
  } catch {
    return null;
  }
};

const writeStoredTopics = (topics: PracticeTopic[]) => {
  try {
    localStorage.setItem(TOPIC_SELECTION_KEY, JSON.stringify(topics));
  } catch {
    // localStorage can fail in restricted browser contexts.
  }
};

const readStoredTheme = (): TrainerTheme => {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

const writeStoredTheme = (theme: TrainerTheme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage can fail in restricted browser contexts.
  }
};

const isCepreConfig = (config: TrainingSession['config']): config is CepreConfig => 'block' in config;
const isMultiplicationConfig = (config: TrainingSession['config']): config is MultiplicationConfig => 'multiplicationType' in config;
const isDoubleX2Config = (config: TrainingSession['config']): config is DoubleX2Config => 'start' in config && 'stepLimit' in config;

const getSessionTitle = (session: TrainingSession) => {
  if (session.kind === 'flashAnzan') return 'Flash Anzan';
  if (session.kind === 'doubleX2') return 'Multiplicar x2';
  if (session.kind === 'multiplicationSprint' && isMultiplicationConfig(session.config)) return multiplicationTypeLabels[session.config.multiplicationType];
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
  if (session.kind === 'multiplicationSprint' && isMultiplicationConfig(session.config)) {
    return `${levelLabels[session.config.level]} - ${session.config.amount} multiplicaciones`;
  }
  if (session.kind === 'doubleX2' && isDoubleX2Config(session.config)) {
    return `Inicio ${session.config.start} - ${session.metrics.completed ?? 0} pasos`;
  }
  if ('amount' in session.config) {
    return `${levelLabels[session.config.level]} - ${session.config.amount} preguntas`;
  }
  return 'Sesión';
};

const buildSessionTips = (session: TrainingSession) => {
  const { metrics } = session;
  const tips: string[] = [];

  if (session.kind === 'flashAnzan') {
    tips.push('Agrupa números en bloques de 10, 50 o 100; no repitas toda la secuencia desde cero.');
    tips.push('En sumas/restas, separa acumulado positivo y negativo antes de cerrar el resultado.');
  } else if (session.kind === 'doubleX2') {
    tips.push('Duplica por partes: primero decenas o centenas, luego unidades.');
    tips.push('Usa el valor anterior como ancla visual y avanza solo cuando lo tengas claro.');
  } else if (session.kind === 'multiplicationSprint') {
    tips.push('Primero automatiza 1x1 y 1x2; luego pasa a 2x2 y encadenadas.');
    tips.push('En productos grandes, separa decenas y unidades para evitar carga mental innecesaria.');
  } else {
    tips.push('Antes de operar, nombra el tipo: suma, razón, porcentaje, fracción, serie o ecuación.');
    tips.push('En álgebra, despeja en dos pasos: aislar término y luego dividir o multiplicar.');
  }

  if (metrics.accuracy < 80) tips.push('Criterio: no subas nivel hasta sostener 85% de precisión en dos rondas seguidas.');
  else tips.push('Criterio: si mantienes 90%+, sube dificultad o aumenta volumen antes de buscar más velocidad.');

  if (metrics.averageTimeMs > 7000) tips.push('Truco: reduce escritura mental; calcula primero la estructura y luego los números.');
  else tips.push('Truco: usa verificación inversa rápida para evitar errores por exceso de velocidad.');

  tips.push('Frase de control: precisión primero, velocidad después.');
  return tips.slice(0, 3);
};

export default function TrainerMathApp() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [theme, setTheme] = useState<TrainerTheme>(() => readStoredTheme());
  const [product, setProduct] = useState<TrainerProduct>('math');
  const [activeDrill, setActiveDrill] = useState<DrillKind>('operations');
  const [config, setConfig] = useState<TrainingConfig>(defaultConfig);
  const [anzanConfig, setAnzanConfig] = useState<AnzanConfig>(defaultAnzanConfig);
  const [cepreConfig, setCepreConfig] = useState<CepreConfig>(defaultCepreConfig);
  const [multiplicationConfig, setMultiplicationConfig] = useState<MultiplicationConfig>(defaultMultiplicationConfig);
  const [doubleX2Config, setDoubleX2Config] = useState<DoubleX2Config>(defaultDoubleX2Config);
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
  const [showSheetPanel, setShowSheetPanel] = useState(false);

  useEffect(() => {
    setSessions(loadSessions());
    setSheetEndpointState(getSheetEndpoint());
    setSyncPending(getPendingSyncCount());
    const storedTopics = readStoredTopics();
    if (storedTopics !== null) {
      setConfig((current) => ({
        ...current,
        topics: storedTopics,
        category: storedTopics.includes('mixed') ? 'mixed' : (storedTopics.find((topic): topic is Category => topic in categoryLabels) ?? 'mixed'),
      }));
    }
  }, []);

  useEffect(() => {
    if (config.topics) writeStoredTopics(config.topics);
  }, [config.topics]);

  useEffect(() => {
    writeStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (screen !== 'training' || !startedAt) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setElapsedMs(now - startedAt);
      if ((activeDrill === 'operations' || activeDrill === 'cepreExam' || activeDrill === 'multiplicationSprint') && questionStartedAt) setQuestionElapsedMs(now - questionStartedAt);
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

  const startMultiplication = useCallback((nextConfig = multiplicationConfig) => {
    const now = Date.now();
    setProduct('math');
    setActiveDrill('multiplicationSprint');
    setMultiplicationConfig(nextConfig);
    setExercises(generateMultiplicationExercises(nextConfig));
    setAnzanExercise(null);
    resetRunState(now);
    setScreen('training');
  }, [multiplicationConfig]);

  const startDoubleX2 = useCallback((nextConfig = doubleX2Config) => {
    const now = Date.now();
    setProduct('math');
    setActiveDrill('doubleX2');
    setDoubleX2Config(nextConfig);
    setExercises([]);
    setAnzanExercise(null);
    resetRunState(now);
    setScreen('training');
  }, [doubleX2Config]);

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
        metrics: calculateCepreMetrics(nextAnswers, totalTimeMs, cepreConfig, sessions),
        answers: nextAnswers,
      });
      window.setTimeout(() => setScreen('results'), cepreConfig.instantFeedback ? 520 : 180);
      return;
    }

    if (activeDrill === 'multiplicationSprint') {
      persistSession({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        kind: 'multiplicationSprint',
        config: multiplicationConfig,
        metrics: calculateMultiplicationMetrics(nextAnswers, totalTimeMs, multiplicationConfig, sessions),
        answers: nextAnswers,
      });
      window.setTimeout(() => setScreen('results'), multiplicationConfig.instantFeedback ? 520 : 180);
      return;
    }

    persistSession({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      kind: 'operations',
      config,
      metrics: calculateMetrics(nextAnswers, totalTimeMs, config, sessions),
      answers: nextAnswers,
    });
    window.setTimeout(() => setScreen('results'), config.instantFeedback ? 520 : 180);
  };

  const saveDoubleX2Session = useCallback((history: number[], stepDurations: number[], totalTimeMs: number) => {
    if (history.length < 2) return;
    const answers: UserAnswer[] = history.slice(1).map((value, index) => {
      const previous = history[index];
      return {
        exerciseId: `x2-${index + 1}`,
        category: 'multiplication',
        prompt: `${previous} × 2`,
        input: String(value),
        correctAnswer: String(value),
        isCorrect: true,
        answeredAtMs: stepDurations.slice(0, index + 1).reduce((sum, time) => sum + time, 0),
        responseTimeMs: stepDurations[index] ?? (totalTimeMs / Math.max(1, history.length - 1)),
        trainer: 'math',
        topic: 'Multiplicar x2',
        microtopic: 'Duplicación progresiva',
        questionType: 'calculo',
        errorType: 'ninguno',
      };
    });

    persistSession({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      kind: 'doubleX2',
      config: doubleX2Config,
      metrics: calculateDoubleX2Metrics(answers, totalTimeMs, doubleX2Config, history, sessions),
      answers,
    });
    window.setTimeout(() => setScreen('results'), 180);
  }, [doubleX2Config, persistSession, sessions]);

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
      errorType: choice.isCorrect ? 'ninguno' : currentExercise.expectedError || 'calculo',
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

    const delay =
      activeDrill === 'cepreExam'
        ? (cepreConfig.instantFeedback ? 640 : 160)
        : activeDrill === 'multiplicationSprint'
          ? (multiplicationConfig.instantFeedback ? 520 : 160)
          : config.instantFeedback ? 520 : 160;
    window.setTimeout(() => {
      setCurrentIndex((value) => value + 1);
      setSelectedKey(null);
      setFeedback(null);
      setIsLocked(false);
      setQuestionStartedAt(Date.now());
      setQuestionElapsedMs(0);
    }, delay);
  }, [activeDrill, answers, cepreConfig, config, currentExercise, currentIndex, exercises.length, isLocked, multiplicationConfig, questionStartedAt, sessions, startedAt]);

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
      metrics: calculateAnzanMetrics(nextAnswer, now - startedAt, anzanConfig, sessions),
      answers: [nextAnswer],
    });
    setAnswers([nextAnswer]);
    setSelectedKey(choice.key);
    setFeedback(choice.isCorrect ? 'correct' : 'incorrect');
    setIsLocked(true);
    setElapsedMs(now - startedAt);
    setQuestionElapsedMs(now - answerStartedAt);
    window.setTimeout(() => setScreen('results'), anzanConfig.instantFeedback ? 760 : 220);
  }, [answerStartedAt, anzanConfig, anzanExercise, isLocked, persistSession, sessions, startedAt]);

  useEffect(() => {
    if (screen !== 'training' || isLocked) return;
    const handleKey = (event: KeyboardEvent) => {
      if (activeDrill === 'flashAnzan' && anzanPhase === 'sequence' && anzanConfig.advanceMode === 'manual') {
        if (event.key === 'ArrowRight') moveAnzan(1);
        if (event.key === 'ArrowLeft') moveAnzan(-1);
        return;
      }
      if (event.key === 'Escape') {
        resetToSetup();
        return;
      }
      if (event.key.toLowerCase() === 'r') {
        if (activeDrill === 'flashAnzan') startAnzan();
        else if (activeDrill === 'multiplicationSprint') startMultiplication();
        else if (activeDrill === 'cepreExam') startCepre();
        else if (activeDrill === 'operations') startOperations();
        return;
      }
      const key = event.key.toUpperCase() as ChoiceKey;
      if (!choiceKeys.includes(key)) return;
      if ((activeDrill === 'operations' || activeDrill === 'cepreExam' || activeDrill === 'multiplicationSprint') && currentExercise) {
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
  }, [activeDrill, anzanConfig.advanceMode, anzanExercise, anzanPhase, currentExercise, isLocked, moveAnzan, screen, startAnzan, startCepre, startMultiplication, startOperations, submitAnzanChoice, submitChoice]);

  const resetToSetup = () => {
    setScreen('setup');
    setSelectedKey(null);
    setFeedback(null);
    setIsLocked(false);
  };

  const saveEndpointAndFlush = async () => {
    setSheetEndpoint(sheetEndpoint);
    const result = await flushSheetSync();
    setSyncPending(result.pending);
    setSyncMessage(result.configured ? `Endpoint guardado. Enviados: ${result.sent}. Pendientes: ${result.pending}.` : 'Endpoint vacío. Los intentos se quedan en cola local.');
  };

  return (
    <main className={`trainer-math trainer-theme-${theme} min-h-screen text-white`}>
      <nav className="border-b border-white/10 bg-[#040F20] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#2165FF] shadow-[0_0_28px_rgba(33,101,255,0.45)]">
              <Cpu size={20} />
            </div>
            <div>
              <p className="font-display text-lg font-black">Trainer Math 2.0</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A8AA0]">Neural core · by Alejandro Palpan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#8DB1FF] transition hover:border-[#4D84FF]"
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
              aria-pressed={theme === 'light'}
              aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${showSheetPanel ? 'border-[#4D84FF] bg-[#2165FF] text-white' : 'border-white/15 text-[#8DB1FF] hover:border-[#4D84FF]'}`} onClick={() => setShowSheetPanel((value) => !value)}>
              <Cloud size={16} /> Sheet / Endpoint
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        {screen === 'setup' && (
          <>
            <IntroBar />
            {showSheetPanel && <SheetSyncPanel endpoint={sheetEndpoint} pending={syncPending} message={syncMessage} onEndpointChange={setSheetEndpointState} onSave={saveEndpointAndFlush} />}
            <ProductSwitcher product={product} onChange={(next) => { setProduct(next); setActiveDrill(next === 'cepre' ? 'cepreExam' : 'operations'); }} />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="grid content-start gap-4">
                {product === 'math' ? (
                  <>
                    <DrillSwitcher activeDrill={activeDrill} onChange={setActiveDrill} />
                    {activeDrill === 'operations' && (
                      <TrainingSetup config={config} onChange={setConfig} onStart={() => startOperations()} />
                    )}
                    {activeDrill === 'multiplicationSprint' && (
                      <MultiplicationSetup config={multiplicationConfig} onChange={setMultiplicationConfig} onStart={() => startMultiplication()} />
                    )}
                    {activeDrill === 'doubleX2' && (
                      <DoubleX2Setup config={doubleX2Config} onChange={setDoubleX2Config} onStart={() => startDoubleX2()} />
                    )}
                    {activeDrill === 'flashAnzan' && (
                      <AnzanSetup config={anzanConfig} onChange={setAnzanConfig} onStart={() => startAnzan()} />
                    )}
                  </>
                ) : (
                  <CepreSetup config={cepreConfig} onChange={setCepreConfig} onStart={() => startCepre()} />
                )}
              </section>
              <aside className="grid content-start gap-4">
                <RankingSummary insights={insights} />
                <LeaderboardPanel sessions={insights.leaderboard} />
              </aside>
            </div>
          </>
        )}

        {screen === 'training' && (activeDrill === 'operations' || activeDrill === 'cepreExam' || activeDrill === 'multiplicationSprint') && currentExercise && (
          <OperationsTraining
            drill={activeDrill}
            config={activeDrill === 'cepreExam' ? cepreConfig : activeDrill === 'multiplicationSprint' ? multiplicationConfig : config}
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

        {screen === 'training' && activeDrill === 'doubleX2' && (
          <TrainerX2
            config={doubleX2Config}
            elapsedMs={elapsedMs}
            onSave={saveDoubleX2Session}
            onCancel={resetToSetup}
          />
        )}

        {screen === 'results' && latestSession && (
          <ResultsScreen
            session={latestSession}
            onRepeat={() => {
              if (latestSession.kind === 'flashAnzan') startAnzan(latestSession.config as AnzanConfig);
              else if (latestSession.kind === 'multiplicationSprint') startMultiplication(latestSession.config as MultiplicationConfig);
              else if (latestSession.kind === 'doubleX2') startDoubleX2(latestSession.config as DoubleX2Config);
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

function ProductSwitcher({ product, onChange }: { product: TrainerProduct; onChange: (product: TrainerProduct) => void }) {
  return (
    <section className="grid gap-3 lg:grid-cols-2">
      {productCards.map((item) => (
        <button key={item.id} className={`rounded-lg border p-4 text-left shadow-soft transition hover:-translate-y-0.5 ${product === item.id ? 'border-[#2165FF] bg-[#040F20] text-white' : 'border-[#DCE5F2] bg-white text-[#0A244C] hover:border-[#4D84FF]'}`} onClick={() => onChange(item.id)}>
          <span className="flex items-start gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#2165FF] text-white">{item.icon}</span>
            <span>
              <span className="block font-display text-lg font-black">{item.title}</span>
              <span className={`mt-1 block text-sm font-bold ${product === item.id ? 'text-[#C7D3E6]' : 'text-[#7A8AA0]'}`}>{item.subtitle}</span>
            </span>
          </span>
        </button>
      ))}
    </section>
  );
}

function IntroBar() {
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white px-5 py-4 shadow-soft">
      <p className="text-sm font-bold leading-6 text-[#0A244C]">
        Trainer Math 2.0: operaciones, álgebra, multiplicaciones rápidas, Flash Anzan y simulación CEPRE. Elige módulo, nivel y volumen para medir velocidad, precisión y ELO.
      </p>
    </section>
  );
}

function DrillSwitcher({ activeDrill, onChange }: { activeDrill: DrillKind; onChange: (drill: DrillKind) => void }) {
  const drills: DrillKind[] = ['operations', 'multiplicationSprint', 'doubleX2', 'flashAnzan'];
  return (
    <div className="rounded-lg border border-[#DCE5F2] bg-white p-2 shadow-soft">
      <div className="grid gap-2 lg:grid-cols-4">
        {drills.map((drill) => (
          <button key={drill} className={`flex min-h-20 items-center gap-4 rounded-lg border px-4 py-3 text-left transition ${activeDrill === drill ? 'border-[#2165FF] bg-[#040F20] text-white' : 'border-[#DCE5F2] bg-[#F4F7FF] text-[#0A244C] hover:border-[#4D84FF]'}`} onClick={() => onChange(drill)}>
            <span className="grid h-11 w-11 place-items-center rounded-md bg-[#2165FF] text-white">{drill === 'operations' ? <Target size={20} /> : drill === 'multiplicationSprint' ? <Calculator size={20} /> : drill === 'doubleX2' ? <ArrowRight size={20} /> : <Brain size={20} />}</span>
            <span>
              <span className="block font-display text-lg font-black">{drillLabels[drill]}</span>
              <span className={`text-xs font-bold ${activeDrill === drill ? 'text-[#C7D3E6]' : 'text-[#7A8AA0]'}`}>
                {drill === 'operations' ? 'Multi-tema con A/B/C/D' : drill === 'multiplicationSprint' ? '1x1, 1x2 y encadenadas' : drill === 'doubleX2' ? 'Duplicación con flechas' : 'Sumas y restas rápidas'}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TrainingSetup({ config, onChange, onStart }: { config: TrainingConfig; onChange: (config: TrainingConfig) => void; onStart: () => void }) {
  const setPartial = (partial: Partial<TrainingConfig>) => onChange({ ...config, ...partial });
  const selectedTopics = config.topics ?? [config.category];
  const [topicError, setTopicError] = useState('');
  const updateTopics = (topics: PracticeTopic[]) => {
    setTopicError('');
    const category = topics.includes('mixed') ? 'mixed' : (topics.find((topic): topic is Category => topic in categoryLabels) ?? 'mixed');
    setPartial({ topics, category });
  };
  const start = () => {
    if (selectedTopics.length === 0) {
      setTopicError('Selecciona al menos un tema.');
      return;
    }
    onStart();
  };

  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-7">
      <HeaderBlock eyebrow="Entrenamiento" title="Configura la ronda" text="Selecciona uno o varios temas. La ronda mezclará solo lo elegido." action="Empezar entrenamiento" onAction={start} />
      <div className="mt-6 grid gap-6">
        <Selector title="Nivel" items={levelOptions} labels={levelLabels} selected={config.level} onSelect={(level) => setPartial({ level })} />
        <TopicMultiSelect selected={selectedTopics} onChange={updateTopics} />
        {topicError && <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-200">{topicError}</p>}
        <Selector title="Modo" items={modeOptions} labels={modeLabels} selected={config.mode} onSelect={(mode) => setPartial({ mode })} />
        <AmountSelector value={config.amount} onChange={(amount) => setPartial({ amount })} />
      </div>
    </section>
  );
}

function TopicMultiSelect({ selected, onChange }: { selected: PracticeTopic[]; onChange: (topics: PracticeTopic[]) => void }) {
  const isComplete = selected.includes('mixed');
  const effectiveSelected = isComplete ? ['mixed'] : selected;
  const toggle = (topic: PracticeTopic) => {
    if (topic === 'mixed') {
      onChange(['mixed']);
      return;
    }
    const base = selected.filter((item) => item !== 'mixed');
    const next = base.includes(topic) ? base.filter((item) => item !== topic) : [...base, topic];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">Temas de práctica</h3>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full border border-[#DCE5F2] px-3 py-2 text-xs font-black text-[#2165FF]" onClick={() => onChange([...practiceTopicOptions])}>Seleccionar todo</button>
          <button className="rounded-full border border-[#DCE5F2] px-3 py-2 text-xs font-black text-[#7A8AA0]" onClick={() => onChange([])}>Limpiar</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <TopicChip topic="mixed" active={isComplete} onClick={() => toggle('mixed')} />
        {practiceTopicOptions.map((topic) => (
          <TopicChip key={topic} topic={topic} active={!isComplete && effectiveSelected.includes(topic)} onClick={() => toggle(topic)} />
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-[#7A8AA0]">
        Activos: {isComplete ? 'Completo mixto' : selected.length ? `${selected.length} tema(s)` : 'ninguno'}
      </p>
    </div>
  );
}

function TopicChip({ topic, active, onClick }: { topic: PracticeTopic; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${active ? 'border-[#18C8FF] bg-[#0A74FF] text-white shadow-[0_0_26px_rgba(24,200,255,0.24)]' : 'border-[#DCE5F2] bg-white text-[#0A244C] hover:border-[#18C8FF]'}`}
      onClick={onClick}
    >
      {practiceTopicLabels[topic]}
    </button>
  );
}

function MultiplicationSetup({ config, onChange, onStart }: { config: MultiplicationConfig; onChange: (config: MultiplicationConfig) => void; onStart: () => void }) {
  const setPartial = (partial: Partial<MultiplicationConfig>) => onChange({ ...config, ...partial });
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-7">
      <HeaderBlock eyebrow="Multiplicación Sprint" title="Configura productos rápidos" text="Entrena tablas 1x1, productos 1x2, 2x2, multiplicación encadenada o doble infinito. Marca A/B/C/D por velocidad." action="Iniciar sprint" onAction={onStart} />
      <div className="mt-6 grid gap-6">
        <Selector title="Nivel ELO" items={levelOptions} labels={levelLabels} selected={config.level} onSelect={(level) => setPartial({ level })} />
        <Selector title="Tipo de multiplicación" items={multiplicationTypeOptions} labels={multiplicationTypeLabels} selected={config.multiplicationType} onSelect={(multiplicationType) => setPartial({ multiplicationType })} grid />
        <FactorCountSelector value={config.chainFactorCount ?? 3} onChange={(chainFactorCount) => setPartial({ chainFactorCount })} />
        <Selector title="Modo" items={modeOptions} labels={modeLabels} selected={config.mode} onSelect={(mode) => setPartial({ mode })} />
        <AmountSelector value={config.amount} onChange={(amount) => setPartial({ amount })} />
      </div>
    </section>
  );
}

function FactorCountSelector({ value, onChange }: { value: ChainFactorCount; onChange: (value: ChainFactorCount) => void }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">Factores encadenados</h3>
      <div className="grid grid-cols-3 gap-2">
        {chainFactorOptions.map((amount) => (
          <button key={amount} className={`rounded-lg border px-4 py-3 text-sm font-black transition ${value === amount ? 'border-[#18C8FF] bg-[#0A74FF] text-white' : 'border-[#DCE5F2] bg-white text-[#0A244C] hover:border-[#18C8FF]'}`} onClick={() => onChange(amount)}>
            {amount} factores
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold text-[#7A8AA0]">Solo aplica al modo encadenado. Cada factor va de 1 a 9.</p>
    </div>
  );
}

function DoubleX2Setup({ config, onChange, onStart }: { config: DoubleX2Config; onChange: (config: DoubleX2Config) => void; onStart: () => void }) {
  const [draft, setDraft] = useState(String(config.start));
  const [error, setError] = useState('');
  const setPartial = (partial: Partial<DoubleX2Config>) => onChange({ ...config, ...partial });

  const commitStart = () => {
    const parsed = Number(draft);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setError('Ingresa un entero positivo.');
      return false;
    }
    setError('');
    setPartial({ start: parsed });
    return true;
  };

  const start = () => {
    if (commitStart()) onStart();
  };

  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-7">
      <HeaderBlock eyebrow="Multiplicar x2" title="Elige el número inicial" text="Duplica con flecha derecha. Retrocede con flecha izquierda." action="Empezar" onAction={start} />
      <div className="mt-7 grid gap-6">
        <label className="block">
          <span className="mb-3 block text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">Número inicial</span>
          <input
            className="w-full rounded-2xl border border-[#DCE5F2] bg-[#F4F7FF] px-5 py-5 font-display text-4xl font-black text-[#0A244C] outline-none focus:border-[#18C8FF]"
            inputMode="numeric"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value.replace(/\D/g, '').slice(0, 9));
              setError('');
            }}
            onBlur={commitStart}
            onKeyDown={(event) => {
              if (event.key === 'Enter') start();
            }}
            aria-label="Número inicial para multiplicar x2"
          />
        </label>
        {error && <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-200">{error}</p>}
        <div>
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">Límite de pasos</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stepLimitOptions.map((limit) => (
              <button key={String(limit)} className={`rounded-lg border px-4 py-3 text-sm font-black transition ${config.stepLimit === limit ? 'border-[#18C8FF] bg-[#0A74FF] text-white' : 'border-[#DCE5F2] bg-white text-[#0A244C] hover:border-[#18C8FF]'}`} onClick={() => setPartial({ stepLimit: limit })}>
                {limit === 'infinite' ? 'Infinito' : `${limit} pasos`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrainingShell({ label, title, meta, children, onCancel }: { label: string; title: string; meta: string; children: ReactNode; onCancel: () => void }) {
  return (
    <section className="grid min-h-[calc(100vh-120px)] content-start gap-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-white backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#18C8FF]">{label}</p>
            <h1 className="font-display mt-1 text-2xl font-black tracking-tight">{title}</h1>
            <p className="mt-1 text-sm font-semibold text-[#8E929E]">{meta}</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-black text-white hover:border-[#18C8FF]" onClick={onCancel}>
            <RotateCcw size={17} /> Salir
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

function BigNumberDisplay({ value }: { value: string }) {
  const size = value.length > 18 ? 'text-4xl sm:text-6xl lg:text-7xl' : value.length > 10 ? 'text-5xl sm:text-7xl lg:text-8xl' : 'text-7xl sm:text-8xl lg:text-9xl';
  return (
    <div key={value} className={`flash-number mx-auto grid min-h-64 max-w-5xl place-items-center rounded-3xl border border-[#18C8FF]/25 bg-[#050711] px-4 font-display font-black tracking-tight text-white shadow-[0_0_70px_rgba(24,200,255,0.14)] ${size}`}>
      {value}
    </div>
  );
}

function KeyboardControls({ primaryLabel, onPrimary, onPrevious, onRestart, disabledPrimary }: { primaryLabel: string; onPrimary: () => void; onPrevious: () => void; onRestart: () => void; disabledPrimary?: boolean }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-4 text-sm font-black text-white hover:border-[#18C8FF]" onClick={onPrevious}>
        <ArrowLeft size={18} /> Anterior
      </button>
      <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0A74FF] to-[#18C8FF] px-5 py-4 text-sm font-black text-white shadow-[0_0_34px_rgba(24,200,255,0.28)] disabled:opacity-45" disabled={disabledPrimary} onClick={onPrimary}>
        {primaryLabel} <ArrowRight size={18} />
      </button>
      <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-4 text-sm font-black text-white hover:border-[#7C3AED]" onClick={onRestart}>
        <RotateCcw size={18} /> Reiniciar
      </button>
      <p className="text-center text-xs font-bold text-[#8E929E] sm:col-span-3">Teclado: ← anterior · → siguiente · R reiniciar · Esc salir · Enter reiniciar</p>
    </div>
  );
}

function SessionStats({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-white backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8E929E]">{label}</p>
          <p className="font-display mt-1 break-words text-2xl font-black text-[#18C8FF]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function TrainerX2({ config, elapsedMs, onSave, onCancel }: { config: DoubleX2Config; elapsedMs: number; onSave: (history: number[], stepDurations: number[], totalTimeMs: number) => void; onCancel: () => void }) {
  const [history, setHistory] = useState<number[]>([config.start, config.start * 2]);
  const [index, setIndex] = useState(1);
  const [stepDurations, setStepDurations] = useState<number[]>([]);
  const [lastStepAt, setLastStepAt] = useState(Date.now());
  const [saved, setSaved] = useState(false);
  const stepLimitReached = config.stepLimit !== 'infinite' && index >= config.stepLimit;
  const currentValue = history[index] ?? config.start;
  const historyPreview = history.slice(0, index + 1).map(formatCompactNumber).join(' → ');
  const stepCount = Math.max(0, index);
  const averageStepMs = stepDurations.length ? stepDurations.reduce((sum, value) => sum + value, 0) / stepDurations.length : 0;

  const advance = useCallback(() => {
    if (stepLimitReached) return;
    const now = Date.now();
    setSaved(false);
    setStepDurations((current) => [...current, now - lastStepAt]);
    setLastStepAt(now);
    setHistory((current) => {
      if (index + 1 < current.length) return current;
      return [...current, current[index] * 2];
    });
    setIndex((value) => value + 1);
  }, [index, lastStepAt, stepLimitReached]);

  const back = useCallback(() => {
    setSaved(false);
    setIndex((value) => Math.max(0, value - 1));
  }, []);

  const restart = useCallback(() => {
    setHistory([config.start, config.start * 2]);
    setIndex(1);
    setStepDurations([]);
    setLastStepAt(Date.now());
    setSaved(false);
  }, [config.start]);

  const save = useCallback(() => {
    onSave(history.slice(0, index + 1), stepDurations, elapsedMs);
    setSaved(true);
  }, [elapsedMs, history, index, onSave, stepDurations]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        advance();
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        back();
      }
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        restart();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        restart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [advance, back, onCancel, restart]);

  return (
    <TrainingShell
      label="Multiplicar x2"
      title={stepCount === 0 ? 'Base' : `Paso ${stepCount}`}
      meta={`Inicio ${config.start} · ${config.stepLimit === 'infinite' ? 'sin límite' : `${config.stepLimit} pasos`}`}
      onCancel={onCancel}
    >
      <div className="trainer-card-slide rounded-3xl border border-white/15 bg-white/[0.06] p-5 text-center shadow-[0_22px_70px_rgba(10,116,255,0.14)] sm:p-8">
        <BigNumberDisplay value={formatCompactNumber(currentValue)} />
        <div className="mx-auto mt-5 max-w-4xl truncate rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-[#C5C8D6]">
          {historyPreview}
        </div>
        <KeyboardControls
          primaryLabel="Siguiente"
          onPrimary={advance}
          onPrevious={back}
          onRestart={restart}
          disabledPrimary={stepLimitReached}
        />
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <button className="rounded-xl border border-white/15 px-5 py-3 text-sm font-black text-white" onClick={onCancel}>Cambiar número</button>
          <button className="rounded-xl bg-[#18C8FF] px-5 py-3 text-sm font-black text-[#050711]" onClick={save}>Guardar sesión</button>
        </div>
        {saved && <p className="mt-3 text-sm font-black text-emerald-300">Sesión guardada.</p>}
      </div>
      <SessionStats items={[
        ['Pasos', String(stepCount)],
        ['Máximo', formatCompactNumber(Math.max(...history.slice(0, index + 1)))],
        ['Promedio', averageStepMs ? formatDuration(averageStepMs) : '--'],
        ['Total', formatDuration(elapsedMs)],
      ]} />
    </TrainingShell>
  );
}

function CepreSetup({ config, onChange, onStart }: { config: CepreConfig; onChange: (config: CepreConfig) => void; onStart: () => void }) {
  const setPartial = (partial: Partial<CepreConfig>) => onChange({ ...config, ...partial });
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-7">
      <HeaderBlock eyebrow="CEPRE" title="Números + álgebra" text="Práctica por nivel, microtema y tiempo." action="Iniciar" onAction={onStart} />
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
    if (rawValue && parsed >= 1 && parsed <= 150) onChange(parsed);
  };

  const commit = () => {
    if (!customAmount) {
      setIsEditing(false);
      return;
    }
    const amount = Math.min(150, Math.max(1, Math.round(Number(customAmount) || value)));
    setCustomAmount(String(amount));
    setIsEditing(false);
    onChange(amount);
  };

  return (
    <div>
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">Cantidad de preguntas</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        {amountOptions.map((amount) => (
          <button key={amount} className={`rounded-lg border px-4 py-3 text-sm font-black transition ${value === amount && !isEditing && !customAmount ? 'border-[#2165FF] bg-[#2165FF] text-white' : 'border-[#DCE5F2] bg-white text-[#0A244C] hover:border-[#4D84FF]'}`} onClick={() => { setIsEditing(false); setCustomAmount(''); onChange(amount); }}>
            {amount}
          </button>
        ))}
        <input className={`rounded-lg border px-4 py-3 text-center text-sm font-black text-[#0A244C] outline-none focus:border-[#4D84FF] ${customAmount ? 'border-[#2165FF] bg-[#F4F7FF]' : 'border-[#DCE5F2] bg-white'}`} inputMode="numeric" min={5} max={150} type="text" value={customAmount} placeholder="Manual" onFocus={() => setIsEditing(true)} onChange={(event) => updateCustomAmount(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-[#7A8AA0]">Manual acepta de 1 a 150 preguntas. La opción 100 queda disponible como preset.</p>
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
  config: TrainingConfig | CepreConfig | MultiplicationConfig;
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
    : props.drill === 'multiplicationSprint'
      ? `${props.exercise.topic || 'Multiplicación'} · ${levelLabels[level]}`
    : `${categoryLabels[props.exercise.category]} · ${levelLabels[level]}`;
  const modeLabel = props.drill === 'cepreExam' ? cepreModeLabels[(mode as CepreMode)] : modeLabels[(mode as TrainingMode)];

  return (
    <section className="grid gap-5">
      <TrainingTop label={label} title={`Pregunta ${props.index + 1} / ${props.total}`} elapsedMs={props.elapsedMs} questionElapsedMs={props.questionElapsedMs} correct={props.correctCount} incorrect={props.incorrectCount} mode={modeLabel} progress={progress} onCancel={props.onCancel} />
      <QuestionCard prompt={props.exercise.prompt} choices={props.exercise.choices} feedback={props.feedback} selectedKey={props.selectedKey} isLocked={props.isLocked} explanation={props.exercise.explanation} answerLabel={props.exercise.answerLabel} responseTimeMs={props.questionElapsedMs} onSelect={props.onSelect} />
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
          <QuestionCard prompt="¿Cuál fue el acumulado final?" choices={props.exercise.choices} feedback={props.feedback} selectedKey={props.selectedKey} isLocked={props.isLocked} explanation={props.exercise.explanation} answerLabel={props.exercise.answerLabel} responseTimeMs={props.answerElapsedMs} onSelect={props.onSelect} />
        )}
      </div>
    </section>
  );
}

function QuestionCard({ prompt, choices, feedback, selectedKey, isLocked, explanation, answerLabel, responseTimeMs, onSelect }: { prompt: string; choices: AnswerChoice[]; feedback: 'correct' | 'incorrect' | null; selectedKey: ChoiceKey | null; isLocked: boolean; explanation: string; answerLabel: string; responseTimeMs?: number; onSelect: (choice: AnswerChoice) => void }) {
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
          {responseTimeMs ? <span className="ml-1 opacity-80">· Tiempo {formatDuration(responseTimeMs)}</span> : null}
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
  const generalElo = metrics.generalElo ?? getMetricElo(metrics);
  const modeElo = metrics.modeElo ?? getMetricElo(metrics);
  const eloDelta = metrics.eloDelta ?? metrics.streakImpact ?? 0;
  const operationalItems: Array<[string, string]> = [
    ['Entrenamiento', getSessionTitle(session)],
    ['Configuración', getSessionDetail(session)],
    ['Estado', metrics.status],
    ['Sheets', session.syncStatus === 'synced' ? 'Enviado' : 'Pendiente'],
    ['K de ajuste', String(metrics.kFactor ?? '--')],
    ['Racha ELO', `${eloDelta >= 0 ? '+' : ''}${eloDelta}`],
    ['Foco débil', metrics.weakestCategory],
    ['Mejor área', metrics.bestCategory],
    ['Resistencia', metrics.enduranceInsight],
  ];
  if (session.kind === 'doubleX2') {
    operationalItems.splice(4, 0, ['Pasos', String(metrics.completed ?? metrics.correct)], ['Valor máximo', metrics.maxValue ? formatCompactNumber(metrics.maxValue) : '--'], ['Historial', metrics.historyPreview ?? '--']);
  }
  if (session.kind === 'multiplicationSprint' && metrics.chainFactorCount) {
    operationalItems.splice(4, 0, ['Factores', `${metrics.chainFactorCount}`], ['Mejor racha', `${metrics.bestStreak ?? 0}`]);
  }
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="rounded-lg border border-[#0A244C] bg-[#040F20] p-6 text-white shadow-[0_24px_70px_rgba(4,15,32,0.22)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8DB1FF]">Reporte de estatus</p>
        <h2 className="font-display mt-2 text-4xl font-black tracking-tight sm:text-6xl">{metrics.levelTag}</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#C7D3E6]">{metrics.analysis}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <ResultMetric label="ELO general" value={generalElo.toString()} />
          <ResultMetric label="ELO modo" value={modeElo.toString()} />
          <ResultMetric label="Delta" value={`${eloDelta >= 0 ? '+' : ''}${eloDelta}`} tone={eloDelta >= 0 ? 'green' : 'rose'} />
          <ResultMetric label="Score" value={metrics.speedScore.toString()} />
          <ResultMetric label="Total" value={formatDuration(metrics.totalTimeMs)} />
          <ResultMetric label="Prom." value={formatDuration(metrics.averageTimeMs)} />
          <ResultMetric label="Precisión" value={`${metrics.accuracy}%`} tone="green" />
        </div>
        <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <p className="text-sm font-black text-white">Plan de mejora</p>
          <ul className="mt-3 grid gap-2">
            {metrics.improvementFocus.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-[#C7D3E6]"><ChevronRight className="mt-1 shrink-0 text-[#4D84FF]" size={16} />{item}</li>
            ))}
          </ul>
        </div>
        <TipsPanel tips={buildSessionTips(session)} />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-5 py-3 text-sm font-black text-white" onClick={onRepeat}><Play size={18} />Repetir</button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-black text-white" onClick={onSetup}><RotateCcw size={18} />Configurar</button>
        </div>
      </div>
      <div className="grid gap-4">
        <InfoCard title="Análisis operativo" items={operationalItems} />
      </div>
    </section>
  );
}

function TipsPanel({ tips }: { tips: string[] }) {
  return (
    <div className="mt-4 rounded-lg border border-[#4D84FF]/30 bg-[#2165FF]/10 p-4">
      <p className="text-sm font-black text-white">Tips y criterios para la siguiente ronda</p>
      <div className="mt-3 grid gap-2">
        {tips.map((tip) => (
          <div key={tip} className="flex gap-2 rounded-md bg-white/[0.06] px-3 py-2 text-sm leading-6 text-[#C7D3E6]">
            <Sparkles className="mt-1 shrink-0 text-[#8DB1FF]" size={15} />
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SheetSyncPanel({ endpoint, pending, message, onEndpointChange, onSave }: { endpoint: string; pending: number; message: string; onEndpointChange: (endpoint: string) => void; onSave: () => void }) {
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2165FF]">Sheet / Endpoint</p>
          <p className="mt-1 text-sm font-semibold text-[#7A8AA0]">Conecta Apps Script solo si quieres enviar resultados al Sheet.</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#F4F7FF] text-[#2165FF]"><Cloud size={20} /></span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7A8AA0]">Sincronización</p>
          <p className="mt-2 text-sm leading-6 text-[#7A8AA0]">{message}</p>
          <p className="mt-3 font-display text-2xl font-black text-[#0A244C]">{pending} pendiente(s)</p>
        </div>
        <div className="rounded-lg border border-[#DCE5F2] bg-white p-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7A8AA0]">Endpoint Apps Script</span>
            <input className="mt-2 w-full rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] px-3 py-3 text-sm font-semibold text-[#0A244C] outline-none focus:border-[#2165FF]" placeholder="https://script.google.com/macros/s/.../exec" value={endpoint} onChange={(event) => onEndpointChange(event.target.value)} />
          </label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2165FF] px-4 py-3 text-sm font-black text-white" onClick={onSave}>
              Guardar
            </button>
            <a className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#DCE5F2] px-4 py-3 text-sm font-black text-[#2165FF]" href={TARGET_SHEET_URL} target="_blank" rel="noreferrer">Abrir Sheet</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function RankingSummary({ insights }: { insights: TrainerInsights }) {
  return (
    <section className="rounded-lg border border-[#DCE5F2] bg-white p-4 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2165FF]">Resumen</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <SmallMetric label="ELO" value={insights.currentElo ? String(insights.currentElo) : '--'} />
        <SmallMetric label="Mejor" value={insights.bestElo ? String(insights.bestElo) : '--'} />
        <SmallMetric label="Precisión" value={insights.averageAccuracy ? `${insights.averageAccuracy}%` : '--'} />
        <SmallMetric label="Preguntas" value={String(insights.totalQuestions)} />
      </div>
    </section>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7A8AA0]">{label}</p>
      <p className="font-display mt-1 text-xl font-black text-[#0A244C]">{value}</p>
    </div>
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
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = Number(draft);
    const fallback = Number.isFinite(parsed) ? parsed : value;
    const stepped = step === 1 ? Math.round(fallback) : Math.round(fallback / step) * step;
    const nextValue = Math.min(max, Math.max(min, stepped));
    setDraft(String(nextValue));
    onChange(nextValue);
  };

  return (
    <label className="rounded-lg border border-[#DCE5F2] bg-[#F4F7FF] p-4">
      <span className="text-xs font-black uppercase tracking-[0.2em] text-[#7A8AA0]">{label}</span>
      <div className="mt-3 flex items-center gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-[#DCE5F2] bg-white px-3 py-3 text-lg font-black text-[#0A244C] outline-none focus:border-[#2165FF]"
          inputMode="numeric"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, '').slice(0, 4))}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
        <span className="text-xs font-black text-[#7A8AA0]">{suffix}</span>
      </div>
    </label>
  );
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
