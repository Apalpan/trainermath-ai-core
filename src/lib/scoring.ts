import type { AnzanConfig, CepreConfig, DoubleX2Config, DrillKind, MultiplicationConfig, SessionMetrics, TrainingConfig, TrainingSession, UserAnswer } from '../types';
import { categoryLabels, cepreBlockLabels, levelLabels, multiplicationTypeLabels } from '../types';

export const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((milliseconds % 1000) / 100);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
};

const clamp = (min: number, max: number, value: number) => Math.max(min, Math.min(max, value));

const levelFromElo = (elo: number) => {
  if (elo >= 2600) return 'Elite mental';
  if (elo >= 2100) return 'Avanzado';
  if (elo >= 1600) return 'Competitivo';
  if (elo >= 1000) return 'En desarrollo';
  return 'Principiante';
};

const kFactorFor = (attempts: number) => {
  if (attempts < 5) return 80;
  if (attempts < 20) return 48;
  if (attempts < 50) return 32;
  return 16;
};

const levelDifficulty: Record<TrainingConfig['level'], number> = {
  level1: 0.9,
  level2: 1.05,
  level3: 1.22,
  level4: 1.42,
  level5: 1.68,
};

const categoryDifficulty: Record<TrainingConfig['category'], number> = {
  addition: 0.82,
  subtraction: 0.88,
  multiplication: 1,
  division: 1.05,
  fractions: 1.24,
  powers: 1.18,
  roots: 1.12,
  algebra: 1.34,
  combined: 1.25,
  percentages: 1.22,
  ratios: 1.2,
  divisibility: 1.16,
  averages: 1.12,
  series: 1.16,
  mixed: 1.42,
};

const multiplicationDifficulty: Record<MultiplicationConfig['multiplicationType'], number> = {
  oneByOne: 0.85,
  oneByTwo: 1.08,
  twoByTwo: 1.46,
  chain: 1.3,
  doubleInfinity: 1.18,
  mixed: 1.36,
};

const cepreBlockDifficulty: Record<CepreConfig['block'], number> = {
  numbers: 1.12,
  algebra: 1.34,
  mixed: 1.48,
};

const operationDifficulty = (config: TrainingConfig) => {
  const volumeFactor = config.amount >= 100 ? 1.3 : config.amount >= 50 ? 1.16 : 1 + config.amount / 180;
  const modeFactor = config.mode === 'speed' ? 1.12 : config.mode === 'accuracy' ? 1.04 : 1.08;
  return levelDifficulty[config.level] * categoryDifficulty[config.category] * volumeFactor * modeFactor;
};

const multiplicationSprintDifficulty = (config: MultiplicationConfig) => {
  const volumeFactor = config.amount >= 100 ? 1.26 : config.amount >= 50 ? 1.14 : 1 + config.amount / 220;
  const modeFactor = config.mode === 'speed' ? 1.16 : config.mode === 'accuracy' ? 1.04 : 1.1;
  return levelDifficulty[config.level] * multiplicationDifficulty[config.multiplicationType] * volumeFactor * modeFactor;
};

const cepreDifficulty = (config: CepreConfig) => {
  const volumeFactor = config.amount >= 100 ? 1.32 : config.amount >= 50 ? 1.18 : 1 + config.amount / 160;
  const modeFactor = config.mode === 'simulation' ? 1.18 : config.mode === 'errorReview' ? 1.04 : config.mode === 'diagnostic' ? 1.1 : 1.08;
  return levelDifficulty[config.level] * cepreBlockDifficulty[config.block] * volumeFactor * modeFactor;
};

const anzanDifficulty = (config: AnzanConfig) => {
  const digitFactor = 0.78 + config.digits * 0.24;
  const termFactor = 0.76 + Math.min(config.terms, 60) / 48;
  const speedFactor = config.advanceMode === 'timed' ? Math.max(0.95, 1.95 - config.displayMs / 1250) : 0.92;
  const operationFactor = config.operationMode === 'additionSubtraction' ? 1.2 : 1;
  return digitFactor * termFactor * speedFactor * operationFactor;
};

const doubleX2Difficulty = (config: DoubleX2Config, steps: number) => {
  const startFactor = Math.max(0.85, Math.min(1.5, Math.log10(config.start + 10) / 2.4));
  const stepFactor = 0.85 + Math.min(steps, 60) / 42;
  const limitFactor = config.stepLimit === 'infinite' ? 1.16 : config.stepLimit >= 30 ? 1.1 : config.stepLimit >= 20 ? 1.04 : 0.96;
  return startFactor * stepFactor * limitFactor;
};

const eloFromHistory = (sessions: TrainingSession[], kind?: DrillKind) => {
  const source = kind ? sessions.find((session) => session.kind === kind) : sessions[0];
  if (!source) return 1000;
  return source.metrics.modeElo ?? source.metrics.generalElo ?? source.metrics.elo ?? 1000;
};

const eloCapacity = (speedScore: number, accuracy: number, difficulty: number, kind: DrillKind, sessions: TrainingSession[] = []) => {
  const modeSessions = sessions.filter((session) => session.kind === kind);
  const kFactor = kFactorFor(modeSessions.length);
  const generalStart = eloFromHistory(sessions);
  const modeStart = eloFromHistory(sessions, kind);
  const difficultyRating = clamp(500, 3500, Math.round(780 + difficulty * 520 + (kind === 'multiplicationSprint' ? 90 : 0)));
  const performance = clamp(0, 1, (accuracy * 0.68 + speedScore * 0.32) / 100);
  const expectedGeneral = 1 / (1 + Math.pow(10, (difficultyRating - generalStart) / 400));
  const expectedMode = 1 / (1 + Math.pow(10, (difficultyRating - modeStart) / 400));
  const eloDelta = Math.round(kFactor * (performance - expectedGeneral));
  const modeEloDelta = Math.round(kFactor * (performance - expectedMode));
  const generalElo = clamp(500, 3500, generalStart + eloDelta);
  const modeElo = clamp(500, 3500, modeStart + modeEloDelta);

  return {
    elo: generalElo,
    generalElo,
    modeElo,
    eloDelta,
    modeEloDelta,
    kFactor,
    levelTag: levelFromElo(generalElo),
    streakImpact: eloDelta,
  };
};

const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

const bestRun = (answers: UserAnswer[]) => {
  let current = 0;
  let best = 0;
  answers.forEach((answer) => {
    current = answer.isCorrect ? current + 1 : 0;
    best = Math.max(best, current);
  });
  return best;
};

export const formatCompactNumber = (value: number) => {
  if (Number.isSafeInteger(value) && Math.abs(value) < 1_000_000_000_000) return String(value);
  return value.toExponential(2).replace('+', '');
};

const compactHistory = (history: number[]) => {
  const readable = history.map(formatCompactNumber);
  if (readable.length <= 8) return readable.join(' → ');
  return [...readable.slice(0, 4), '...', ...readable.slice(-3)].join(' → ');
};

const categoryRead = (answers: UserAnswer[]) => {
  const stats = answers.reduce(
    (accumulator, answer) => {
      const label = answer.topic || categoryLabels[answer.category];
      const current = accumulator[label] ?? { label, total: 0, correct: 0, time: 0 };
      current.total += 1;
      current.correct += answer.isCorrect ? 1 : 0;
      current.time += answer.responseTimeMs;
      accumulator[label] = current;
      return accumulator;
    },
    {} as Record<string, { label: string; total: number; correct: number; time: number }>,
  );

  const rankedWeak = Object.values(stats).sort((a, b) => {
    const accuracyA = a.correct / a.total;
    const accuracyB = b.correct / b.total;
    if (accuracyA !== accuracyB) return accuracyA - accuracyB;
    return b.time / b.total - a.time / a.total;
  });

  const rankedBest = Object.values(stats).sort((a, b) => {
    const accuracyA = a.correct / a.total;
    const accuracyB = b.correct / b.total;
    if (accuracyA !== accuracyB) return accuracyB - accuracyA;
    return a.time / a.total - b.time / b.total;
  });

  return { weakest: rankedWeak[0]?.label, best: rankedBest[0]?.label };
};

const enduranceInsight = (answers: UserAnswer[], accuracy: number) => {
  if (answers.length < 50) return 'Sprint corto: usa 50 o 100 preguntas para medir resistencia.';
  if (accuracy < 80) return 'Conviene entrenar precisión antes de subir nivel.';

  const split = Math.floor(answers.length / 2);
  const first = answers.slice(0, split);
  const second = answers.slice(split);
  const firstAvg = average(first.map((item) => item.responseTimeMs));
  const secondAvg = average(second.map((item) => item.responseTimeMs));
  const firstErrors = first.filter((item) => !item.isCorrect).length;
  const secondErrors = second.filter((item) => !item.isCorrect).length;

  if (secondAvg > firstAvg * 1.18 || secondErrors > firstErrors + 2) {
    return `Tu resistencia cae después de la pregunta ${split}. Baja ritmo inicial o entrena bloques de 25.`;
  }

  return 'Tu velocidad es estable: puedes subir dificultad o aumentar variedad.';
};

const baseMetrics = (answers: UserAnswer[], totalTimeMs: number) => {
  const correct = answers.filter((answer) => answer.isCorrect).length;
  const incorrect = answers.length - correct;
  const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const responseTimes = answers.map((answer) => answer.responseTimeMs).filter(Number.isFinite);
  const averageTimeMs = answers.length ? totalTimeMs / answers.length : 0;
  const fastestTimeMs = responseTimes.length ? Math.min(...responseTimes) : 0;
  const slowestTimeMs = responseTimes.length ? Math.max(...responseTimes) : 0;
  const slowestAnswer = answers.find((answer) => answer.responseTimeMs === slowestTimeMs);
  return { correct, incorrect, accuracy, averageTimeMs, fastestTimeMs, slowestTimeMs, slowestAnswer };
};

export const calculateMetrics = (answers: UserAnswer[], totalTimeMs: number, config: TrainingConfig, sessions: TrainingSession[] = []): SessionMetrics => {
  const { correct, incorrect, accuracy, averageTimeMs, fastestTimeMs, slowestTimeMs, slowestAnswer } = baseMetrics(answers, totalTimeMs);
  const targetTime = config.mode === 'speed' ? 3800 : config.mode === 'accuracy' ? 8500 : 6000;
  const paceFactor = Math.max(0, 1 - averageTimeMs / (targetTime * 2));
  const speedScore = Math.round(accuracy * 0.68 + paceFactor * 100 * 0.32);
  const categories = categoryRead(answers);
  const weakestLabel = categories.weakest || 'Operaciones mixtas';
  const bestLabel = categories.best || 'Sin datos';
  const endurance = enduranceInsight(answers, accuracy);
  const capacity = eloCapacity(speedScore, accuracy, operationDifficulty(config), 'operations', sessions);

  const focus: string[] = [];
  if (accuracy < 80) focus.push('Prioriza precisión: responde más lento hasta superar 80%.');
  if (averageTimeMs > targetTime) focus.push(`Reduce tiempo promedio en ${weakestLabel} con bloques de 10 preguntas.`);
  if (config.amount >= 100) focus.push(endurance);
  if (focus.length < 3) focus.push(`Sube gradualmente desde ${levelLabels[config.level]} cuando logres 90%+.`);
  if (focus.length < 3) focus.push('Alterna aritmética, fracciones, porcentajes, series y álgebra para mejorar transferencia.');

  const status = accuracy >= 92 && averageTimeMs <= targetTime ? 'Dominio sólido' : accuracy >= 80 ? 'Buen avance con margen de velocidad' : 'Precisión en riesgo';

  return {
    totalTimeMs,
    averageTimeMs,
    fastestTimeMs,
    slowestTimeMs,
    correct,
    incorrect,
    accuracy,
    speedScore,
    recommendation: focus[0],
    analysis: accuracy >= 90 ? `Alta precisión con ${formatDuration(averageTimeMs)} por pregunta. Mejor área: ${bestLabel}.` : `Tu bloque más débil fue ${weakestLabel}. Prioriza exactitud antes de subir dificultad.`,
    weakestCategory: weakestLabel,
    bestCategory: bestLabel,
    slowestPrompt: slowestAnswer?.prompt ?? '--',
    improvementFocus: focus.slice(0, 3),
    status,
    enduranceInsight: endurance,
    ...capacity,
  };
};

export const calculateMultiplicationMetrics = (answers: UserAnswer[], totalTimeMs: number, config: MultiplicationConfig, sessions: TrainingSession[] = []): SessionMetrics => {
  const { correct, incorrect, accuracy, averageTimeMs, fastestTimeMs, slowestTimeMs, slowestAnswer } = baseMetrics(answers, totalTimeMs);
  const targetTime = config.mode === 'speed' ? 2600 : config.mode === 'accuracy' ? 5200 : 3600;
  const paceFactor = Math.max(0, 1 - averageTimeMs / (targetTime * 2));
  const speedScore = Math.round(accuracy * 0.64 + paceFactor * 100 * 0.36);
  const categories = categoryRead(answers);
  const weakestLabel = categories.weakest || multiplicationTypeLabels[config.multiplicationType];
  const bestLabel = categories.best || 'Sin datos';
  const endurance = enduranceInsight(answers, accuracy);
  const capacity = eloCapacity(speedScore, accuracy, multiplicationSprintDifficulty(config), 'multiplicationSprint', sessions);

  const focus: string[] = [];
  if (accuracy < 85) focus.push('Repite el mismo formato hasta sostener 85% antes de subir dígitos.');
  if (averageTimeMs > targetTime) focus.push(`Entrena ${weakestLabel} en bloques de 20 buscando bajar 0.3 s por pregunta.`);
  if (config.multiplicationType === 'doubleInfinity') focus.push('En doble infinito, memoriza acumulados pares y verifica por duplicación inversa.');
  if (config.multiplicationType === 'chain') focus.push('En encadenadas, agrupa factores fáciles primero: 2x5, 4x25, 8x125.');
  if (focus.length < 3) focus.push('Alterna 1x1, 1x2 y 2x2 para que la velocidad se transfiera.');
  if (focus.length < 3) focus.push('Haz una ronda de 100 cuando superes 90% para medir resistencia.');

  const status =
    accuracy >= 92 && averageTimeMs <= targetTime
      ? 'Multiplicación automática'
      : accuracy >= 85
        ? 'Base rápida en progreso'
        : 'Memoria de producto inestable';

  return {
    totalTimeMs,
    averageTimeMs,
    fastestTimeMs,
    slowestTimeMs,
    correct,
    incorrect,
    accuracy,
    speedScore,
    recommendation: focus[0],
    analysis: accuracy >= 90 ? `Buen dominio de ${bestLabel}. Tiempo promedio: ${formatDuration(averageTimeMs)}.` : `El punto débil fue ${weakestLabel}; vuelve a ese formato antes de subir dificultad.`,
    weakestCategory: weakestLabel,
    bestCategory: bestLabel,
    slowestPrompt: slowestAnswer?.prompt ?? '--',
    improvementFocus: focus.slice(0, 3),
    status,
    enduranceInsight: endurance,
    currentStreak: correct,
    bestStreak: bestRun(answers),
    chainFactorCount: config.multiplicationType === 'chain' ? config.chainFactorCount ?? 3 : undefined,
    ...capacity,
  };
};

export const calculateDoubleX2Metrics = (answers: UserAnswer[], totalTimeMs: number, config: DoubleX2Config, history: number[], sessions: TrainingSession[] = []): SessionMetrics => {
  const steps = Math.max(0, history.length - 1);
  const averageTimeMs = steps ? totalTimeMs / steps : 0;
  const maxValue = Math.max(...history);
  const speedScore = Math.round(Math.max(35, Math.min(100, steps * 4 + Math.max(0, 40 - averageTimeMs / 350))));
  const capacity = eloCapacity(speedScore, 100, doubleX2Difficulty(config, steps), 'doubleX2', sessions);
  const historyPreview = compactHistory(history);

  return {
    totalTimeMs,
    averageTimeMs,
    fastestTimeMs: averageTimeMs,
    slowestTimeMs: averageTimeMs,
    correct: steps,
    incorrect: 0,
    accuracy: 100,
    speedScore,
    recommendation: steps < 10 ? 'Haz una ronda de 10 pasos para crear base de duplicación.' : 'Sube el número inicial o usa límite infinito para resistencia mental.',
    analysis: `Completaste ${steps} paso(s) desde ${config.start}. Valor máximo: ${formatCompactNumber(maxValue)}.`,
    weakestCategory: 'Multiplicar x2',
    bestCategory: 'Duplicación progresiva',
    slowestPrompt: historyPreview,
    improvementFocus: [
      'Mantén el valor anterior como ancla visual antes de duplicar.',
      'Agrupa por potencias de 2 cuando el número crezca.',
      steps >= 20 ? 'Practica precisión verbal: di el número antes de avanzar.' : 'Busca 20 pasos sin romper ritmo.',
    ],
    status: steps >= 20 ? 'Duplicación fluida' : steps >= 10 ? 'Base activa' : 'Inicio medido',
    enduranceInsight: config.stepLimit === 'infinite' ? 'Modo libre: registra cuando cierres una racha significativa.' : `Límite configurado: ${config.stepLimit} pasos.`,
    completed: steps,
    maxValue,
    historyPreview,
    currentStreak: steps,
    bestStreak: steps,
    ...capacity,
  };
};

export const calculateCepreMetrics = (answers: UserAnswer[], totalTimeMs: number, config: CepreConfig, sessions: TrainingSession[] = []): SessionMetrics => {
  const { correct, incorrect, accuracy, averageTimeMs, fastestTimeMs, slowestTimeMs, slowestAnswer } = baseMetrics(answers, totalTimeMs);
  const targetTime = config.mode === 'simulation' ? 78000 : 62000;
  const paceFactor = Math.max(0, 1 - averageTimeMs / (targetTime * 1.8));
  const speedScore = Math.round(accuracy * 0.72 + paceFactor * 100 * 0.28);
  const categories = categoryRead(answers);
  const weakestLabel = categories.weakest || cepreBlockLabels[config.block];
  const bestLabel = categories.best || 'Sin datos';
  const endurance = enduranceInsight(answers, accuracy);
  const capacity = eloCapacity(speedScore, accuracy, cepreDifficulty(config), 'cepreExam', sessions);

  const focus: string[] = [];
  if (accuracy < 80) focus.push('Baja el ritmo y repara errores antes de subir nivel o volumen.');
  if (weakestLabel) focus.push(`Crea un bloque de 15 preguntas solo de ${weakestLabel}.`);
  if (config.amount >= 50) focus.push(endurance);
  if (focus.length < 3) focus.push('Alterna números, operaciones y álgebra para mejorar transferencia real.');
  if (focus.length < 3) focus.push('Registra cada error por causa: cálculo, signo, fórmula o planteamiento.');

  const status =
    accuracy >= 90 && averageTimeMs <= targetTime
      ? 'Perfil competitivo de examen'
      : accuracy >= 80
        ? 'Base sólida, falta presión'
        : 'Riesgo alto de precisión';

  return {
    totalTimeMs,
    averageTimeMs,
    fastestTimeMs,
    slowestTimeMs,
    correct,
    incorrect,
    accuracy,
    speedScore,
    recommendation: focus[0],
    analysis: accuracy >= 88 ? `Buen control de examen. Mejor bloque: ${bestLabel}.` : `El cuello de botella fue ${weakestLabel}; revisa explicación y repite microtema.`,
    weakestCategory: weakestLabel,
    bestCategory: bestLabel,
    slowestPrompt: slowestAnswer?.prompt ?? '--',
    improvementFocus: focus.slice(0, 3),
    status,
    enduranceInsight: endurance,
    ...capacity,
  };
};

/** Métricas agregadas de una sesión Anzan multi-ronda (1 UserAnswer por ronda). */
export const calculateAnzanSessionMetrics = (
  answers: UserAnswer[],
  totalTimeMs: number,
  config: AnzanConfig,
  roundSnapshots: Array<Pick<AnzanConfig, 'digits' | 'terms' | 'displayMs'>>,
  sessions: TrainingSession[] = [],
): SessionMetrics => {
  const rounds = answers.length;
  if (rounds <= 1 && answers[0]) return { ...calculateAnzanMetrics(answers[0], totalTimeMs, config, sessions), rounds: 1 };

  const correct = answers.filter((answer) => answer.isCorrect).length;
  const incorrect = rounds - correct;
  const accuracy = rounds ? Math.round((correct / rounds) * 100) : 0;
  const recallTimes = answers.map((answer) => answer.responseTimeMs).filter(Number.isFinite);
  const averageTimeMs = average(recallTimes);
  const minDisplayMs = roundSnapshots.length ? Math.min(...roundSnapshots.map((snapshot) => snapshot.displayMs)) : config.displayMs;
  const difficulty = roundSnapshots.length
    ? average(roundSnapshots.map((snapshot) => anzanDifficulty({ ...config, ...snapshot })))
    : anzanDifficulty(config);
  const paceFactor = Math.max(0, 1 - averageTimeMs / Math.max(1900, config.digits * config.terms * 390 * 1.75));
  const speedScore = Math.round(accuracy * 0.66 + paceFactor * 100 * 0.34);
  const capacity = eloCapacity(speedScore, accuracy, difficulty, 'flashAnzan', sessions);
  const streak = bestRun(answers);
  const operationLabel = config.operationMode === 'additionSubtraction' ? 'sumas y restas' : 'sumas';

  const improvementFocus = accuracy >= 80
    ? [
        `Sostuviste ${correct}/${rounds} rondas. Sube a ${Math.min(config.digits + 1, 5)} dígitos o baja la aparición 100 ms.`,
        'Agrupa en bloques de 10/50/100; no repitas la secuencia completa.',
        'Mantén mirada central: el número llega a ti, no al revés.',
      ]
    : [
        `Cerraste ${correct}/${rounds}. Repite esta configuración hasta sostener 80%.`,
        'Visualiza acumulados parciales en lugar de repetir toda la secuencia.',
        config.operationMode === 'additionSubtraction' ? 'Separa positivos y negativos antes del total.' : 'Agrupa por decenas para acelerar.',
      ];

  return {
    totalTimeMs,
    averageTimeMs,
    fastestTimeMs: recallTimes.length ? Math.min(...recallTimes) : 0,
    slowestTimeMs: recallTimes.length ? Math.max(...recallTimes) : 0,
    correct,
    incorrect,
    accuracy,
    speedScore,
    recommendation: improvementFocus[0],
    analysis: `Flash Anzan ${rounds} rondas de ${operationLabel}: ${correct} correctas, mejor racha ${streak}. Aparición mínima: ${minDisplayMs} ms.`,
    weakestCategory: 'Flash Anzan',
    bestCategory: accuracy >= 60 ? 'Memoria operativa' : 'Pendiente',
    slowestPrompt: `${config.terms} términos · ${config.digits} dígito(s)`,
    improvementFocus,
    status: accuracy >= 80 ? 'Memoria activa sólida' : accuracy >= 50 ? 'Base en construcción' : 'Precisión en riesgo',
    enduranceInsight: rounds >= 5 ? 'Buena resistencia de sesión: evalúa subir dígitos.' : 'Prueba 5+ rondas para medir estabilidad.',
    currentStreak: streak,
    bestStreak: streak,
    rounds,
    minDisplayMs,
    ...capacity,
  };
};

/** Métricas de Contrarreloj: el héroe es el score (aciertos en tiempo fijo). */
export const calculateBlitzMetrics = (
  answers: UserAnswer[],
  totalTimeMs: number,
  config: { level: TrainingConfig['level']; category: TrainingConfig['category']; durationSec: number },
  sessions: TrainingSession[] = [],
): SessionMetrics => {
  const { correct, incorrect, accuracy, averageTimeMs, fastestTimeMs, slowestTimeMs, slowestAnswer } = baseMetrics(answers, totalTimeMs);
  const paceFactor = Math.max(0, 1 - averageTimeMs / 8000);
  const speedScore = Math.round(accuracy * 0.55 + paceFactor * 100 * 0.45);
  const durationFactor = config.durationSec <= 60 ? 1.15 : config.durationSec <= 120 ? 1.05 : 0.97;
  const difficulty = levelDifficulty[config.level] * (categoryDifficulty[config.category] ?? 1.25) * durationFactor;
  const capacity = eloCapacity(speedScore, accuracy, difficulty, 'blitz', sessions);
  const categories = categoryRead(answers);
  const perMinute = totalTimeMs > 0 ? Math.round((correct / (totalTimeMs / 60000)) * 10) / 10 : 0;

  return {
    totalTimeMs,
    averageTimeMs,
    fastestTimeMs,
    slowestTimeMs,
    correct,
    incorrect,
    accuracy,
    speedScore,
    recommendation: accuracy < 75
      ? 'Vas rápido pero impreciso: cada fallo regala tiempo. Apunta a 85%+.'
      : 'Score sólido. La revancha inmediata es donde se baten récords.',
    analysis: `${correct} aciertos en ${Math.round(totalTimeMs / 1000)} s (${perMinute}/min) con ${accuracy}% de precisión.`,
    weakestCategory: categories.weakest || 'Mixto',
    bestCategory: categories.best || 'Sin datos',
    slowestPrompt: slowestAnswer?.prompt ?? '--',
    improvementFocus: [
      accuracy < 75 ? 'Precisión primero: un fallo cuesta más que dos segundos de pausa.' : 'Sube de nivel cuando el score se estanque dos sesiones.',
      `Tu punto lento: ${categories.weakest || 'mixto'}. Un bloque corto ahí sube el score.`,
      'Compara solo contra el mismo preset de duración.',
    ],
    status: accuracy >= 85 ? 'Ritmo competitivo' : accuracy >= 70 ? 'Velocidad con fugas' : 'Calibrando ritmo',
    enduranceInsight: config.durationSec >= 180 ? 'Buena resistencia si el ritmo del último minuto igualó al primero.' : 'Prueba 180 s para medir resistencia.',
    currentStreak: correct,
    bestStreak: bestRun(answers),
    completed: correct,
    ...capacity,
  };
};

/** Métricas de Memoria de Dígitos: el héroe es el span máximo alcanzado. */
export const calculateDigitSpanMetrics = (
  answers: UserAnswer[],
  totalTimeMs: number,
  spanHistory: number[],
  sessions: TrainingSession[] = [],
): SessionMetrics => {
  const { correct, incorrect, accuracy, averageTimeMs, fastestTimeMs, slowestTimeMs } = baseMetrics(answers, totalTimeMs);
  const peakSpan = spanHistory.length ? Math.max(...spanHistory) : 0;
  const endSpan = spanHistory[spanHistory.length - 1] ?? 0;
  const avgSpan = spanHistory.length ? spanHistory.reduce((sum, value) => sum + value, 0) / spanHistory.length : 0;
  const paceFactor = Math.max(0, 1 - averageTimeMs / 7000);
  const speedScore = Math.round(accuracy * 0.6 + paceFactor * 100 * 0.4);
  const difficulty = 0.6 + avgSpan * 0.11;
  const capacity = eloCapacity(speedScore, accuracy, difficulty, 'digitSpan', sessions);

  return {
    totalTimeMs,
    averageTimeMs,
    fastestTimeMs,
    slowestTimeMs,
    correct,
    incorrect,
    accuracy,
    speedScore,
    recommendation: peakSpan >= 8
      ? 'Span de élite: agrupa en bloques de 3-4 dígitos para ir más lejos.'
      : 'Agrupa los dígitos de 2 en 2 o de 3 en 3: la memoria retiene bloques, no cifras.',
    analysis: `Span máximo: ${peakSpan} dígitos. Cerraste en ${endSpan}. ${correct}/${answers.length} rondas correctas.`,
    weakestCategory: 'Memoria de dígitos',
    bestCategory: peakSpan >= 7 ? 'Retención visual' : 'En construcción',
    slowestPrompt: '--',
    improvementFocus: [
      'Visualiza el número como imagen, no como lista de cifras.',
      'Agrupa: 4823 se retiene mejor como 48·23.',
      peakSpan >= 7 ? 'Reta con menos tiempo de exposición conforme domines.' : 'La media humana es 7±2: vas en camino.',
    ],
    status: peakSpan >= 9 ? 'Memoria excepcional' : peakSpan >= 7 ? 'Memoria sólida' : 'Base en construcción',
    enduranceInsight: 'El span crece con práctica diaria corta, no con maratones.',
    bestStreak: bestRun(answers),
    peakRung: peakSpan,
    endRung: endSpan,
    avgRung: Math.round(avgSpan * 10) / 10,
    ...capacity,
  };
};

/** Métricas de una sesión de flash cards (autoevaluación Leitner). */
export const calculateFlashCardsMetrics = (answers: UserAnswer[], totalTimeMs: number, sessions: TrainingSession[] = []): SessionMetrics => {
  const correct = answers.filter((answer) => answer.isCorrect).length;
  const incorrect = answers.length - correct;
  const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const times = answers.map((answer) => answer.responseTimeMs).filter(Number.isFinite);
  const averageTimeMs = average(times);
  const paceFactor = Math.max(0, 1 - averageTimeMs / 9000);
  const speedScore = Math.round(accuracy * 0.7 + paceFactor * 100 * 0.3);
  const capacity = eloCapacity(speedScore, accuracy, 0.9, 'flashCards', sessions);

  return {
    totalTimeMs,
    averageTimeMs,
    fastestTimeMs: times.length ? Math.min(...times) : 0,
    slowestTimeMs: times.length ? Math.max(...times) : 0,
    correct,
    incorrect,
    accuracy,
    speedScore,
    recommendation: accuracy >= 85 ? 'Dominio alto: añade un mazo nuevo.' : 'Repite mañana: la caja 1 vuelve a aparecer.',
    analysis: `${correct}/${answers.length} tarjetas sabidas. Las falladas vuelven a la caja 1 y reaparecen pronto.`,
    weakestCategory: 'Memorización',
    bestCategory: accuracy >= 70 ? 'Recuerdo automático' : 'En construcción',
    slowestPrompt: '--',
    improvementFocus: [
      accuracy >= 85 ? 'Añade un mazo nuevo manteniendo el repaso diario.' : 'Prioriza los mazos con más cartas en caja 1.',
      'Sesiones cortas diarias ganan a maratones: 15 tarjetas al día.',
      'Di la respuesta en voz alta antes de voltear: fuerza el recuerdo.',
    ],
    status: accuracy >= 85 ? 'Memoria consolidada' : accuracy >= 60 ? 'Aprendizaje activo' : 'Repaso necesario',
    enduranceInsight: 'La repetición espaciada hace el trabajo: vuelve mañana.',
    bestStreak: bestRun(answers),
    ...capacity,
  };
};

export const calculateAnzanMetrics = (answer: UserAnswer, totalTimeMs: number, config: AnzanConfig, sessions: TrainingSession[] = []): SessionMetrics => {
  const correct = answer.isCorrect ? 1 : 0;
  const incorrect = answer.isCorrect ? 0 : 1;
  const accuracy = answer.isCorrect ? 100 : 0;
  const revealTimeMs = config.advanceMode === 'timed' ? config.displayMs * config.terms : totalTimeMs - answer.responseTimeMs;
  const recallTimeMs = answer.responseTimeMs;
  const targetRecall = config.digits * config.terms * 390;
  const paceFactor = Math.max(0, 1 - recallTimeMs / Math.max(1900, targetRecall * 1.75));
  const speedScore = Math.round(accuracy * 0.66 + paceFactor * 100 * 0.34);
  const capacity = eloCapacity(speedScore, accuracy, anzanDifficulty(config), 'flashAnzan', sessions);
  const operationLabel = config.operationMode === 'additionSubtraction' ? 'sumas y restas' : 'sumas';

  const improvementFocus = answer.isCorrect
    ? [
        `Sube a ${Math.min(config.digits + 1, 5)} dígitos cuando sostengas 3 aciertos seguidos.`,
        config.advanceMode === 'manual' ? 'Pasa a aparición automática para entrenar memoria visual.' : 'Reduce el tiempo de aparición en 100 ms.',
        'Mantén mirada central y agrupa números en bloques mentales.',
      ]
    : [
        `Repite ${config.terms} términos de ${config.digits} dígito(s) hasta lograr 80% de precisión.`,
        'Visualiza acumulados parciales en lugar de repetir toda la secuencia.',
        config.operationMode === 'additionSubtraction' ? 'Separa positivos y negativos antes del total final.' : 'Agrupa por decenas para acelerar.',
      ];

  return {
    totalTimeMs,
    averageTimeMs: recallTimeMs,
    fastestTimeMs: recallTimeMs,
    slowestTimeMs: recallTimeMs,
    correct,
    incorrect,
    accuracy,
    speedScore,
    recommendation: improvementFocus[0],
    analysis: answer.isCorrect
      ? `Resolviste Flash Anzan de ${config.terms} términos con ${operationLabel}. Tiempo de respuesta: ${formatDuration(recallTimeMs)}.`
      : `Fallaste la secuencia de ${operationLabel}. El cuello de botella está en retención del acumulado.`,
    weakestCategory: 'Flash Anzan',
    bestCategory: answer.isCorrect ? 'Memoria operativa' : 'Pendiente',
    slowestPrompt: `${config.terms} términos - ${config.digits} dígito(s) - ${formatDuration(revealTimeMs)} de exposición`,
    improvementFocus,
    status: answer.isCorrect ? 'Memoria activa sólida' : 'Precisión en riesgo',
    enduranceInsight: 'Flash Anzan mide memoria operativa; repite 3 rondas para ver estabilidad.',
    ...capacity,
  };
};
