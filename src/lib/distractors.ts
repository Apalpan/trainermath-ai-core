// Distractores v3: cada opción incorrecta modela un error humano real,
// no ruido aleatorio. Pipeline: candidatos ordenados → filtro → anti-atajo → fallback.

import type { AnswerChoice, Category, ChoiceKey, Level } from '../types';
import { transposeDigits } from './quality';
import { pick, rand, shuffle } from './random';

export type ConcreteCategory = Exclude<Category, 'mixed'>;

export interface DistractorContext {
  answer: number;
  operands: number[];
  category: ConcreteCategory;
  variant?: string;
  level: Level;
  rung?: number;
  nonNegative?: boolean;
  integerOnly?: boolean;
}

type DistractorGen = (ctx: DistractorContext) => number[];

const choiceKeys: ChoiceKey[] = ['A', 'B', 'C', 'D'];

export const assignKeys = (drafts: Array<Omit<AnswerChoice, 'key'>>): AnswerChoice[] =>
  shuffle(drafts)
    .slice(0, 4)
    .map((draft, index) => ({ ...draft, key: choiceKeys[index] }));

const defaultLabel = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');

/** Generador legado de ±delta. Se conserva exportado como fallback y para generadores externos. */
export const numericChoices = (answer: number, answerLabel = String(answer), scale = 1): AnswerChoice[] => {
  const drafts: Array<Omit<AnswerChoice, 'key'>> = [{ label: answerLabel, value: answer, isCorrect: true }];
  const values = new Set([Number(answer.toFixed(6))]);
  const base = Math.max(1, Math.round(Math.abs(answer) * 0.08), scale);
  const deltas = shuffle([-base * 3, -base * 2, -base, -Math.ceil(base / 2), Math.ceil(base / 2), base, base * 2, base * 3, -10, 10]);

  const forbidNegative = answer >= 0;

  for (const delta of deltas) {
    if (drafts.length === 4) break;
    const candidate = answer + delta;
    if (forbidNegative && candidate < 0) continue;
    const key = Number(candidate.toFixed(6));
    if (values.has(key)) continue;
    values.add(key);
    drafts.push({ label: defaultLabel(candidate), value: candidate, isCorrect: false });
  }

  let fillOffset = 2;
  while (drafts.length < 4) {
    const candidate = drafts.length % 2 === 0 ? answer + fillOffset : Math.abs(answer) + fillOffset * 3;
    fillOffset += 1;
    if (forbidNegative && candidate < 0) continue;
    const key = Number(candidate.toFixed(6));
    if (candidate === answer || values.has(key)) continue;
    values.add(key);
    drafts.push({ label: defaultLabel(candidate), value: candidate, isCorrect: false });
  }

  return assignKeys(drafts);
};

/* ---------- modelos de error por categoría ---------- */

const additionErrors: DistractorGen = ({ answer, operands }) => {
  const list = [answer + 10, answer - 10];
  if (answer >= 200) list.push(answer + 100, answer - 100);
  list.push(answer + 1, answer - 1);
  const transposed = transposeDigits(answer);
  if (transposed !== null) list.push(transposed);
  if (operands.length >= 3) list.push(answer - Math.min(...operands));
  return list;
};

const subtractionErrors: DistractorGen = ({ answer, operands }) => {
  const list = [answer + 10, answer - 10];
  if (operands.length >= 3) list.push(operands[0] - operands[1] + operands[2]);
  list.push(answer + 1, answer - 1);
  const transposed = transposeDigits(answer);
  if (transposed !== null) list.push(transposed);
  return list;
};

const multiplicationErrors: DistractorGen = ({ answer, operands }) => {
  const [a, b] = operands;
  const list: number[] = [];
  if (a !== undefined && b !== undefined) {
    list.push((a + 1) * b, (a - 1) * b, a * (b + 1), a * (b - 1));
  }
  if (answer % 10 === 0) list.push(answer / 10);
  list.push(answer * 10, answer + 10, answer - 10);
  if (a !== undefined) list.push(answer + a, answer - a);
  if (b !== undefined) list.push(answer + b, answer - b);
  return list;
};

const divisionErrors: DistractorGen = ({ answer, operands }) => {
  const list = [answer + 1, answer - 1, answer + 2, answer - 2];
  if (answer % 10 === 0 && answer >= 20) list.push(answer / 10);
  list.push(answer * 10);
  const dividend = operands[0];
  if (dividend !== undefined) {
    for (let divisor = 2; divisor <= 12; divisor += 1) {
      if (dividend % divisor === 0 && dividend / divisor !== answer) {
        list.push(dividend / divisor);
        break;
      }
    }
  }
  return list;
};

const percentageErrors: DistractorGen = ({ answer, operands }) => {
  const [percent, base] = operands;
  const neighbor: Record<number, number> = { 5: 10, 10: 15, 12.5: 25, 15: 20, 20: 25, 25: 20, 30: 25, 35: 30, 40: 50, 50: 25, 75: 50 };
  const list: number[] = [];
  if (percent !== undefined && base !== undefined) {
    const near = neighbor[percent];
    if (near) list.push((base * near) / 100);
    list.push(base - answer, answer + base * 0.05, answer - base * 0.05);
  }
  list.push(answer * 10, answer / 10);
  return list;
};

const ratioErrors: DistractorGen = ({ answer, operands }) => {
  // operands: [a, b, k, total]
  const [a, b, k, total] = operands;
  const list: number[] = [];
  if (a !== undefined && k !== undefined) list.push(a * k);
  if (total !== undefined) list.push(total - answer);
  if (b !== undefined && k !== undefined) list.push((b + 1) * k, (b - 1) * k, b * (k + 1), b * (k - 1));
  return list;
};

const averagesErrors: DistractorGen = ({ answer, operands }) => {
  // operands: [v1, v2, v3, target]
  const target = operands[3];
  const list: number[] = [];
  if (target !== undefined) {
    const sumValues = operands.slice(0, 3).reduce((sum, value) => sum + value, 0);
    list.push(target * 3 - sumValues, answer + target, answer - target);
  }
  list.push(answer + 10, answer - 10, answer + 1, answer - 1);
  return list;
};

const powersErrors: DistractorGen = ({ answer, operands }) => {
  const [base, exponent] = operands;
  const list: number[] = [];
  if (base !== undefined && exponent !== undefined) {
    list.push(base * exponent, Math.pow(base + 1, exponent), Math.pow(base - 1, exponent), Math.pow(base, Math.max(1, exponent - 1)));
    list.push(answer + base, answer - base);
  }
  return list;
};

const rootsErrors: DistractorGen = ({ answer }) => {
  const list = [answer + 1, answer - 1, answer + 2, answer - 2];
  const nearestTen = Math.round(answer / 10) * 10;
  if (nearestTen !== answer) list.push(nearestTen);
  if (answer >= 30) list.push(answer + 10, answer - 10);
  return list;
};

const algebraErrors: DistractorGen = ({ answer, operands }) => {
  // operands: [a, b, total]  para  a·x + b = total
  const [a, b, total] = operands;
  const list: number[] = [];
  if (total !== undefined && b !== undefined) {
    list.push(total - b);
    if (a !== undefined && a !== 0 && (total + b) % a === 0) list.push((total + b) / a);
    if (a !== undefined && a !== 0) list.push(Math.round(total / a));
  }
  list.push(answer + 1, answer - 1);
  return list;
};

const combinedErrors: DistractorGen = ({ answer, operands }) => {
  // operands: [c, a, b]  para  c + a×b
  const [c, a, b] = operands;
  const list: number[] = [];
  if (c !== undefined && a !== undefined && b !== undefined) {
    list.push((c + a) * b, answer + a, answer - a, answer + b, answer - b);
  }
  list.push(answer + 10, answer - 10);
  return list;
};

const seriesErrors: DistractorGen = ({ answer, operands }) => {
  // operands: [último término mostrado, paso]
  const [last, step] = operands;
  const list: number[] = [];
  if (last !== undefined) list.push(last);
  if (step !== undefined) {
    list.push(answer + step);
    if (last !== undefined) list.push(last + step + 1, last + step - 1);
  }
  list.push(answer + 1, answer - 1);
  return list;
};

const fractionsErrors: DistractorGen = ({ answer }) => [
  answer + 0.25,
  answer - 0.25,
  answer * 2,
  answer / 2,
  1 - answer,
];

const divisibilityErrors: DistractorGen = ({ answer, operands, variant }) => {
  const [a, b] = operands;
  const list: number[] = [];
  const gcdOf = (x: number, y: number): number => (!y ? Math.abs(x) : gcdOf(y, x % y));
  if (variant === 'mcm' && a !== undefined && b !== undefined) {
    list.push(a * b, answer + gcdOf(a, b), answer - gcdOf(a, b), gcdOf(a, b));
  } else if (a !== undefined && b !== undefined) {
    const lcm = Math.abs(a * b) / gcdOf(a, b);
    if (lcm <= 4 * answer) list.push(lcm);
    list.push(answer * 2);
    if (answer % 2 === 0) list.push(answer / 2);
    list.push(Math.min(a, b));
  }
  return list;
};

/* ---------- variantes nuevas ---------- */

const complementErrors: DistractorGen = ({ answer, operands }) => {
  // operands: [a, target]  para  a + ? = target
  const [a, target] = operands;
  const list = [answer + 10, answer - 1, answer + 1, answer - 10];
  if (a !== undefined && target !== undefined) {
    const reversed = transposeDigits(a);
    if (reversed !== null) list.push(target - reversed);
  }
  return list;
};

const doubleHalfErrors: DistractorGen = ({ answer, operands, variant }) => {
  const n = operands[0];
  const list: number[] = [];
  if (variant === 'half') {
    if (n !== undefined && Math.floor(n / 10) % 2 === 1) list.push(answer - 5, answer + 5);
    list.push(answer + 1, answer - 1, answer + 2, answer - 2);
    if (n !== undefined) list.push(n * 2);
  } else {
    list.push(answer - 10, answer + 10, answer + 2, answer - 2);
    const transposed = transposeDigits(answer);
    if (transposed !== null) list.push(transposed);
    if (n !== undefined && n % 2 === 0) list.push(n / 2);
  }
  return list;
};

const squaresErrors: DistractorGen = ({ answer, operands, variant }) => {
  const n = operands[0];
  const list: number[] = [];
  if (variant === 'a5' && n !== undefined) {
    const a = Math.floor(n / 10);
    list.push(a * a * 100 + 25, (a + 1) * (a + 2) * 100 + 25);
    // terminación transpuesta …52
    list.push(Math.floor(answer / 100) * 100 + 52, answer + 100, answer - 100);
  } else if (n !== undefined) {
    list.push((n + 1) * (n + 1), (n - 1) * (n - 1), answer + 2 * n, answer - 2 * n, answer + 10, answer - 10);
  }
  return list;
};

const specialProductErrors: DistractorGen = ({ answer, operands }) => {
  // operands: [a, multiplicador]
  const [a, m] = operands;
  const list: number[] = [];
  if (a !== undefined && m === 11) {
    const units = a % 10;
    const tens = Math.floor(a / 10) % 10;
    if (units + tens >= 10) list.push(answer - 100);
    list.push(answer + 10, answer - 10, a * 12, answer + 100);
  } else if (a !== undefined && m === 25) {
    list.push(answer - a, answer + 25, answer - 25, answer + 50, answer - 50, a * 26);
  } else if (a !== undefined && m === 99) {
    list.push(a * 100, answer + 10, answer - 10, a * 98, answer + 1, answer - 1);
  } else if (a !== undefined && m === 101) {
    list.push(a * 100, answer + 100, answer - 100, answer + 10, answer - 10);
  }
  return list;
};

const registry: Partial<Record<string, DistractorGen>> = {
  addition: additionErrors,
  subtraction: subtractionErrors,
  multiplication: multiplicationErrors,
  division: divisionErrors,
  fractions: fractionsErrors,
  percentages: percentageErrors,
  ratios: ratioErrors,
  divisibility: divisibilityErrors,
  averages: averagesErrors,
  powers: powersErrors,
  roots: rootsErrors,
  algebra: algebraErrors,
  combined: combinedErrors,
  series: seriesErrors,
  // variantes despachadas por ctx.variant
  complement: complementErrors,
  doubleHalf: doubleHalfErrors,
  squares: squaresErrors,
  specialProduct: specialProductErrors,
};

/* ---------- Flash Anzan: errores reales de anzan como distractores ----------
   Cuando el usuario comete el error típico (signo perdido, término perdido,
   término doblado, acarreo), SU suma aparece entre las opciones: el fallo se
   vuelve diagnosticable en vez de sentirse arbitrario. */
export const anzanChoices = (total: number, signedTerms: number[]): AnswerChoice[] => {
  const lastTerm = signedTerms[signedTerms.length - 1];
  const firstNegative = signedTerms.find((value) => value < 0);
  const middle = signedTerms[Math.floor(signedTerms.length / 2)];
  const candidates: number[] = [];
  if (firstNegative !== undefined) candidates.push(total + 2 * Math.abs(firstNegative)); // sumó en vez de restar
  if (lastTerm !== undefined) candidates.push(total - lastTerm);                          // perdió el último término
  if (middle !== undefined && middle !== lastTerm) candidates.push(total - middle, total + middle); // término perdido/doblado
  candidates.push(total + 10, total - 10);                                                // acarreo
  if (Math.abs(total) >= 200) candidates.push(total + 100, total - 100);
  const transposed = transposeDigits(total);
  if (transposed !== null) candidates.push(transposed);

  const seen = new Set([Number(total.toFixed(6))]);
  const survivors: number[] = [];
  for (const candidate of candidates) {
    if (survivors.length === 3) break;
    if (!Number.isInteger(candidate) || candidate < 0) continue;
    const key = Number(candidate.toFixed(6));
    if (seen.has(key)) continue;
    seen.add(key);
    survivors.push(candidate);
  }
  let fillStep = 1;
  while (survivors.length < 3) {
    const candidate = total + fillStep * (survivors.length % 2 === 0 ? 1 : -1);
    fillStep += 1;
    const key = Number(candidate.toFixed(6));
    if (seen.has(key) || candidate < 0) continue;
    seen.add(key);
    survivors.push(candidate);
  }
  return assignKeys([
    { label: String(total), value: total, isCorrect: true },
    ...survivors.map((value) => ({ label: String(value), value, isCorrect: false })),
  ]);
};

/* ---------- Memoria de Dígitos: distractores por transposición y vecino ---------- */

const swapDigits = (digits: string, a: number, b: number) => {
  const chars = digits.split('');
  [chars[a], chars[b]] = [chars[b], chars[a]];
  return chars.join('');
};

/** Distractores del mismo largo que el número: transposiciones y dígito vecino ±1. */
export const digitSpanChoices = (value: number): AnswerChoice[] => {
  const digits = String(value);
  const length = digits.length;
  const candidates = new Set<string>();

  // transposición de pares adyacentes (el error de memoria más común)
  for (let index = 0; index < length - 1 && candidates.size < 6; index += 1) {
    const swapped = swapDigits(digits, index, index + 1);
    if (swapped !== digits && swapped[0] !== '0') candidates.add(swapped);
  }
  // primer↔último
  if (length >= 3) {
    const swapped = swapDigits(digits, 0, length - 1);
    if (swapped !== digits && swapped[0] !== '0') candidates.add(swapped);
  }
  // dígito vecino ±1 en posición aleatoria
  for (let attempt = 0; attempt < 8 && candidates.size < 8; attempt += 1) {
    const position = rand(0, length - 1);
    const digit = Number(digits[position]);
    const delta = pick([1, -1]);
    const nextDigit = digit + delta;
    if (nextDigit < 0 || nextDigit > 9) continue;
    if (position === 0 && nextDigit === 0) continue;
    const mutated = digits.slice(0, position) + String(nextDigit) + digits.slice(position + 1);
    if (mutated !== digits) candidates.add(mutated);
  }

  const survivors = shuffle([...candidates]).slice(0, 3);
  let fallbackDelta = 1;
  while (survivors.length < 3) {
    const candidate = String(value + fallbackDelta);
    fallbackDelta += 1;
    if (candidate.length === length && candidate !== digits && !survivors.includes(candidate)) survivors.push(candidate);
  }

  return assignKeys([
    { label: digits, value, isCorrect: true },
    ...survivors.map((label) => ({ label, value: Number(label), isCorrect: false })),
  ]);
};

/* ---------- pipeline ---------- */

const lastDigit = (value: number) => Math.abs(Math.round(value)) % 10;

/**
 * Constructor primario de opciones v3.
 * Genera 3 distractores modelando errores humanos, con regla anti-atajo:
 * ≥1 distractor comparte último dígito con la respuesta y hay opciones a ambos lados.
 */
export const buildChoices = (
  answer: number,
  answerLabel: string,
  ctx: DistractorContext,
  formatLabel: (value: number) => string = defaultLabel,
): AnswerChoice[] => {
  const generator = registry[ctx.variant ?? ''] ?? registry[ctx.category];
  const nonNegative = ctx.nonNegative ?? true;
  const integerOnly = ctx.integerOnly ?? Number.isInteger(answer);
  const raw = generator ? generator(ctx) : [];

  const seen = new Set([Number(answer.toFixed(6))]);
  const survivors: number[] = [];
  const discarded: number[] = [];

  for (const candidate of raw) {
    if (!Number.isFinite(candidate)) continue;
    const key = Number(candidate.toFixed(6));
    if (seen.has(key)) continue;
    if (nonNegative && candidate < 0) continue;
    if (integerOnly && !Number.isInteger(key)) continue;
    // banda de plausibilidad (desactivada para respuestas pequeñas)
    if (Math.abs(answer) > 12) {
      const magnitude = Math.abs(candidate);
      if (magnitude < 0.2 * Math.abs(answer) || magnitude > 5 * Math.abs(answer)) {
        discarded.push(candidate);
        seen.add(key);
        continue;
      }
    }
    seen.add(key);
    if (survivors.length < 3) survivors.push(candidate);
    else discarded.push(candidate);
  }

  // anti-atajo (a): opciones a ambos lados del valor correcto cuando sea posible
  if (survivors.length === 3) {
    const below = survivors.some((value) => value < answer);
    const above = survivors.some((value) => value > answer);
    if (!below || !above) {
      const fromDiscarded = discarded.find((value) =>
        (below ? value > answer : value < answer)
        && !survivors.some((survivor) => Math.abs(survivor - value) < 1e-6)
        && (!nonNegative || value >= 0));
      if (fromDiscarded !== undefined) {
        survivors[0] = fromDiscarded;
        seen.add(Number(fromDiscarded.toFixed(6)));
      }
    }
  }

  // anti-atajo (b): al menos un distractor con el mismo último dígito que la respuesta
  // (el último dígito no puede ser el atajo para descartar sin calcular)
  if (survivors.length === 3 && Number.isInteger(answer) && !survivors.some((value) => Number.isInteger(value) && lastDigit(value) === lastDigit(answer))) {
    for (const delta of [10, -10, 20, -20, 100, -100, 30, -30]) {
      const replacement = answer + delta;
      if (seen.has(replacement) || replacement === answer) continue;
      if (nonNegative && replacement < 0) continue;
      survivors[2] = replacement;
      seen.add(replacement);
      break;
    }
  }

  // fallback: rellena con el generador legado
  if (survivors.length < 3) {
    const legacy = numericChoices(answer, answerLabel, Math.max(1, Math.round(Math.abs(answer) * 0.08)));
    for (const choice of legacy) {
      if (survivors.length === 3) break;
      if (choice.isCorrect) continue;
      const key = Number(choice.value.toFixed(6));
      if (seen.has(key)) continue;
      if (nonNegative && choice.value < 0) continue;
      seen.add(key);
      survivors.push(choice.value);
    }
  }

  // garantía final: nunca menos de 3 distractores
  let fillStep = 2;
  while (survivors.length < 3) {
    const candidate = answer + fillStep;
    fillStep += 1;
    const key = Number(candidate.toFixed(6));
    if (seen.has(key) || (nonNegative && candidate < 0)) continue;
    seen.add(key);
    survivors.push(candidate);
  }

  const drafts: Array<Omit<AnswerChoice, 'key'>> = [
    { label: answerLabel, value: answer, isCorrect: true },
    ...survivors.map((value) => ({ label: formatLabel(value), value, isCorrect: false })),
  ];

  return assignKeys(drafts);
};
