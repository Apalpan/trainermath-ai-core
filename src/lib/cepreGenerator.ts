import type { CepreBlock, CepreConfig, Exercise, Level } from '../types';
import { fractionText, gcd, numericChoices, pick, rand } from './exerciseGenerator';

const levelScale: Record<Level, number> = {
  level1: 1,
  level2: 1.35,
  level3: 1.75,
  level4: 2.25,
  level5: 2.8,
};

const createCepreExercise = (exercise: Omit<Exercise, 'id' | 'trainer'>): Exercise => ({
  ...exercise,
  id: crypto.randomUUID(),
  trainer: 'cepre',
});

const numberProblem = (level: Level): Exercise => {
  const scale = levelScale[level];
  const type = pick(['fraction', 'percentage', 'sets', 'mcm', 'combined', 'average', 'series', 'ratio'] as const);

  if (type === 'fraction') {
    const denominator = rand(6, Math.round(12 * scale));
    const numerator = rand(2, denominator - 2);
    const value = rand(24, Math.round(80 * scale));
    const answer = Math.round((value * numerator) / denominator);
    return createCepreExercise({
      category: 'fractions',
      block: 'numbers',
      topic: 'Fracciones',
      microtopic: 'Parte de un total',
      questionType: 'problema',
      skill: 'Traducir fracción a operación directa',
      expectedError: 'planteamiento',
      targetTimeSec: 70,
      prompt: `De ${value} elementos, ${fractionText(numerator, denominator)} cumple una condición. ¿Cuántos cumplen?`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 3),
      explanation: `${value} × ${numerator}/${denominator} = ${answer}.`,
    });
  }

  if (type === 'percentage') {
    const base = rand(12, Math.round(45 * scale)) * 10;
    const percent = pick([10, 12, 15, 20, 25, 30, 40, 50]);
    const answer = (base * percent) / 100;
    return createCepreExercise({
      category: 'percentages',
      block: 'numbers',
      topic: 'Porcentajes',
      microtopic: 'Porcentaje de una cantidad',
      questionType: 'calculo',
      skill: 'Calcular porcentaje mentalmente',
      expectedError: 'calculo',
      targetTimeSec: 55,
      prompt: `¿Cuál es el ${percent}% de ${base}?`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 5),
      explanation: `${base} × ${percent}/100 = ${answer}.`,
    });
  }

  if (type === 'sets') {
    const a = rand(20, Math.round(50 * scale));
    const b = rand(18, Math.round(45 * scale));
    const both = rand(5, Math.min(a, b, 22));
    const answer = a + b - both;
    return createCepreExercise({
      category: 'combined',
      block: 'numbers',
      topic: 'Conjuntos',
      microtopic: 'Unión de dos conjuntos',
      questionType: 'problema',
      skill: 'Usar inclusión-exclusión',
      expectedError: 'formula',
      targetTimeSec: 85,
      prompt: `En un grupo, ${a} pertenecen a A, ${b} pertenecen a B y ${both} a ambos. ¿Cuántos pertenecen al menos a uno?`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 4),
      explanation: `A ∪ B = ${a} + ${b} - ${both} = ${answer}.`,
    });
  }

  if (type === 'mcm') {
    const a = pick([6, 8, 9, 10, 12, 15]);
    const b = pick([8, 12, 14, 15, 18, 20]);
    const answer = Math.abs(a * b) / gcd(a, b);
    return createCepreExercise({
      category: 'divisibility',
      block: 'numbers',
      topic: 'Divisibilidad',
      microtopic: 'MCM',
      questionType: 'calculo',
      skill: 'Identificar múltiplos comunes',
      expectedError: 'calculo',
      targetTimeSec: 60,
      prompt: `MCM(${a}, ${b})`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 6),
      explanation: `El menor múltiplo común de ${a} y ${b} es ${answer}.`,
    });
  }

  if (type === 'average') {
    const a = rand(8, Math.round(20 * scale));
    const b = rand(8, Math.round(20 * scale));
    const c = rand(8, Math.round(20 * scale));
    const answer = Math.round((a + b + c) / 3);
    return createCepreExercise({
      category: 'averages',
      block: 'numbers',
      topic: 'Promedios',
      microtopic: 'Media aritmética',
      questionType: 'calculo',
      skill: 'Sumar y dividir por la cantidad de datos',
      expectedError: 'calculo',
      targetTimeSec: 55,
      prompt: `Promedio de ${a}, ${b} y ${c}`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 3),
      explanation: `(${a} + ${b} + ${c}) ÷ 3 = ${answer}.`,
    });
  }

  if (type === 'series') {
    const start = rand(2, 24);
    const step = rand(2, Math.round(9 * scale));
    const answer = start + step * 4;
    const series = [start, start + step, start + step * 2, start + step * 3];
    return createCepreExercise({
      category: 'series',
      block: 'numbers',
      topic: 'Series numéricas',
      microtopic: 'Diferencia constante',
      questionType: 'calculo',
      skill: 'Detectar patrón de avance',
      expectedError: 'planteamiento',
      targetTimeSec: 50,
      prompt: `${series.join(', ')}, ?`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), step),
      explanation: `La diferencia es ${step}. El siguiente término es ${answer}.`,
    });
  }

  if (type === 'ratio') {
    const a = rand(2, 6);
    const b = rand(3, 9);
    const k = rand(4, Math.round(10 * scale));
    const total = (a + b) * k;
    const answer = b * k;
    return createCepreExercise({
      category: 'ratios',
      block: 'numbers',
      topic: 'Razones',
      microtopic: 'Reparto proporcional',
      questionType: 'problema',
      skill: 'Convertir razón a partes',
      expectedError: 'planteamiento',
      targetTimeSec: 80,
      prompt: `A:B = ${a}:${b}. Si A+B=${total}, halla B.`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 4),
      explanation: `${a + b} partes = ${total}; 1 parte = ${k}; B = ${b} × ${k} = ${answer}.`,
    });
  }

  const x = rand(8, Math.round(30 * scale));
  const y = rand(3, 12);
  const z = rand(6, Math.round(35 * scale));
  const answer = x * y + z;
  return createCepreExercise({
    category: 'combined',
    block: 'numbers',
    topic: 'Operaciones combinadas',
    microtopic: 'Jerarquía de operaciones',
    questionType: 'calculo',
    skill: 'Aplicar prioridad de multiplicación',
    expectedError: 'calculo',
    targetTimeSec: 50,
    prompt: `${z} + ${x} × ${y}`,
    answer,
    answerLabel: String(answer),
    choices: numericChoices(answer, String(answer), 5),
    explanation: `Primero ${x} × ${y} = ${x * y}; luego + ${z} = ${answer}.`,
  });
};

const algebraProblem = (level: Level): Exercise => {
  const scale = levelScale[level];
  const type = pick(['linear', 'system', 'notable', 'factor', 'polynomial', 'fractionalEquation'] as const);

  if (type === 'linear') {
    const x = rand(2, Math.round(12 * scale));
    const a = rand(2, Math.round(6 * scale));
    const b = rand(3, Math.round(18 * scale));
    const total = a * x + b;
    return createCepreExercise({
      category: 'algebra',
      block: 'algebra',
      topic: 'Ecuaciones de primer grado',
      microtopic: 'Despeje lineal',
      questionType: 'calculo',
      skill: 'Despejar x',
      expectedError: 'signo',
      targetTimeSec: 65,
      prompt: `${a}x + ${b} = ${total}. Halla x.`,
      answer: x,
      answerLabel: String(x),
      choices: numericChoices(x, String(x), 2),
      explanation: `x = (${total} - ${b}) ÷ ${a} = ${x}.`,
    });
  }

  if (type === 'system') {
    const x = rand(1, Math.round(8 * scale));
    const y = rand(1, Math.round(8 * scale));
    const sum = x + y;
    const diff = x - y;
    return createCepreExercise({
      category: 'algebra',
      block: 'algebra',
      topic: 'Sistemas de ecuaciones',
      microtopic: 'Suma y diferencia',
      questionType: 'problema',
      skill: 'Resolver sistema rápido',
      expectedError: 'planteamiento',
      targetTimeSec: 95,
      prompt: `x + y = ${sum} y x - y = ${diff}. Halla x.`,
      answer: x,
      answerLabel: String(x),
      choices: numericChoices(x, String(x), 2),
      explanation: `Sumando ecuaciones: 2x = ${sum + diff}; x = ${x}.`,
    });
  }

  if (type === 'notable') {
    const a = rand(4, Math.round(12 * scale));
    const b = rand(2, Math.round(8 * scale));
    const answer = a * a - b * b;
    return createCepreExercise({
      category: 'algebra',
      block: 'algebra',
      topic: 'Productos notables',
      microtopic: 'Diferencia de cuadrados',
      questionType: 'calculo',
      skill: 'Aplicar (a+b)(a-b)',
      expectedError: 'formula',
      targetTimeSec: 60,
      prompt: `(${a}+${b})(${a}-${b})`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 6),
      explanation: `a² - b² = ${a}² - ${b}² = ${answer}.`,
    });
  }

  if (type === 'factor') {
    const root = rand(2, Math.round(8 * scale));
    return createCepreExercise({
      category: 'algebra',
      block: 'algebra',
      topic: 'Factorización',
      microtopic: 'Raíz de factor lineal',
      questionType: 'calculo',
      skill: 'Leer factor igualado a cero',
      expectedError: 'signo',
      targetTimeSec: 55,
      prompt: `Si (x - ${root})(x + 3) = 0, una raíz positiva es`,
      answer: root,
      answerLabel: String(root),
      choices: numericChoices(root, String(root), 2),
      explanation: `x - ${root} = 0, por tanto x = ${root}.`,
    });
  }

  if (type === 'fractionalEquation') {
    const x = rand(2, Math.round(10 * scale));
    const divisor = pick([2, 3, 4, 5]);
    const add = rand(3, 12);
    const total = x / divisor + add;
    return createCepreExercise({
      category: 'algebra',
      block: 'algebra',
      topic: 'Ecuaciones fraccionarias',
      microtopic: 'Despeje con división',
      questionType: 'calculo',
      skill: 'Aislar término y multiplicar',
      expectedError: 'signo',
      targetTimeSec: 80,
      prompt: `x/${divisor} + ${add} = ${total}. Halla x.`,
      answer: x,
      answerLabel: String(x),
      choices: numericChoices(x, String(x), 2),
      explanation: `x/${divisor} = ${total - add}; x = ${x}.`,
    });
  }

  const a = rand(2, Math.round(7 * scale));
  const x = rand(2, 5);
  const answer = a * x * x + 2 * x - 1;
  return createCepreExercise({
    category: 'algebra',
    block: 'algebra',
    topic: 'Polinomios',
    microtopic: 'Evaluación polinómica',
    questionType: 'calculo',
    skill: 'Sustituir y operar',
    expectedError: 'calculo',
    targetTimeSec: 75,
    prompt: `P(x) = ${a}x² + 2x - 1. Halla P(${x}).`,
    answer,
    answerLabel: String(answer),
    choices: numericChoices(answer, String(answer), 5),
    explanation: `${a}(${x})² + 2(${x}) - 1 = ${answer}.`,
  });
};

const createByBlock = (block: CepreBlock, level: Level): Exercise => {
  if (block === 'numbers') return numberProblem(level);
  if (block === 'algebra') return algebraProblem(level);

  return pick([
    () => numberProblem(level),
    () => numberProblem(level),
    () => algebraProblem(level),
  ])();
};

export const generateCepreExercises = (config: CepreConfig): Exercise[] =>
  Array.from({ length: config.amount }, () => createByBlock(config.block, config.level));
