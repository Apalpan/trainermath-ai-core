// Motor de ejercicios v3: dificultad por peldaño (rung 1-10) dentro de cada nivel,
// distractores por error humano (distractors.ts) y calidad numérica (quality.ts).

import type {
  AnswerChoice,
  AnzanConfig,
  AnzanExercise,
  AnzanTerm,
  Category,
  Exercise,
  Level,
  PracticeTopic,
  TrainingConfig,
} from '../types';
import { buildChoices, numericChoices, assignKeys } from './distractors';
import type { DistractorContext } from './distractors';
import { commutativeSignature, hasCarry, percentDivisor, RecencyWindow } from './quality';
import { pick, rand, shuffle } from './random';

// re-export para compatibilidad (multiplicationGenerator y cepreGenerator importan de aquí)
export { numericChoices };
export { pick, rand, shuffle };

const concreteCategories: Exclude<Category, 'mixed'>[] = [
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

export const practiceTopics: PracticeTopic[] = [
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
  'chainMultiplication',
  'doubleX2',
  'complements',
  'doubleHalf',
  'estimation',
  'squares',
  'specialProducts',
];

const superscripts: Record<number, string> = { 2: '²', 3: '³', 4: '⁴', 5: '⁵' };

const rangeFor = (level: Level) => {
  const ranges = {
    level1: { min: 1, max: 40, multiplier: 12, exponent: 2, denominator: 12 },
    level2: { min: 5, max: 90, multiplier: 16, exponent: 3, denominator: 16 },
    level3: { min: 10, max: 150, multiplier: 20, exponent: 3, denominator: 20 },
    level4: { min: 20, max: 300, multiplier: 26, exponent: 4, denominator: 24 },
    level5: { min: 30, max: 650, multiplier: 32, exponent: 5, denominator: 30 },
  };
  return ranges[level];
};

const rootMaxFor: Record<Level, number> = {
  level1: 180,
  level2: 240,
  level3: 320,
  level4: 420,
  level5: 560,
};

const powerBaseMaxFor: Record<Level, number> = {
  level1: 80,
  level2: 110,
  level3: 150,
  level4: 220,
  level5: 320,
};

export const gcd = (a: number, b: number): number => (!b ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);

export const fractionText = (numerator: number, denominator: number) => {
  const divisor = gcd(numerator, denominator);
  return `${numerator / divisor}/${denominator / divisor}`;
};

/* ---------- ladder: rangos efectivos por peldaño ---------- */

const clampRung = (rung: number) => Math.max(1, Math.min(10, Math.round(rung)));

const effRange = (level: Level, rung: number) => {
  const { min, max } = rangeFor(level);
  const r = clampRung(rung);
  return {
    min: min + Math.round((max - min) * 0.05 * Math.max(0, r - 4)),
    max: min + Math.round((max - min) * (0.35 + 0.065 * r)),
  };
};

const effMultiplier = (level: Level, rung: number) => {
  const { multiplier } = rangeFor(level);
  const r = clampRung(rung);
  return Math.max(4, Math.round(multiplier * (0.4 + 0.06 * r)));
};

const fractionChoices = (numerator: number, denominator: number) => {
  const answer = numerator / denominator;
  const correctLabel = fractionText(numerator, denominator);
  const drafts: Array<Omit<AnswerChoice, 'key'>> = [{ label: correctLabel, value: answer, isCorrect: true }];
  const values = new Set([answer.toFixed(6)]);
  const candidates = shuffle([numerator - 2, numerator - 1, numerator + 1, numerator + 2, denominator - numerator, numerator + denominator]);

  for (const candidateNumerator of candidates) {
    if (drafts.length === 4) break;
    if (candidateNumerator <= 0) continue;
    const value = candidateNumerator / denominator;
    const key = value.toFixed(6);
    if (values.has(key)) continue;
    values.add(key);
    drafts.push({ label: fractionText(candidateNumerator, denominator), value, isCorrect: false });
  }

  while (drafts.length < 4) {
    const candidateNumerator = rand(1, denominator + 6);
    const value = candidateNumerator / denominator;
    const key = value.toFixed(6);
    if (values.has(key)) continue;
    values.add(key);
    drafts.push({ label: fractionText(candidateNumerator, denominator), value, isCorrect: false });
  }

  return { answer, answerLabel: correctLabel, choices: assignKeys(drafts) };
};

const createExercise = (
  category: Exclude<Category, 'mixed'>,
  prompt: string,
  answer: number,
  answerLabel: string,
  explanation: string,
  choices: AnswerChoice[],
  extra: Partial<Exercise> = {},
): Exercise => ({
  id: crypto.randomUUID(),
  category,
  prompt,
  answer,
  answerLabel,
  choices,
  acceptedText: [],
  explanation,
  trainer: 'math',
  ...extra,
});

const smartChoices = (answer: number, ctx: Omit<DistractorContext, 'answer'>, answerLabel = String(answer)) =>
  buildChoices(answer, answerLabel, { answer, ...ctx });

/* ---------- creadores por categoría (con rung) ---------- */

const createByCategory = (category: Exclude<Category, 'mixed'>, level: Level, rung = 5): Exercise => {
  const r = clampRung(rung);
  const range = effRange(level, r);
  const multiplier = effMultiplier(level, r);
  const forceCarry = r >= 4;
  const meta = { rung: r };

  if (category === 'addition') {
    const terms = r >= 10 ? 4 : r >= 7 ? 3 : 2;
    let values: number[] = [];
    for (let attempt = 0; attempt < 30; attempt += 1) {
      values = Array.from({ length: terms }, () => rand(Math.max(2, range.min), range.max));
      const roundOperands = values.filter((value) => value % 10 === 0).length;
      if (roundOperands > (r >= 5 ? 0 : 1)) continue;
      if (forceCarry && !hasCarry(values[0], values[1])) continue;
      break;
    }
    const answer = values.reduce((sum, value) => sum + value, 0);
    return createExercise(category, values.join(' + '), answer, String(answer), `${values.join(' + ')} = ${answer}`,
      smartChoices(answer, { operands: values, category, level, rung: r }), meta);
  }

  if (category === 'subtraction') {
    let a = 0;
    let b = 0;
    let c = 0;
    let answer = 0;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      a = rand(range.max, range.max * 2);
      b = rand(Math.max(2, range.min), Math.min(a - 2, range.max));
      c = r >= 7 && a - b >= 6 ? rand(2, Math.max(2, Math.min(a - b - 3, multiplier))) : 0;
      answer = a - b - c;
      if (answer < 2) continue;
      if (forceCarry && a % 10 >= b % 10) continue;
      break;
    }
    if (answer < 2) {
      c = 0;
      answer = a - b;
    }
    const prompt = c ? `${a} − ${b} − ${c}` : `${a} − ${b}`;
    const operands = c ? [a, b, c] : [a, b];
    return createExercise(category, prompt, answer, String(answer), `${prompt} = ${answer}`,
      smartChoices(answer, { operands, category, level, rung: r }), meta);
  }

  if (category === 'multiplication') {
    let a = 0;
    let b = 0;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      a = rand(2, multiplier);
      b = pick([5, 11, 12, 25, rand(2, multiplier)]);
      if (r >= 4 && (a % 10 === 0 || b % 10 === 0)) continue;
      if (a < 2 || b < 2) continue;
      break;
    }
    const answer = a * b;
    return createExercise(category, `${a} × ${b}`, answer, String(answer), `${a} × ${b} = ${answer}`,
      smartChoices(answer, { operands: [a, b], category, level, rung: r }), meta);
  }

  if (category === 'division') {
    let divisor = rand(2, multiplier);
    let quotient = rand(2, multiplier);
    if (r >= 4 && divisor === quotient) quotient += 1;
    const dividend = divisor * quotient;
    return createExercise(category, `${dividend} ÷ ${divisor}`, quotient, String(quotient), `${dividend} ÷ ${divisor} = ${quotient}`,
      smartChoices(quotient, { operands: [dividend, divisor], category, level, rung: r }), meta);
  }

  if (category === 'fractions') {
    // regenerar operandos hasta que el total sea válido: nunca 0 ni igual al denominador
    // (denominador mínimo 3: con 2 el único par posible es 1/2 + 1/2)
    let denominator = 3;
    let numerator = 1;
    let extra = 1;
    let subtract = false;
    let total = 0;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      denominator = rand(3, Math.max(4, Math.min(30, rangeFor(level).denominator)));
      numerator = rand(1, denominator - 1);
      extra = rand(1, denominator - 1);
      subtract = r >= 4 && Math.random() > 0.55 && numerator > extra;
      total = subtract ? numerator - extra : numerator + extra;
      if (total !== 0 && total !== denominator) break;
    }
    if (total === 0 || total === denominator) {
      // fallback determinista: ajustar el operando ANTES de construir el prompt
      extra += 1;
      total = subtract ? numerator - extra : numerator + extra;
    }
    const fraction = fractionChoices(total, denominator);
    const op = subtract ? '−' : '+';
    return createExercise(category, `${numerator}/${denominator} ${op} ${extra}/${denominator}`, fraction.answer, fraction.answerLabel,
      `Opera numeradores: ${total}/${denominator}. Simplificado: ${fraction.answerLabel}`, fraction.choices, { ...meta, acceptedText: [fraction.answerLabel, `${total}/${denominator}`] });
  }

  if (category === 'percentages') {
    const pool = r >= 10 ? [12.5, 15, 35, 75] : r >= 6 ? [15, 20, 25, 30, 35, 40, 75] : [5, 10, 20, 25, 50];
    const percent = pick(pool);
    const divisor = percentDivisor[percent] ?? 10;
    const k = rand(Math.max(2, Math.ceil(40 / divisor)), Math.floor(600 / divisor));
    const base = divisor * k;
    const answer = (base * percent) / 100;
    return createExercise(category, `${percent}% de ${base}`, answer, String(answer), `${base} × ${percent}/100 = ${answer}`,
      smartChoices(answer, { operands: [percent, base], category, level, rung: r }), meta);
  }

  if (category === 'ratios') {
    const a = rand(2, 6);
    const b = rand(3, 9);
    const k = rand(4, 6 + r);
    const total = (a + b) * k;
    const answer = b * k;
    return createExercise(category, `A:B = ${a}:${b} · A+B = ${total} · ¿B?`, answer, String(answer),
      `${a + b} partes = ${total}. 1 parte = ${k}. B = ${b} × ${k} = ${answer}`,
      smartChoices(answer, { operands: [a, b, k, total], category, level, rung: r }), meta);
  }

  if (category === 'divisibility') {
    const type = pick(['mcd', 'mcm', 'simplify'] as const);
    let a = rand(2, 20 + r + multiplier) * pick([2, 3, 4, 5, 6]);
    let b = rand(2, 20 + r + multiplier) * pick([2, 3, 4, 5, 6]);
    for (let attempt = 0; attempt < 20 && gcd(a, b) < 2; attempt += 1) {
      const factor = pick([2, 3, 4, 5, 6]);
      a = rand(2, 20 + r + multiplier) * factor;
      b = rand(2, 20 + r + multiplier) * factor;
    }
    if (type === 'mcd') {
      const answer = gcd(a, b);
      return createExercise(category, `MCD(${a}, ${b})`, answer, String(answer), `MCD(${a}, ${b}) = ${answer}`,
        smartChoices(answer, { operands: [a, b], category, level, rung: r }), meta);
    }
    if (type === 'mcm') {
      const answer = lcm(a, b);
      return createExercise(category, `MCM(${a}, ${b})`, answer, String(answer), `MCM(${a}, ${b}) = ${answer}`,
        smartChoices(answer, { operands: [a, b], category, level, rung: r, variant: 'mcm' }), meta);
    }
    let numerator = a * rand(2, 5);
    let denominator = b * rand(2, 5);
    for (let attempt = 0; attempt < 20 && (numerator % denominator === 0 || denominator % numerator === 0); attempt += 1) {
      numerator = rand(2, 24) * rand(2, 5);
      denominator = rand(2, 24) * rand(2, 5);
    }
    if (numerator % denominator === 0 || denominator % numerator === 0) {
      numerator = 6;
      denominator = 8;
    }
    const reduced = fractionText(numerator, denominator);
    const [n, d] = reduced.split('/').map(Number);
    return createExercise(category, `Simplifica ${numerator}/${denominator}`, n / d, reduced, `Divide por el MCD y queda ${reduced}`,
      fractionChoices(n, d).choices, { ...meta, acceptedText: [reduced] });
  }

  if (category === 'averages') {
    const values = [rand(8, range.max), rand(8, range.max), rand(8, range.max)];
    const target = rand(10, Math.max(18, Math.round(range.max * 0.7)));
    const x = target * 4 - values.reduce((sum, value) => sum + value, 0);
    if (x <= 1) return createByCategory(category, level, r);
    return createExercise(category, `Promedio de ${values.join(', ')} y x es ${target} · ¿x?`, x, String(x),
      `Suma total = ${target} × 4 = ${target * 4}. x = ${x}`,
      smartChoices(x, { operands: [...values, target], category, level, rung: r }), meta);
  }

  if (category === 'powers') {
    const maxExponent = r >= 10 ? rangeFor(level).exponent : Math.max(2, rangeFor(level).exponent - 1);
    const exponent = rand(2, maxExponent);
    const baseCap = Math.max(4, Math.round(powerBaseMaxFor[level] * (0.3 + 0.07 * r)));
    const base = rand(2, exponent >= 4 ? Math.min(baseCap, 12) : baseCap);
    const answer = Math.pow(base, exponent);
    const prompt = `${base}${superscripts[exponent] ?? `^${exponent}`}`;
    return createExercise(category, prompt, answer, String(answer), `${prompt} = ${answer}`,
      smartChoices(answer, { operands: [base, exponent], category, level, rung: r }), meta);
  }

  if (category === 'roots') {
    const cap = Math.max(6, Math.round(rootMaxFor[level] * (0.3 + 0.07 * r)));
    const root = rand(2, cap);
    const value = root * root;
    return createExercise(category, `√${value}`, root, String(root), `√${value} = ${root}`,
      smartChoices(root, { operands: [value], category, level, rung: r }), meta);
  }

  if (category === 'algebra') {
    const x = rand(2, multiplier);
    const a = r <= 3 ? 1 : rand(2, Math.min(8, multiplier));
    const b = rand(2, range.max);
    const total = a * x + b;
    const prompt = a === 1 ? `x + ${b} = ${total}` : `${a}x + ${b} = ${total}`;
    return createExercise(category, prompt, x, String(x), `x = (${total} − ${b}) ÷ ${a} = ${x}`,
      smartChoices(x, { operands: [a, b, total], category, level, rung: r }), meta);
  }

  if (category === 'combined') {
    const a = rand(2, multiplier);
    const b = rand(2, multiplier);
    const c = rand(Math.max(2, range.min), range.max);
    const answer = c + a * b;
    return createExercise(category, `${c} + ${a} × ${b}`, answer, String(answer),
      `Primero multiplica: ${a} × ${b} = ${a * b}. Luego ${c} + ${a * b} = ${answer}`,
      smartChoices(answer, { operands: [c, a, b], category, level, rung: r }), meta);
  }

  if (category === 'series') {
    const start = rand(2, 30);
    const step = rand(2, Math.max(4, Math.round((level === 'level5' ? 18 : 10) * (0.4 + 0.06 * r))));
    const series = Array.from({ length: 4 }, (_, index) => start + step * index);
    const answer = start + step * 4;
    return createExercise(category, `${series.join(', ')}, ?`, answer, String(answer), `La diferencia es ${step}. Siguiente: ${answer}`,
      smartChoices(answer, { operands: [series[3], step], category, level, rung: r }), meta);
  }

  const price = rand(8, 60);
  const units = rand(2, 8);
  const paid = price * units + rand(5, 50);
  const answer = paid - price * units;
  return createExercise(category, `${units} × ${price}; pagas ${paid}; ¿cambio?`, answer, String(answer),
    `${units} × ${price} = ${price * units}. ${paid} − ${price * units} = ${answer}`,
    numericChoices(answer, String(answer)), meta);
};

/* ---------- variantes nuevas ---------- */

const createComplement = (level: Level, rung = 5): Exercise => {
  const r = clampRung(rung);
  const target = level === 'level1' ? (r <= 3 ? pick([20, 50]) : 100)
    : level === 'level2' ? 100
    : level === 'level3' ? pick([100, 1000])
    : pick([1000, 10000]);
  let a = 0;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    a = rand(Math.max(2, Math.round(target * 0.06)), Math.round(target * 0.94));
    if (r >= 4 && a % 10 === 0) continue;
    if (a === target / 2) continue;
    break;
  }
  const answer = target - a;
  const isPowerOfTen = Math.log10(target) % 1 === 0;
  const trickExplanation = isPowerOfTen && a % 10 !== 0
    ? `Unidades a 10, resto a 9: ${target} − ${a} = ${answer}`
    : `${target} − ${a} = ${answer}`;
  return createExercise('subtraction', `${a} + ¿? = ${target}`, answer, String(answer),
    trickExplanation,
    buildChoices(answer, String(answer), { answer, operands: [a, target], category: 'subtraction', level, rung: r, variant: 'complement' }),
    { rung: r, topic: 'Complementos', microtopic: `Objetivo ${target}` });
};

const createDoubleHalf = (level: Level, rung = 5): Exercise => {
  const r = clampRung(rung);
  const range = effRange(level, r);
  const isHalf = Math.random() > 0.5;
  if (isHalf) {
    const n = rand(6, Math.max(12, range.max * 2)) * 2;
    const answer = n / 2;
    return createExercise('multiplication', `Mitad de ${n}`, answer, String(answer), `${n} ÷ 2 = ${answer}`,
      buildChoices(answer, String(answer), { answer, operands: [n], category: 'multiplication', level, rung: r, variant: 'doubleHalf' }),
      { rung: r, topic: 'Doble y mitad', microtopic: 'Mitad' });
  }
  const n = rand(7, Math.max(14, range.max * 2));
  const answer = n * 2;
  return createExercise('multiplication', `Doble de ${n}`, answer, String(answer), `${n} × 2 = ${answer}`,
    buildChoices(answer, String(answer), { answer, operands: [n], category: 'multiplication', level, rung: r, variant: 'doubleHalf' }),
    { rung: r, topic: 'Doble y mitad', microtopic: 'Doble' });
};

const createEstimation = (level: Level, rung = 5): Exercise => {
  const r = clampRung(rung);
  const magnitudes: Record<Level, number> = { level1: 200, level2: 600, level3: 1500, level4: 4000, level5: 9000 };
  const target = magnitudes[level] * (0.6 + 0.04 * r);

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const pairs = Array.from({ length: 4 }, () => {
      const a = rand(3, Math.max(6, Math.round(Math.sqrt(target) * 1.4)));
      const bMin = Math.max(3, Math.round((target * 0.55) / a));
      const bMax = Math.max(bMin + 1, Math.round(target / a));
      const b = rand(bMin, bMax);
      return { a, b, product: a * b };
    });
    if (pairs.some((pair) => pair.a % 10 === 0 || pair.b % 10 === 0)) continue;
    if (new Set(pairs.map((pair) => pair.product)).size < 4) continue;
    const sorted = [...pairs].sort((x, y) => y.product - x.product);
    if (sorted[0].product < sorted[1].product * 1.06) continue;
    if (sorted[1].product < sorted[2].product * 1.01) continue;
    const labels = new Set(pairs.map((pair) => `${pair.a} × ${pair.b}`));
    if (labels.size < 4) continue;

    const winner = sorted[0];
    const choiceKeysList: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    const choices: AnswerChoice[] = shuffle(pairs).map((pair, index) => ({
      key: choiceKeysList[index],
      label: `${pair.a} × ${pair.b}`,
      value: pair.product,
      isCorrect: pair === winner,
    }));
    return createExercise('multiplication', '¿Cuál es mayor?', winner.product, `${winner.a} × ${winner.b}`,
      `Productos: ${sorted.map((pair) => `${pair.a}×${pair.b}=${pair.product}`).join(' · ')}`,
      choices, { rung: r, topic: 'Estimación', microtopic: 'Comparar productos', acceptedText: [`${winner.a} × ${winner.b}`] });
  }
  return createByCategory('multiplication', level, r);
};

const createSquareTrick = (level: Level, rung = 5): Exercise => {
  const r = clampRung(rung);
  if (r <= 6 || Math.random() > 0.5) {
    const a = rand(1, Math.min(9, r + 2));
    const n = a * 10 + 5;
    const answer = a * (a + 1) * 100 + 25;
    return createExercise('powers', `${n}²`, answer, String(answer),
      `Truco a5²: ${a} × ${a + 1} = ${a * (a + 1)}, y pega 25 → ${answer}`,
      buildChoices(answer, String(answer), { answer, operands: [n], category: 'powers', level, rung: r, variant: 'a5' }),
      { rung: r, topic: 'Cuadrados con truco', microtopic: 'Terminados en 5' });
  }
  let n = rand(11, 29);
  if (n % 10 === 5) n += 1;
  const answer = n * n;
  return createExercise('powers', `${n}²`, answer, String(answer), `${n}² = ${answer}`,
    buildChoices(answer, String(answer), { answer, operands: [n], category: 'powers', level, rung: r, variant: 'squares' }),
    { rung: r, topic: 'Cuadrados con truco', microtopic: 'Generales 11–29' });
};

const createSpecialProduct = (level: Level, rung = 5): Exercise => {
  const r = clampRung(rung);
  const multipliers = r <= 4 ? [11, 25] : r <= 6 ? [11, 25, 99] : r <= 8 ? [25, 99, 101] : [99, 101];
  const m = pick(multipliers);
  let a = 0;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    a = m === 11 ? rand(13, 98) : rand(12, 99);
    if (a % 10 === 0) continue;
    if (m === 11 && a % 11 === 0) continue;
    break;
  }
  const answer = a * m;
  const explanations: Record<number, string> = {
    11: `${a} × 11: suma dígitos vecinos → ${answer}`,
    25: `${a} × 25 = ${a} × 100 ÷ 4 = ${answer}`,
    99: `${a} × 99 = ${a}00 − ${a} = ${answer}`,
    101: `${a} × 101 = ${a}00 + ${a} = ${answer}`,
  };
  return createExercise('multiplication', `${a} × ${m}`, answer, String(answer), explanations[m],
    buildChoices(answer, String(answer), { answer, operands: [a, m], category: 'multiplication', level, rung: r, variant: 'specialProduct' }),
    { rung: r, topic: `Producto especial ×${m}`, microtopic: `Multiplicar por ${m}` });
};

const createChainedMultiplication = (level: Level, factorCount = 3, rung = 5): Exercise => {
  const r = clampRung(rung);
  const maxByLevel: Record<Level, number> = { level1: 6, level2: 7, level3: 8, level4: 9, level5: 9 };
  const count = r >= 10 ? factorCount + 1 : r >= 7 ? factorCount : Math.max(2, factorCount - 1);
  const factors = Array.from({ length: count }, () => rand(2, maxByLevel[level]));
  const answer = factors.reduce((product, value) => product * value, 1);
  const prompt = factors.join(' × ');
  return createExercise('multiplication', prompt, answer, String(answer), `${prompt} = ${answer}`,
    numericChoices(answer, String(answer), 6), { rung: r, topic: 'Multiplicación encadenada' });
};

const createDoubleX2Question = (level: Level, rung = 5): Exercise => {
  const r = clampRung(rung);
  const maxByLevel: Record<Level, number> = { level1: 30, level2: 80, level3: 160, level4: 320, level5: 640 };
  const base = rand(2, Math.max(6, Math.round(maxByLevel[level] * (0.4 + 0.06 * r))));
  const answer = base * 2;
  return createExercise('multiplication', `Doble de ${base}`, answer, String(answer), `${base} × 2 = ${answer}`,
    buildChoices(answer, String(answer), { answer, operands: [base], category: 'multiplication', level, rung: r, variant: 'doubleHalf' }),
    { rung: r, topic: 'Multiplicar x2' });
};

export const createByTopic = (topic: PracticeTopic, level: Level, rung = 5): Exercise => {
  if (topic === 'mixed') return createByCategory(pick(concreteCategories), level, rung);
  if (topic === 'chainMultiplication') return createChainedMultiplication(level, 3, rung);
  if (topic === 'doubleX2') return createDoubleX2Question(level, rung);
  if (topic === 'complements') return createComplement(level, rung);
  if (topic === 'doubleHalf') return createDoubleHalf(level, rung);
  if (topic === 'estimation') return createEstimation(level, rung);
  if (topic === 'squares') return createSquareTrick(level, rung);
  if (topic === 'specialProducts') return createSpecialProduct(level, rung);
  return createByCategory(topic, level, rung);
};

const topicsForConfig = (config: TrainingConfig): PracticeTopic[] => {
  const selected = config.topics?.filter(Boolean);
  if (!selected || selected.length === 0) return config.category === 'mixed' ? practiceTopics : [config.category];
  if (selected.includes('mixed')) return practiceTopics;
  return selected;
};

export const generateExercises = (config: TrainingConfig): Exercise[] => {
  const topics = topicsForConfig(config);
  return generateUnique(config.amount, () => createByTopic(pick(topics), config.level));
};

const exerciseSignature = (exercise: Exercise) => `${exercise.category}|${exercise.prompt}|${exercise.answerLabel}`;

const operandsFromPrompt = (prompt: string): number[] => (prompt.match(/\d+/g) ?? []).map(Number);

export const generateUnique = (amount: number, create: () => Exercise): Exercise[] => {
  const exercises: Exercise[] = [];
  const seen = new Set<string>();
  const recency = new RecencyWindow(8);
  const maxAttempts = Math.max(120, amount * 120);
  let attempts = 0;

  while (exercises.length < amount && attempts < maxAttempts) {
    attempts += 1;
    const exercise = create();
    if (exercise.answer === 0 || exercise.answer === 1) continue;
    const signature = exerciseSignature(exercise);
    if (seen.has(signature)) continue;
    const commutative = commutativeSignature(exercise.category, operandsFromPrompt(exercise.prompt));
    if (recency.seen(commutative)) continue;
    seen.add(signature);
    recency.push(commutative);
    exercises.push(exercise);
  }

  while (exercises.length < amount) {
    const exercise = create();
    const variantPrompt = `${exercise.prompt} · ${exercises.length + 1}`;
    const variant = { ...exercise, id: crypto.randomUUID(), prompt: variantPrompt };
    seen.add(exerciseSignature(variant));
    exercises.push(variant);
  }

  return exercises;
};

/* ---------- Flash Anzan ---------- */

export const generateFlashAnzanExercise = (config: AnzanConfig): AnzanExercise => {
  const min = config.digits <= 1 ? 1 : Math.pow(10, config.digits - 1);
  const max = Math.pow(10, config.digits) - 1;
  let total = 0;
  let previousValue = 0;
  let sameLastDigitRun = 0;

  const terms: AnzanTerm[] = Array.from({ length: config.terms }, (_, index) => {
    let value = rand(min, max);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const repeatsPrevious = value === previousValue;
      const lastDigitRepeat = config.digits >= 2 && sameLastDigitRun >= 2 && value % 10 === previousValue % 10;
      if (!repeatsPrevious && !lastDigitRepeat) break;
      value = rand(min, max);
    }
    const canSubtract = config.operationMode === 'additionSubtraction' && index > 0 && total - value >= 1 && value !== total;
    const signedValue = canSubtract && Math.random() > 0.55 ? -value : value;
    total += signedValue;
    sameLastDigitRun = value % 10 === previousValue % 10 ? sameLastDigitRun + 1 : 0;
    previousValue = value;
    return { id: crypto.randomUUID(), value, signedValue, label: `${signedValue >= 0 ? '+' : '−'} ${value}` };
  });

  const prompt = terms.map((term) => term.label.replace(' ', '')).join(' ');
  return {
    id: crypto.randomUUID(),
    terms,
    answer: total,
    answerLabel: String(total),
    choices: numericChoices(total),
    prompt,
    explanation: `Secuencia: ${prompt}. Resultado final: ${total}`,
  };
};
