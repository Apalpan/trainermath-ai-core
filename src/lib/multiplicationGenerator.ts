import type { ChainFactorCount, Exercise, Level, MultiplicationConfig, MultiplicationType } from '../types';
import { numericChoices, pick, rand } from './exerciseGenerator';

const levelRanges: Record<Level, { oneDigitMax: number; twoDigitMin: number; twoDigitMax: number; doubleStartMax: number }> = {
  level1: { oneDigitMax: 9, twoDigitMin: 10, twoDigitMax: 24, doubleStartMax: 20 },
  level2: { oneDigitMax: 12, twoDigitMin: 12, twoDigitMax: 48, doubleStartMax: 40 },
  level3: { oneDigitMax: 15, twoDigitMin: 16, twoDigitMax: 80, doubleStartMax: 90 },
  level4: { oneDigitMax: 19, twoDigitMin: 20, twoDigitMax: 140, doubleStartMax: 160 },
  level5: { oneDigitMax: 25, twoDigitMin: 25, twoDigitMax: 250, doubleStartMax: 320 },
};

const concreteTypes: Exclude<MultiplicationType, 'mixed'>[] = ['oneByOne', 'oneByTwo', 'twoByTwo', 'chain', 'doubleInfinity'];

const createMultiplicationExercise = (
  prompt: string,
  answer: number,
  topic: string,
  microtopic: string,
  explanation: string,
  scale = 3,
): Exercise => ({
  id: crypto.randomUUID(),
  category: 'multiplication',
  prompt,
  answer,
  answerLabel: String(answer),
  choices: numericChoices(answer, String(answer), scale),
  explanation,
  trainer: 'math',
  topic,
  microtopic,
  questionType: 'calculo',
  expectedError: 'calculo',
  targetTimeSec: 5,
});

const byType = (type: Exclude<MultiplicationType, 'mixed'>, level: Level, index: number, chainFactorCount: ChainFactorCount): Exercise => {
  const range = levelRanges[level];

  if (type === 'oneByOne') {
    const a = rand(2, range.oneDigitMax);
    const b = rand(2, range.oneDigitMax);
    const answer = a * b;
    return createMultiplicationExercise(`${a} × ${b}`, answer, 'Multiplicación 1x1', 'Tabla mental', `${a} × ${b} = ${answer}`, 2);
  }

  if (type === 'oneByTwo') {
    const a = rand(2, range.oneDigitMax);
    const b = rand(range.twoDigitMin, range.twoDigitMax);
    const answer = a * b;
    return createMultiplicationExercise(`${a} × ${b}`, answer, 'Multiplicación 1x2', 'Distribución rápida', `${a} × ${b} = ${answer}`, Math.max(4, a));
  }

  if (type === 'twoByTwo') {
    const a = rand(range.twoDigitMin, range.twoDigitMax);
    const b = rand(range.twoDigitMin, range.twoDigitMax);
    const answer = a * b;
    return createMultiplicationExercise(`${a} × ${b}`, answer, 'Multiplicación 2x2', 'Producto de dos cifras', `${a} × ${b} = ${answer}`, Math.max(8, Math.round(Math.min(a, b) / 2)));
  }

  if (type === 'chain') {
    const maxFactor = level === 'level1' ? 6 : level === 'level2' ? 7 : level === 'level3' ? 8 : 9;
    const terms = Array.from({ length: chainFactorCount }, () => rand(1, maxFactor));
    const answer = terms.reduce((product, value) => product * value, 1);
    return createMultiplicationExercise(terms.join(' × '), answer, 'Multiplicación encadenada', `${terms.length} factores`, `${terms.join(' × ')} = ${answer}`, 8);
  }

  const seed = rand(2, range.doubleStartMax);
  const step = Math.max(1, Math.min(8, index + 1));
  const base = seed * Math.pow(2, Math.min(step - 1, 6));
  const answer = base * 2;
  return createMultiplicationExercise(`Doble de ${base}`, answer, 'Doble infinito', 'Duplicación progresiva', `${base} × 2 = ${answer}`, Math.max(4, Math.round(base * 0.08)));
};

export const generateMultiplicationExercises = (config: MultiplicationConfig): Exercise[] => {
  const seen = new Set<string>();
  const exercises: Exercise[] = [];
  let attempts = 0;
  const chainFactorCount = config.chainFactorCount ?? 3;

  while (exercises.length < config.amount && attempts < Math.max(100, config.amount * 80)) {
    attempts += 1;
    const type = config.multiplicationType === 'mixed' ? pick(concreteTypes) : config.multiplicationType;
    const exercise = byType(type, config.level, exercises.length, chainFactorCount);
    const signature = `${exercise.topic}|${exercise.prompt}|${exercise.answerLabel}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    exercises.push(exercise);
  }

  while (exercises.length < config.amount) {
    const type = config.multiplicationType === 'mixed' ? pick(concreteTypes) : config.multiplicationType;
    exercises.push(byType(type, config.level, exercises.length, chainFactorCount));
  }

  return exercises;
};
