// Dificultad adaptativa invisible: peldaños 1-10 dentro de cada nivel.
// 3 aciertos dentro del tiempo objetivo suben (rápidos cuentan doble); 2 fallos seguidos bajan.

import type { Exercise, Level, PracticeTopic } from '../types';
import { createByTopic } from './exerciseGenerator';
import { pick } from './random';

export const LADDER_STORAGE_KEY = 'trainermath-v3:ladder';

export type LadderEvent =
  | { type: 'up'; rung: number }
  | { type: 'down'; rung: number }
  | { type: 'hold'; rung: number };

const categoryTargetFactor: Record<string, number> = {
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
};

const clampRung = (value: number) => Math.max(1, Math.min(10, Math.round(value)));

type LadderStore = Record<string, number>;

const readStore = (): LadderStore => {
  try {
    const raw = localStorage.getItem(LADDER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as LadderStore) : {};
  } catch {
    return {};
  }
};

const writeStore = (store: LadderStore) => {
  try {
    localStorage.setItem(LADDER_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage puede fallar en contextos restringidos.
  }
};

export class SessionLadder {
  private readonly level: Level;
  private readonly topics: PracticeTopic[];
  private currentRung: number;
  private streak = 0;
  private misses = 0;
  private readonly rungHistory: number[] = [];
  private lastCategory = 'multiplication';

  constructor(opts: { level: Level; topics: PracticeTopic[]; startRung?: number }) {
    this.level = opts.level;
    this.topics = opts.topics.length ? opts.topics : ['mixed'];
    const stored = readStore()[this.storeKey()];
    this.currentRung = clampRung(opts.startRung ?? stored ?? 3);
  }

  private storeKey() {
    return `${this.level}|${[...this.topics].sort().join(',')}`;
  }

  get rung() {
    return this.currentRung;
  }

  next(): Exercise {
    let exercise = createByTopic(pick(this.topics), this.level, this.currentRung);
    for (let attempt = 0; attempt < 10 && exercise.answer <= 1; attempt += 1) {
      exercise = createByTopic(pick(this.topics), this.level, this.currentRung);
    }
    this.rungHistory.push(this.currentRung);
    this.lastCategory = exercise.category;
    return exercise;
  }

  report(result: { isCorrect: boolean; responseTimeMs: number }): LadderEvent {
    const factor = categoryTargetFactor[this.lastCategory] ?? 1;
    const targetMs = Math.max(3000, Math.min(9000, 4200 * factor));

    if (result.isCorrect) {
      this.misses = 0;
      if (result.responseTimeMs < 0.4 * targetMs) this.streak += 2;
      else if (result.responseTimeMs <= targetMs) this.streak += 1;
      if (this.streak >= 3) {
        this.streak = 0;
        if (this.currentRung < 10) {
          this.currentRung += 1;
          return { type: 'up', rung: this.currentRung };
        }
      }
      return { type: 'hold', rung: this.currentRung };
    }

    this.streak = 0;
    this.misses += 1;
    if (this.misses >= 2) {
      this.misses = 0;
      if (this.currentRung > 1) {
        this.currentRung -= 1;
        return { type: 'down', rung: this.currentRung };
      }
    }
    return { type: 'hold', rung: this.currentRung };
  }

  summary() {
    const history = this.rungHistory.length ? this.rungHistory : [this.currentRung];
    return {
      avgRung: history.reduce((sum, value) => sum + value, 0) / history.length,
      peakRung: Math.max(...history),
      endRung: this.currentRung,
    };
  }

  /** Persiste el rung final (menos 1, arranque cómodo la próxima sesión). */
  persist() {
    const store = readStore();
    store[this.storeKey()] = Math.max(1, this.currentRung - 1);
    writeStore(store);
  }
}
