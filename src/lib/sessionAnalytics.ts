import type { AnzanConfig, Category, CepreConfig, TrainingConfig, TrainingSession, UserAnswer } from '../types';
import { categoryLabels, cepreBlockLabels, levelLabels } from '../types';
import { formatDuration } from './scoring';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
}

export interface SuggestedTraining {
  id: string;
  title: string;
  copy: string;
  badge: string;
  kind: 'operations' | 'flashAnzan' | 'cepreExam';
  config: Partial<TrainingConfig> | Partial<AnzanConfig> | Partial<CepreConfig>;
}

export interface TopicInsight {
  label: string;
  accuracy: number;
  averageMs: number;
  attempts: number;
}

export interface TrainerInsights {
  currentElo: number;
  bestElo: number;
  averageAccuracy: number;
  averagePaceMs: number;
  totalQuestions: number;
  totalErrors: number;
  streak: number;
  weeklySessions: number;
  trendLabel: string;
  nextObjective: string;
  weakTopic: string;
  bestTopic: string;
  status: string;
  risk: string;
  topicInsights: TopicInsight[];
  achievements: Achievement[];
  leaderboard: TrainingSession[];
  suggestedTrainings: SuggestedTraining[];
}

const sessionElo = (session: TrainingSession) => session.metrics.elo ?? Math.round(900 + (session.metrics.speedScore ?? 0) * 5);
const isOperationsConfig = (config: TrainingSession['config']): config is TrainingConfig => 'category' in config;
const isCepreConfig = (config: TrainingSession['config']): config is CepreConfig => 'block' in config;
const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const currentWeekCount = (sessions: TrainingSession[]) => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return sessions.filter((session) => new Date(session.createdAt).getTime() >= sevenDaysAgo).length;
};

const currentStreak = (sessions: TrainingSession[]) => {
  let streak = 0;
  for (const session of sessions) {
    if (session.metrics.accuracy >= 80) streak += 1;
    else break;
  }
  return streak;
};

const answerLabel = (answer: UserAnswer) => answer.topic || categoryLabels[answer.category];

const topicRead = (sessions: TrainingSession[]) => {
  const stats = new Map<string, { correct: number; total: number; time: number }>();

  sessions.flatMap((session) => session.answers).forEach((answer: UserAnswer) => {
    const label = answerLabel(answer);
    const current = stats.get(label) ?? { correct: 0, total: 0, time: 0 };
    current.correct += answer.isCorrect ? 1 : 0;
    current.total += 1;
    current.time += answer.responseTimeMs;
    stats.set(label, current);
  });

  return Array.from(stats.entries())
    .map(([label, value]) => ({
      label,
      accuracy: clampPercent((value.correct / Math.max(1, value.total)) * 100),
      averageMs: value.time / Math.max(1, value.total),
      attempts: value.total,
    }))
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return b.averageMs - a.averageMs;
    });
};

const trendRead = (sessions: TrainingSession[]) => {
  if (sessions.length < 4) return 'Sin tendencia todavía';
  const recent = average(sessions.slice(0, 3).map(sessionElo));
  const previous = average(sessions.slice(3, 6).map(sessionElo));
  const delta = Math.round(recent - previous);
  if (delta >= 35) return `Subiendo +${delta} ELO`;
  if (delta <= -35) return `Cayendo ${delta} ELO`;
  return 'Ritmo estable';
};

const buildAchievements = (sessions: TrainingSession[], totalQuestions: number, bestElo: number, streak: number): Achievement[] => {
  const bestAccuracy = Math.max(0, ...sessions.map((session) => session.metrics.accuracy));
  const hasFlash = sessions.some((session) => session.kind === 'flashAnzan');
  const hasHundred = sessions.some((session) => isOperationsConfig(session.config) && session.config.amount >= 100);
  const hasCepre = sessions.some((session) => session.kind === 'cepreExam');

  return [
    {
      id: 'base',
      title: 'Línea base',
      description: 'Completa tu primera sesión medida.',
      unlocked: sessions.length >= 1,
      progress: clampPercent((sessions.length / 1) * 100),
    },
    {
      id: 'resistance',
      title: 'Resistencia 100',
      description: 'Termina una sesión de 100 preguntas.',
      unlocked: hasHundred,
      progress: hasHundred ? 100 : clampPercent((Math.max(0, ...sessions.map((session) => (isOperationsConfig(session.config) ? session.config.amount : 0))) / 100) * 100),
    },
    {
      id: 'precision',
      title: 'Precisión 90+',
      description: 'Logra 90% o más en una sesión.',
      unlocked: bestAccuracy >= 90,
      progress: clampPercent(bestAccuracy),
    },
    {
      id: 'competitive',
      title: 'ELO competitivo',
      description: 'Supera 1300 de capacidad.',
      unlocked: bestElo >= 1300,
      progress: clampPercent((bestElo / 1300) * 100),
    },
    {
      id: 'streak',
      title: 'Racha estable',
      description: 'Encadena 3 sesiones con 80%+.',
      unlocked: streak >= 3,
      progress: clampPercent((streak / 3) * 100),
    },
    {
      id: 'flash',
      title: 'Memoria Anzan',
      description: 'Completa un reto Flash Anzan.',
      unlocked: hasFlash,
      progress: hasFlash ? 100 : 0,
    },
    {
      id: 'cepre',
      title: 'Modo examen',
      description: 'Completa un entrenamiento CEPRE.',
      unlocked: hasCepre,
      progress: hasCepre ? 100 : 0,
    },
    {
      id: 'volume',
      title: 'Volumen 500',
      description: 'Acumula 500 preguntas entrenadas.',
      unlocked: totalQuestions >= 500,
      progress: clampPercent((totalQuestions / 500) * 100),
    },
  ];
};

const buildSuggestedTrainings = (weakTopic: string, averageAccuracy: number, currentElo: number): SuggestedTraining[] => {
  const weakCategory = (Object.entries(categoryLabels).find(([, label]) => label === weakTopic)?.[0] ?? 'mixed') as Category;
  const needsPrecision = averageAccuracy > 0 && averageAccuracy < 82;
  const baselineLevel: TrainingConfig['level'] = currentElo >= 1550 ? 'level4' : currentElo >= 1300 ? 'level3' : currentElo >= 1100 ? 'level2' : 'level1';

  return [
    {
      id: 'adaptive-focus',
      title: currentElo ? (needsPrecision ? 'Recuperar precisión' : `Refuerzo: ${weakTopic}`) : 'Diagnóstico integral',
      copy: currentElo ? (needsPrecision ? '20 preguntas a ritmo controlado para recuperar exactitud.' : 'Bloque corto sobre la categoría que más te está costando.') : '40 preguntas mixtas para crear tu línea base real.',
      badge: 'Recomendado',
      kind: 'operations',
      config: { level: currentElo ? baselineLevel : 'level2', category: currentElo ? weakCategory : 'mixed', amount: currentElo ? (needsPrecision ? 20 : 25) : 40, mode: needsPrecision ? 'accuracy' : 'mixed' },
    },
    {
      id: 'cepre-diagnostic',
      title: 'Diagnóstico examen CEPRE',
      copy: '30 preguntas de números, operaciones y álgebra para detectar bloque débil.',
      badge: 'Examen',
      kind: 'cepreExam',
      config: { level: baselineLevel, block: 'mixed', amount: 30, mode: 'diagnostic' },
    },
    {
      id: 'speed-sprint',
      title: 'Sprint rápido',
      copy: '10 preguntas para bajar tiempo promedio sin perder control.',
      badge: 'Velocidad',
      kind: 'operations',
      config: { level: baselineLevel, category: 'mixed', amount: 10, mode: 'speed' },
    },
    {
      id: 'hundred-endurance',
      title: 'Resistencia 100',
      copy: 'Sesión larga para medir fatiga, errores tardíos y estabilidad.',
      badge: 'Resistencia',
      kind: 'operations',
      config: { level: 'level3', category: 'mixed', amount: 100, mode: 'mixed' },
    },
    {
      id: 'flash-memory',
      title: 'Flash Anzan',
      copy: 'Memoria operativa y acumulado mental con presión visual.',
      badge: 'Memoria',
      kind: 'flashAnzan',
      config: { digits: currentElo >= 1450 ? 3 : 2, terms: currentElo >= 1450 ? 10 : 8, displayMs: currentElo >= 1450 ? 550 : 750, operationMode: 'additionSubtraction', advanceMode: 'timed', preset: 'custom' },
    },
  ];
};

export const analyzeSessions = (sessions: TrainingSession[]): TrainerInsights => {
  const currentElo = sessions[0] ? sessionElo(sessions[0]) : 0;
  const bestElo = sessions.length ? Math.max(...sessions.map(sessionElo)) : 0;
  const allAnswers = sessions.flatMap((session) => session.answers);
  const totalQuestions = allAnswers.length;
  const totalErrors = allAnswers.filter((answer) => !answer.isCorrect).length;
  const averageAccuracy = sessions.length ? Math.round(average(sessions.map((session) => session.metrics.accuracy))) : 0;
  const averagePaceMs = allAnswers.length ? average(allAnswers.map((answer) => answer.responseTimeMs)) : 0;
  const streak = currentStreak(sessions);
  const topicInsights = topicRead(sessions);
  const weakTopic = topicInsights[0]?.label ?? 'Mixto';
  const bestTopic = [...topicInsights].sort((a, b) => {
    if (a.accuracy !== b.accuracy) return b.accuracy - a.accuracy;
    return a.averageMs - b.averageMs;
  })[0]?.label ?? 'Sin datos';

  const status =
    !sessions.length
      ? 'Sin línea base'
      : averageAccuracy >= 90 && currentElo >= 1350
        ? 'Listo para subir dificultad'
        : averageAccuracy >= 82
          ? 'Buen avance'
          : 'Precisión en riesgo';

  const risk =
    !sessions.length
      ? 'Aún no hay historial. Crea una línea base con diagnóstico.'
      : averageAccuracy < 80
        ? 'Subir nivel ahora reforzaría errores. Conviene entrenar precisión.'
        : averagePaceMs > 8000
          ? 'El cuello de botella principal es velocidad de decisión.'
          : 'Riesgo controlado. El siguiente salto debe ser variedad y resistencia.';

  const nextObjective =
    !sessions.length
      ? 'Completar diagnóstico integral'
      : averageAccuracy < 82
        ? 'Recuperar 85% de precisión'
        : currentElo < 1300
          ? 'Superar ELO 1300'
          : streak < 3
            ? 'Consolidar racha de 3 sesiones'
            : 'Sostener 100 preguntas con 90%+';

  return {
    currentElo,
    bestElo,
    averageAccuracy,
    averagePaceMs,
    totalQuestions,
    totalErrors,
    streak,
    weeklySessions: currentWeekCount(sessions),
    trendLabel: trendRead(sessions),
    nextObjective,
    weakTopic,
    bestTopic,
    status,
    risk,
    topicInsights,
    achievements: buildAchievements(sessions, totalQuestions, bestElo, streak),
    leaderboard: [...sessions].sort((a, b) => sessionElo(b) - sessionElo(a)).slice(0, 5),
    suggestedTrainings: buildSuggestedTrainings(weakTopic, averageAccuracy, currentElo),
  };
};

export const displayPace = (milliseconds: number) => (milliseconds ? formatDuration(milliseconds) : '--');

export const displaySessionConfig = (session: TrainingSession) => {
  if (session.kind === 'flashAnzan' && 'digits' in session.config) {
    return `${session.config.terms} números · ${session.config.digits} dígitos`;
  }

  if (session.kind === 'cepreExam' && isCepreConfig(session.config)) {
    return `${session.config.amount} preguntas · ${cepreBlockLabels[session.config.block]}`;
  }

  if ('amount' in session.config) {
    return `${session.config.amount} preguntas · ${levelLabels[session.config.level]}`;
  }

  return 'Sesión';
};
