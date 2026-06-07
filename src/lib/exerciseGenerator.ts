import type {
  AnswerChoice,
  AnzanConfig,
  AnzanExercise,
  AnzanTerm,
  Category,
  ChoiceKey,
  Exercise,
  Level,
  TrainingConfig,
} from '../types';

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

const choiceKeys: ChoiceKey[] = ['A', 'B', 'C', 'D'];
const superscripts: Record<number, string> = { 2: '²', 3: '³', 4: '⁴', 5: '⁵' };

export const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = <T,>(items: T[]) => items[rand(0, items.length - 1)];
export const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const rangeFor = (level: Level) => {
  const ranges = {
    level1: { min: 1, max: 20, multiplier: 10, exponent: 2, denominator: 10 },
    level2: { min: 5, max: 60, multiplier: 12, exponent: 3, denominator: 12 },
    level3: { min: 10, max: 120, multiplier: 15, exponent: 3, denominator: 16 },
    level4: { min: 20, max: 250, multiplier: 20, exponent: 4, denominator: 20 },
    level5: { min: 30, max: 500, multiplier: 25, exponent: 5, denominator: 24 },
  };
  return ranges[level];
};

export const gcd = (a: number, b: number): number => (!b ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);

export const fractionText = (numerator: number, denominator: number) => {
  const divisor = gcd(numerator, denominator);
  return `${numerator / divisor}/${denominator / divisor}`;
};

const assignKeys = (drafts: Array<Omit<AnswerChoice, 'key'>>): AnswerChoice[] =>
  shuffle(drafts)
    .slice(0, 4)
    .map((draft, index) => ({ ...draft, key: choiceKeys[index] }));

export const numericChoices = (answer: number, answerLabel = String(answer), scale = 1) => {
  const drafts: Array<Omit<AnswerChoice, 'key'>> = [{ label: answerLabel, value: answer, isCorrect: true }];
  const values = new Set([Number(answer.toFixed(6))]);
  const base = Math.max(1, Math.round(Math.abs(answer) * 0.08), scale);
  const deltas = shuffle([-base * 3, -base * 2, -base, -Math.ceil(base / 2), Math.ceil(base / 2), base, base * 2, base * 3, -10, 10]);

  for (const delta of deltas) {
    if (drafts.length === 4) break;
    const candidate = answer + delta;
    const key = Number(candidate.toFixed(6));
    if (values.has(key)) continue;
    values.add(key);
    drafts.push({ label: Number.isInteger(candidate) ? String(candidate) : candidate.toFixed(2).replace(/\.?0+$/, ''), value: candidate, isCorrect: false });
  }

  while (drafts.length < 4) {
    const candidate = answer + rand(-base * 5, base * 5);
    const key = Number(candidate.toFixed(6));
    if (candidate === answer || values.has(key)) continue;
    values.add(key);
    drafts.push({ label: String(candidate), value: candidate, isCorrect: false });
  }

  return assignKeys(drafts);
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
  choices: AnswerChoice[] = numericChoices(answer, answerLabel),
  acceptedText: string[] = [],
): Exercise => ({
  id: crypto.randomUUID(),
  category,
  prompt,
  answer,
  answerLabel,
  choices,
  acceptedText,
  explanation,
  trainer: 'math',
});

const createByCategory = (category: Exclude<Category, 'mixed'>, level: Level): Exercise => {
  const range = rangeFor(level);

  if (category === 'addition') {
    const terms = level === 'level1' ? 2 : level === 'level2' ? 3 : rand(3, 4);
    const values = Array.from({ length: terms }, () => rand(range.min, range.max));
    const answer = values.reduce((sum, value) => sum + value, 0);
    return createExercise(category, values.join(' + '), answer, String(answer), `${values.join(' + ')} = ${answer}`);
  }

  if (category === 'subtraction') {
    const a = rand(range.max, range.max * 2);
    const b = rand(range.min, Math.min(a, range.max));
    const c = level === 'level1' ? 0 : rand(0, Math.min(a - b, range.multiplier));
    const answer = a - b - c;
    const prompt = c ? `${a} - ${b} - ${c}` : `${a} - ${b}`;
    return createExercise(category, prompt, answer, String(answer), `${prompt} = ${answer}`);
  }

  if (category === 'multiplication') {
    const special = pick([5, 11, 12, 25, rand(2, range.multiplier)]);
    const a = rand(2, range.multiplier + (level === 'level5' ? 10 : 0));
    const answer = a * special;
    return createExercise(category, `${a} × ${special}`, answer, String(answer), `${a} × ${special} = ${answer}`);
  }

  if (category === 'division') {
    const divisor = rand(2, range.multiplier);
    const quotient = rand(2, range.multiplier);
    const dividend = divisor * quotient;
    return createExercise(category, `${dividend} ÷ ${divisor}`, quotient, String(quotient), `${dividend} ÷ ${divisor} = ${quotient}`);
  }

  if (category === 'fractions') {
    const denominator = rand(2, range.denominator);
    const numerator = rand(1, denominator - 1);
    const extra = rand(1, denominator - 1);
    const subtract = level !== 'level1' && Math.random() > 0.55 && numerator > extra;
    const total = subtract ? numerator - extra : numerator + extra;
    const fraction = fractionChoices(total, denominator);
    const op = subtract ? '-' : '+';
    return createExercise(category, `${numerator}/${denominator} ${op} ${extra}/${denominator}`, fraction.answer, fraction.answerLabel, `Opera numeradores: ${total}/${denominator}. Simplificado: ${fraction.answerLabel}`, fraction.choices, [fraction.answerLabel, `${total}/${denominator}`]);
  }

  if (category === 'percentages') {
    const percent = pick([5, 10, 12.5, 15, 20, 25, 30, 35, 40, 50, 75]);
    const base = rand(4, 60) * 10;
    const answer = (base * percent) / 100;
    return createExercise(category, `${percent}% de ${base}`, answer, String(answer), `${base} × ${percent}/100 = ${answer}`, numericChoices(answer, String(answer), 5));
  }

  if (category === 'ratios') {
    const a = rand(2, 6);
    const b = rand(3, 9);
    const k = rand(4, 12);
    const total = (a + b) * k;
    const answer = b * k;
    return createExercise(category, `A:B = ${a}:${b}; A+B=${total}; halla B`, answer, String(answer), `${a + b} partes = ${total}. 1 parte = ${k}. B = ${b} × ${k} = ${answer}`);
  }

  if (category === 'divisibility') {
    const type = pick(['mcd', 'mcm', 'simplify'] as const);
    const a = rand(2, 12) * 6;
    const b = rand(2, 12) * 6;
    if (type === 'mcd') return createExercise(category, `MCD(${a}, ${b})`, gcd(a, b), String(gcd(a, b)), `MCD(${a}, ${b}) = ${gcd(a, b)}`);
    if (type === 'mcm') return createExercise(category, `MCM(${a}, ${b})`, lcm(a, b), String(lcm(a, b)), `MCM(${a}, ${b}) = ${lcm(a, b)}`, numericChoices(lcm(a, b), String(lcm(a, b)), 12));
    const numerator = a * rand(2, 5);
    const denominator = b * rand(2, 5);
    const reduced = fractionText(numerator, denominator);
    const [n, d] = reduced.split('/').map(Number);
    return createExercise(category, `Simplifica ${numerator}/${denominator}`, n / d, reduced, `Divide por el MCD y queda ${reduced}`, fractionChoices(n, d).choices, [reduced]);
  }

  if (category === 'averages') {
    const values = [rand(10, 18), rand(10, 18), rand(10, 18)];
    const target = rand(12, 18);
    const x = target * 4 - values.reduce((sum, value) => sum + value, 0);
    return createExercise(category, `Promedio de ${values.join(', ')} y x es ${target}. x=?`, x, String(x), `Suma total = ${target} × 4 = ${target * 4}. x = ${x}`);
  }

  if (category === 'powers') {
    const base = rand(2, level === 'level5' ? 15 : 12);
    const exponent = rand(2, range.exponent);
    const answer = Math.pow(base, exponent);
    const prompt = `${base}${superscripts[exponent] ?? `^${exponent}`}`;
    return createExercise(category, prompt, answer, String(answer), `${prompt} = ${answer}`, numericChoices(answer, String(answer), base));
  }

  if (category === 'roots') {
    const root = rand(2, level === 'level5' ? 30 : 22);
    const value = root * root;
    return createExercise(category, `√${value}`, root, String(root), `√${value} = ${root}`);
  }

  if (category === 'algebra') {
    const x = rand(1, range.multiplier);
    const a = level === 'level1' ? 1 : rand(2, Math.min(8, range.multiplier));
    const b = rand(2, range.max);
    const total = a * x + b;
    const prompt = a === 1 ? `x + ${b} = ${total}` : `${a}x + ${b} = ${total}`;
    return createExercise(category, prompt, x, String(x), `x = (${total} - ${b}) ÷ ${a} = ${x}`);
  }

  if (category === 'combined') {
    const a = rand(2, range.multiplier);
    const b = rand(2, range.multiplier);
    const c = rand(range.min, range.max);
    const answer = c + a * b;
    return createExercise(category, `${c} + ${a} × ${b}`, answer, String(answer), `Primero multiplicas: ${a} × ${b} = ${a * b}. Luego ${c} + ${a * b} = ${answer}`);
  }

  if (category === 'series') {
    const start = rand(2, 30);
    const step = rand(2, level === 'level5' ? 18 : 10);
    const series = Array.from({ length: 4 }, (_, index) => start + step * index);
    const answer = start + step * 4;
    return createExercise(category, `${series.join(', ')}, ?`, answer, String(answer), `La diferencia es ${step}. Siguiente: ${answer}`);
  }

  const price = rand(8, 60);
  const units = rand(2, 8);
  const paid = price * units + rand(5, 50);
  const answer = paid - price * units;
  return createExercise(category, `${units} × ${price}; pago ${paid}; cambio = ?`, answer, String(answer), `${units} × ${price} = ${price * units}. ${paid} - ${price * units} = ${answer}`);
};

export const generateExercises = (config: TrainingConfig): Exercise[] =>
  Array.from({ length: config.amount }, () => createByCategory(config.category === 'mixed' ? pick(concreteCategories) : config.category, config.level));

export const generateFlashAnzanExercise = (config: AnzanConfig): AnzanExercise => {
  const min = config.digits <= 1 ? 1 : Math.pow(10, config.digits - 1);
  const max = Math.pow(10, config.digits) - 1;
  let total = 0;

  const terms: AnzanTerm[] = Array.from({ length: config.terms }, (_, index) => {
    const value = rand(min, max);
    const canSubtract = config.operationMode === 'additionSubtraction' && index > 0 && total > value;
    const signedValue = canSubtract && Math.random() > 0.55 ? -value : value;
    total += signedValue;
    return { id: crypto.randomUUID(), value, signedValue, label: `${signedValue >= 0 ? '+' : '-'} ${value}` };
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
