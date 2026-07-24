// Flash cards de cálculo mental con repetición espaciada (Leitner simplificado, 3 cajas).
// Caja 0: nueva/fallada → reaparece en la misma sesión.
// Caja 1: acertada 1 vez → reaparece al día siguiente.
// Caja 2: dominada → reaparece a los 3 días.

export type FlashDeckId =
  | 'tablasExtendidas'
  | 'cuadrados'
  | 'cubos'
  | 'fraccionPorcentaje'
  | 'potenciasDe2'
  | 'complementos100'
  | 'complementos1000'
  | 'doblesMitades';

export type CardGrade = 'good' | 'fail';

export interface FlashCard {
  id: string;
  deckId: FlashDeckId;
  front: string;
  back: string;
  hint?: string;
}

export interface CardProgress {
  box: 0 | 1 | 2;
  lastSeen: number;
  streak: number;
}

export interface FlashCardsConfig {
  decks: FlashDeckId[];
  amount: number;
}

export interface FlashDeckMeta {
  id: FlashDeckId;
  title: string;
  description: string;
}

const PROGRESS_KEY = 'trainermath-v3:flashcards';
const DAY_MS = 24 * 60 * 60 * 1000;
const BOX_DELAY_MS: Record<CardProgress['box'], number> = { 0: 0, 1: DAY_MS, 2: 3 * DAY_MS };

export const flashDeckMetas: FlashDeckMeta[] = [
  { id: 'tablasExtendidas', title: 'Tablas 12–19', description: 'Productos que separan a los rápidos de los lentos' },
  { id: 'cuadrados', title: 'Cuadrados 11–25', description: 'Base de potencias y estimación' },
  { id: 'cubos', title: 'Cubos 2–12', description: 'Volumen mental instantáneo' },
  { id: 'fraccionPorcentaje', title: 'Fracción ↔ %', description: 'Equivalencias que se responden sin calcular' },
  { id: 'potenciasDe2', title: 'Potencias de 2', description: 'De 2¹ a 2¹⁶, la columna vertebral binaria' },
  { id: 'complementos100', title: 'Complementos a 100', description: '¿Cuánto falta para 100?' },
  { id: 'complementos1000', title: 'Complementos a 1000', description: '¿Cuánto falta para 1000?' },
  { id: 'doblesMitades', title: 'Dobles y mitades', description: 'Duplicar y partir sin fricción' },
];

const superscript: Record<number, string> = { 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', 10: '¹⁰', 11: '¹¹', 12: '¹²', 13: '¹³', 14: '¹⁴', 15: '¹⁵', 16: '¹⁶' };

const buildDeck = (deckId: FlashDeckId): FlashCard[] => {
  const cards: FlashCard[] = [];
  const add = (key: string, front: string, back: string, hint?: string) => {
    cards.push({ id: `${deckId}:${key}`, deckId, front, back, hint });
  };

  if (deckId === 'tablasExtendidas') {
    for (let a = 12; a <= 19; a += 1) {
      for (let b = a; b <= 19; b += 1) {
        add(`${a}x${b}`, `${a} × ${b}`, String(a * b), b === a ? undefined : `${a} × ${b} = ${a} × ${b - 10} + ${a * 10}`);
      }
    }
  }

  if (deckId === 'cuadrados') {
    for (let n = 11; n <= 25; n += 1) {
      const hint = n % 10 === 5 ? `Truco a5²: ${Math.floor(n / 10)} × ${Math.floor(n / 10) + 1}, y pega 25` : undefined;
      add(`${n}2`, `${n}²`, String(n * n), hint);
    }
  }

  if (deckId === 'cubos') {
    for (let n = 2; n <= 12; n += 1) add(`${n}3`, `${n}³`, String(n * n * n));
  }

  if (deckId === 'fraccionPorcentaje') {
    const pairs: Array<[string, string, string?]> = [
      ['1/2', '50%'], ['1/3', '33.3%'], ['2/3', '66.7%'], ['1/4', '25%'], ['3/4', '75%'],
      ['1/5', '20%'], ['2/5', '40%'], ['3/5', '60%'], ['4/5', '80%'], ['1/6', '16.7%'],
      ['5/6', '83.3%'], ['1/8', '12.5%'], ['3/8', '37.5%'], ['5/8', '62.5%'], ['7/8', '87.5%'],
      ['1/10', '10%'], ['1/16', '6.25%'], ['1/20', '5%'], ['1/25', '4%'], ['1/50', '2%'],
    ];
    for (const [fraction, percent, hint] of pairs) add(fraction.replace('/', '-'), fraction, percent, hint);
  }

  if (deckId === 'potenciasDe2') {
    for (let n = 1; n <= 16; n += 1) add(`2p${n}`, `2${superscript[n]}`, String(2 ** n));
  }

  if (deckId === 'complementos100') {
    const values = [17, 23, 28, 34, 37, 41, 46, 52, 58, 63, 67, 71, 76, 82, 89, 94];
    for (const value of values) add(`c${value}`, `${value} + ¿? = 100`, String(100 - value), 'Unidades a 10, decenas a 9');
  }

  if (deckId === 'complementos1000') {
    const values = [125, 216, 288, 341, 415, 473, 562, 618, 674, 729, 786, 843, 892, 937];
    for (const value of values) add(`c${value}`, `${value} + ¿? = 1000`, String(1000 - value), 'Unidades a 10, resto a 9');
  }

  if (deckId === 'doblesMitades') {
    const doubles = [47, 68, 76, 89, 126, 148, 173, 235, 268, 347, 429, 486];
    const halves = [76, 94, 132, 158, 246, 348, 426, 572, 634, 758, 846, 918];
    for (const value of doubles) add(`d${value}`, `Doble de ${value}`, String(value * 2));
    for (const value of halves) add(`m${value}`, `Mitad de ${value}`, String(value / 2));
  }

  return cards;
};

const deckCache = new Map<FlashDeckId, FlashCard[]>();

export const getDeckCards = (deckId: FlashDeckId): FlashCard[] => {
  if (!deckCache.has(deckId)) deckCache.set(deckId, buildDeck(deckId));
  return deckCache.get(deckId)!;
};

export const getDeckSize = (deckId: FlashDeckId) => getDeckCards(deckId).length;

type ProgressMap = Record<string, CardProgress>;

export const loadCardProgress = (): ProgressMap => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as ProgressMap) : {};
  } catch {
    return {};
  }
};

const saveCardProgress = (progress: ProgressMap) => {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // localStorage puede fallar en contextos restringidos.
  }
};

export const gradeCard = (cardId: string, grade: CardGrade): CardProgress => {
  const progress = loadCardProgress();
  const current = progress[cardId] ?? { box: 0 as const, lastSeen: 0, streak: 0 };
  const next: CardProgress =
    grade === 'good'
      ? { box: Math.min(2, current.box + 1) as CardProgress['box'], lastSeen: Date.now(), streak: current.streak + 1 }
      : { box: 0, lastSeen: Date.now(), streak: 0 };
  progress[cardId] = next;
  saveCardProgress(progress);
  return next;
};

const isDue = (card: FlashCard, progress: ProgressMap, now: number) => {
  const state = progress[card.id];
  if (!state) return true;
  return now - state.lastSeen >= BOX_DELAY_MS[state.box];
};

/** Cola de sesión: primero vencidas (caja baja primero), luego nuevas, luego refresco de dominadas. */
export const buildSessionQueue = (decks: FlashDeckId[], amount: number): FlashCard[] => {
  const progress = loadCardProgress();
  const now = Date.now();
  const all = decks.flatMap(getDeckCards);
  const fresh = all.filter((card) => !progress[card.id]);
  const due = all
    .filter((card) => progress[card.id] && isDue(card, progress, now))
    .sort((a, b) => (progress[a.id]?.box ?? 0) - (progress[b.id]?.box ?? 0));
  const rest = all.filter((card) => progress[card.id] && !isDue(card, progress, now))
    .sort((a, b) => (progress[a.id]?.lastSeen ?? 0) - (progress[b.id]?.lastSeen ?? 0));

  const interleaved: FlashCard[] = [];
  const pools = [due, fresh, rest];
  for (const pool of pools) {
    for (const card of pool) {
      if (interleaved.length >= amount) break;
      interleaved.push(card);
    }
  }
  return shuffleQueue(interleaved);
};

/** Baraja evitando dos cartas seguidas del mismo mazo cuando es posible. */
const shuffleQueue = (cards: FlashCard[]): FlashCard[] => {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  for (let index = 1; index < shuffled.length; index += 1) {
    if (shuffled[index].deckId === shuffled[index - 1].deckId) {
      const swap = shuffled.findIndex((card, cursor) => cursor > index && card.deckId !== shuffled[index - 1].deckId);
      if (swap > 0) [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
    }
  }
  return shuffled;
};

export interface FlashDeckStats {
  total: number;
  mastered: number;
  learning: number;
  fresh: number;
}

export const getDeckStats = (deckId: FlashDeckId): FlashDeckStats => {
  const progress = loadCardProgress();
  const cards = getDeckCards(deckId);
  let mastered = 0;
  let learning = 0;
  let fresh = 0;
  for (const card of cards) {
    const state = progress[card.id];
    if (!state) fresh += 1;
    else if (state.box === 2) mastered += 1;
    else learning += 1;
  }
  return { total: cards.length, mastered, learning, fresh };
};
