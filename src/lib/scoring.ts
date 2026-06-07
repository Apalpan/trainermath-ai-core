import type { AnzanConfig, CepreConfig, DrillKind, SessionMetrics, TrainingConfig, UserAnswer } from '../types';
import { categoryLabels, cepreBlockLabels, levelLabels } from '../types';

export const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((milliseconds % 1000) / 100);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
};

const levelFromElo = (elo: number) => {
  if (elo >= 1750) return 'Elite mental';
  if (elo >= 1520) return 'Avanzado rápido';
  if (elo >= 1300) return 'Competitivo';
  if (elo >= 1100) return 'En desarrollo';
  return 'Base inicial';
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
  geometry: 1.32,
  trigonometry: 1.28,
  statistics: 1.12,
  probability: 1.2,
  combinatorics: 1.3,
  reasoning: 1.32,
  mixed: 1.42,
};

const cepreBlockDifficulty: Record<CepreConfig['block'], number> = {
  numbers: 1.12,
  algebra: 1.34,
  geometry: 1.36,
  readingComprehension: 1.18,
  readingInterpretive: 1.26,
  readingCritical: 1.34,
  mixed: 1.48,
};

const operationDifficulty = (config: TrainingConfig) => {
  const volumeFactor = config.amount >= 100 ? 1.3 : config.amount >= 50 ? 1.16 : 1 + config.amount / 180;
  const modeFactor = config.mode === 'speed' ? 1.12 : config.mode === 'accuracy' ? 1.04 : 1.08;
  return levelDifficulty[config.level] * categoryDifficulty[config.category] * volumeFactor * modeFactor;
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

const capacityFrom = (speedScore: number, accuracy: number, difficulty: number, kind: DrillKind) => {
  const base = kind === 'flashAnzan' ? 820 : kind === 'cepreExam' ? 800 : 780;
  const elo = Math.round(base + speedScore * 4.7 + accuracy * 2.15 + difficulty * 155);
  return {
    elo,
    levelTag: levelFromElo(elo),
    streakImpact: Math.max(-30, Math.min(38, Math.round((speedScore - 68) * difficulty * 0.56))),
  };
};

const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

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

export const calculateMetrics = (answers: UserAnswer[], totalTimeMs: number, config: TrainingConfig): SessionMetrics => {
  const { correct, incorrect, accuracy, averageTimeMs, fastestTimeMs, slowestTimeMs, slowestAnswer } = baseMetrics(answers, totalTimeMs);
  const targetTime = config.mode === 'speed' ? 3800 : config.mode === 'accuracy' ? 8500 : 6000;
  const paceFactor = Math.max(0, 1 - averageTimeMs / (targetTime * 2));
  const speedScore = Math.round(accuracy * 0.68 + paceFactor * 100 * 0.32);
  const categories = categoryRead(answers);
  const weakestLabel = categories.weakest || 'Operaciones mixtas';
  const bestLabel = categories.best || 'Sin datos';
  const endurance = enduranceInsight(answers, accuracy);
  const capacity = capacityFrom(speedScore, accuracy, operationDifficulty(config), 'operations');

  const focus: string[] = [];
  if (accuracy < 80) focus.push('Prioriza precisión: responde más lento hasta superar 80%.');
  if (averageTimeMs > targetTime) focus.push(`Reduce tiempo promedio en ${weakestLabel} con bloques de 10 preguntas.`);
  if (config.amount >= 100) focus.push(endurance);
  if (focus.length < 3) focus.push(`Sube gradualmente desde ${levelLabels[config.level]} cuando logres 90%+.`);
  if (focus.length < 3) focus.push('Alterna aritmética, álgebra, geometría y razonamiento para mejorar transferencia.');

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

export const calculateCepreMetrics = (answers: UserAnswer[], totalTimeMs: number, config: CepreConfig): SessionMetrics => {
  const { correct, incorrect, accuracy, averageTimeMs, fastestTimeMs, slowestTimeMs, slowestAnswer } = baseMetrics(answers, totalTimeMs);
  const hasReading = config.block.startsWith('reading') || answers.some((answer) => answer.questionType === 'lectura');
  const targetTime = hasReading ? 95000 : config.mode === 'simulation' ? 78000 : 62000;
  const paceFactor = Math.max(0, 1 - averageTimeMs / (targetTime * 1.8));
  const speedScore = Math.round(accuracy * 0.72 + paceFactor * 100 * 0.28);
  const categories = categoryRead(answers);
  const weakestLabel = categories.weakest || cepreBlockLabels[config.block];
  const bestLabel = categories.best || 'Sin datos';
  const endurance = enduranceInsight(answers, accuracy);
  const capacity = capacityFrom(speedScore, accuracy, cepreDifficulty(config), 'cepreExam');

  const focus: string[] = [];
  if (accuracy < 80) focus.push('Baja el ritmo y repara errores antes de subir nivel o volumen.');
  if (weakestLabel) focus.push(`Crea un bloque de 15 preguntas solo de ${weakestLabel}.`);
  if (hasReading) focus.push('En lectura, subraya tesis, evidencia y conclusión antes de elegir alternativa.');
  if (config.amount >= 50) focus.push(endurance);
  if (focus.length < 3) focus.push('Alterna números, álgebra, geometría y lectura para simular transferencia real de examen.');
  if (focus.length < 3) focus.push('Registra cada error por causa: cálculo, signo, fórmula, lectura o planteamiento.');

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

export const calculateAnzanMetrics = (answer: UserAnswer, totalTimeMs: number, config: AnzanConfig): SessionMetrics => {
  const correct = answer.isCorrect ? 1 : 0;
  const incorrect = answer.isCorrect ? 0 : 1;
  const accuracy = answer.isCorrect ? 100 : 0;
  const revealTimeMs = config.advanceMode === 'timed' ? config.displayMs * config.terms : totalTimeMs - answer.responseTimeMs;
  const recallTimeMs = answer.responseTimeMs;
  const targetRecall = config.digits * config.terms * 390;
  const paceFactor = Math.max(0, 1 - recallTimeMs / Math.max(1900, targetRecall * 1.75));
  const speedScore = Math.round(accuracy * 0.66 + paceFactor * 100 * 0.34);
  const difficulty = anzanDifficulty(config);
  const capacity = capacityFrom(speedScore, accuracy, difficulty, 'flashAnzan');
  const operationLabel = config.operationMode === 'additionSubtraction' ? 'sumas y restas' : 'sumas';

  const improvementFocus = answer.isCorrect
    ? [
        `Sube a ${Math.min(config.digits + 1, 5)} dígitos cuando sostengas 3 aciertos seguidos.`,
        config.advanceMode === 'manual' ? 'Pasa a aparición automática para entrenar memoria visual.' : 'Reduce el tiempo de aparición en 100 ms.',
        'Mantén lectura central y agrupa números en bloques mentales.',
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
