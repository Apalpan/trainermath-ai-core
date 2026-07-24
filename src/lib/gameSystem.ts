// Capa de juego GEN+: combos, XP, rangos, meta diaria y récords.
// El ELO (scoring.ts) sigue siendo la única métrica de habilidad; el XP es feedback,
// nunca gatea el rango. Todo vive en localStorage.

import type { DrillKind, Level } from '../types';

const XP_KEY = 'trainermath-v3:game:xp';
const DAILY_KEY = 'trainermath-v3:game:daily';
const STREAK_KEY = 'trainermath-v3:game:streak';
const RECORDS_KEY = 'trainermath-v3:game:records';

/* ---------- combo ---------- */

export interface ComboTier {
  min: number;
  multiplier: number;
  label: string;
  /** 0..4 — la UI mapea a la rampa de chroma azul→cyan */
  tier: 0 | 1 | 2 | 3 | 4;
}

export const COMBO_TIERS: ComboTier[] = [
  { min: 0, multiplier: 1.0, label: '', tier: 0 },
  { min: 3, multiplier: 1.2, label: 'En racha', tier: 1 },
  { min: 6, multiplier: 1.5, label: 'Caliente', tier: 2 },
  { min: 10, multiplier: 2.0, label: 'Imparable', tier: 3 },
  { min: 18, multiplier: 3.0, label: 'Flow', tier: 4 },
];

export const getComboTier = (combo: number): ComboTier => {
  for (let index = COMBO_TIERS.length - 1; index >= 0; index -= 1) {
    if (combo >= COMBO_TIERS[index].min) return COMBO_TIERS[index];
  }
  return COMBO_TIERS[0];
};

/** Umbrales que disparan celebración (sonido + flare). */
export const isComboMilestone = (combo: number) => COMBO_TIERS.some((tier) => tier.min === combo && tier.tier > 0);

/* ---------- XP ---------- */

const XP_BASE = 10;

const levelXpMultiplier: Record<Level, number> = {
  level1: 1.0,
  level2: 1.3,
  level3: 1.6,
  level4: 2.0,
  level5: 2.5,
};

const baseTargetMs: Record<Level, number> = {
  level1: 6000,
  level2: 7000,
  level3: 8500,
  level4: 10000,
  level5: 12000,
};

const drillTargetFactor: Partial<Record<DrillKind, number>> = {
  operations: 1.0,
  multiplicationSprint: 0.7,
  cepreExam: 1.3,
  flashAnzan: 0.45,
  doubleX2: 0.6,
  flashCards: 0.8,
};

export const getTargetTimeMs = (level: Level, drill: DrillKind, targetTimeSec?: number) => {
  if (targetTimeSec) return targetTimeSec * 1000;
  return baseTargetMs[level] * (drillTargetFactor[drill] ?? 1);
};

export const computeXp = (params: {
  isCorrect: boolean;
  level: Level;
  responseTimeMs: number;
  targetTimeMs: number;
  comboAfterAnswer: number;
}): number => {
  if (!params.isCorrect) return 0;
  const base = XP_BASE * levelXpMultiplier[params.level];
  const ratio = params.responseTimeMs / params.targetTimeMs;
  const speedBonus = ratio >= 1 ? 0 : base * 0.5 * Math.min(1, (1 - ratio) / 0.6);
  const tier = getComboTier(params.comboAfterAnswer);
  return Math.round((base + speedBonus) * tier.multiplier);
};

interface XpState {
  lifetimeXp: number;
  todayXp: number;
  todayDateISO: string;
}

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const isoDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage puede fallar en contextos restringidos.
  }
};

export const loadXp = (): XpState => {
  const stored = readJson<XpState>(XP_KEY, { lifetimeXp: 0, todayXp: 0, todayDateISO: todayISO() });
  if (stored.todayDateISO !== todayISO()) return { ...stored, todayXp: 0, todayDateISO: todayISO() };
  return stored;
};

export const addXp = (amount: number): XpState => {
  const current = loadXp();
  const next = { lifetimeXp: current.lifetimeXp + amount, todayXp: current.todayXp + amount, todayDateISO: todayISO() };
  writeJson(XP_KEY, next);
  return next;
};

/* ---------- rangos GEN+ (función pura del ELO) ---------- */

export interface RankDef {
  id: string;
  name: string;
  minElo: number;
  maxElo: number;
  tagline: string;
  /** 0..8 — chroma del badge sube con el rango */
  index: number;
}

export const RANKS: RankDef[] = [
  { id: 'aprendiz', name: 'Aprendiz Neural', minElo: 500, maxElo: 899, tagline: 'Primeras conexiones activas', index: 0 },
  { id: 'calculista', name: 'Calculista', minElo: 900, maxElo: 1199, tagline: 'Automatiza las bases', index: 1 },
  { id: 'operador', name: 'Operador Rápido', minElo: 1200, maxElo: 1499, tagline: 'Velocidad con control', index: 2 },
  { id: 'sinapsis', name: 'Sinapsis Activa', minElo: 1500, maxElo: 1799, tagline: 'Rutas mentales más cortas', index: 3 },
  { id: 'nucleo', name: 'Núcleo Lógico', minElo: 1800, maxElo: 2199, tagline: 'Precisión bajo presión', index: 4 },
  { id: 'procesador', name: 'Procesador Élite', minElo: 2200, maxElo: 2599, tagline: 'Cálculo casi automático', index: 5 },
  { id: 'arquitecto', name: 'Arquitecto Mental', minElo: 2600, maxElo: 2999, tagline: 'Diseña la estrategia numérica', index: 6 },
  { id: 'maestro', name: 'Sistema Neural Maestro', minElo: 3000, maxElo: 3299, tagline: 'Dominio integral del cálculo', index: 7 },
  { id: 'singularidad', name: 'Singularidad GEN+', minElo: 3300, maxElo: 3500, tagline: 'El límite superior del sistema', index: 8 },
];

export const getRankForElo = (elo: number): RankDef =>
  RANKS.find((rank) => elo >= rank.minElo && elo <= rank.maxElo) ?? (elo < 500 ? RANKS[0] : RANKS[RANKS.length - 1]);

export const getNextRank = (rank: RankDef): RankDef | null => RANKS[rank.index + 1] ?? null;

export const getRankProgress = (elo: number): number => {
  const rank = getRankForElo(elo);
  const next = getNextRank(rank);
  if (!next) return 1;
  return Math.min(1, Math.max(0, (elo - rank.minElo) / (next.minElo - rank.minElo)));
};

/* ---------- meta diaria + racha de días ---------- */

export interface DailyGoalState {
  targetOps: number;
  completedOpsToday: number;
  dateISO: string;
}

export const DAILY_GOAL_PRESETS = [25, 50, 100] as const;

export const loadDailyGoal = (): DailyGoalState => {
  const stored = readJson<DailyGoalState>(DAILY_KEY, { targetOps: 50, completedOpsToday: 0, dateISO: todayISO() });
  if (stored.dateISO !== todayISO()) return { targetOps: stored.targetOps, completedOpsToday: 0, dateISO: todayISO() };
  return stored;
};

export const setDailyTarget = (targetOps: number): DailyGoalState => {
  const next = { ...loadDailyGoal(), targetOps };
  writeJson(DAILY_KEY, next);
  return next;
};

export interface StreakState {
  dayStreak: number;
  bestDayStreak: number;
  lastActiveDateISO: string | null;
}

export const loadDayStreak = (): StreakState =>
  readJson<StreakState>(STREAK_KEY, { dayStreak: 0, bestDayStreak: 0, lastActiveDateISO: null });

/** +1 operación al día. Devuelve el estado y si la meta se acaba de cumplir (celebración). */
export const registerOperation = (): { daily: DailyGoalState; streak: StreakState; goalJustCompleted: boolean } => {
  const daily = loadDailyGoal();
  const wasComplete = daily.completedOpsToday >= daily.targetOps;
  const nextDaily = { ...daily, completedOpsToday: daily.completedOpsToday + 1 };
  writeJson(DAILY_KEY, nextDaily);

  let streak = loadDayStreak();
  const goalJustCompleted = !wasComplete && nextDaily.completedOpsToday >= nextDaily.targetOps;
  if (goalJustCompleted && streak.lastActiveDateISO !== todayISO()) {
    const continued = streak.lastActiveDateISO === isoDaysAgo(1);
    const dayStreak = continued ? streak.dayStreak + 1 : 1;
    streak = { dayStreak, bestDayStreak: Math.max(streak.bestDayStreak, dayStreak), lastActiveDateISO: todayISO() };
    writeJson(STREAK_KEY, streak);
  }
  return { daily: nextDaily, streak, goalJustCompleted };
};

/* ---------- récords ---------- */

export interface RecordsState {
  bestComboEver: number;
  bestComboDrill: DrillKind | null;
  bestAccuracyByDrill: Partial<Record<DrillKind, number>>;
  bestEloEver: number;
}

export const loadRecords = (): RecordsState =>
  readJson<RecordsState>(RECORDS_KEY, { bestComboEver: 0, bestComboDrill: null, bestAccuracyByDrill: {}, bestEloEver: 0 });

export interface SessionRecordResult {
  newBestCombo: boolean;
  newBestAccuracy: boolean;
  newBestElo: boolean;
}

export const registerSessionRecords = (params: {
  drill: DrillKind;
  bestComboSession: number;
  accuracy: number;
  generalElo: number;
}): SessionRecordResult => {
  const records = loadRecords();
  const result: SessionRecordResult = { newBestCombo: false, newBestAccuracy: false, newBestElo: false };

  if (params.bestComboSession > records.bestComboEver && params.bestComboSession >= 5) {
    records.bestComboEver = params.bestComboSession;
    records.bestComboDrill = params.drill;
    result.newBestCombo = true;
  }
  const bestAccuracy = records.bestAccuracyByDrill[params.drill] ?? 0;
  if (params.accuracy > bestAccuracy && params.accuracy >= 80) {
    records.bestAccuracyByDrill[params.drill] = params.accuracy;
    result.newBestAccuracy = true;
  }
  if (params.generalElo > records.bestEloEver) {
    const previous = records.bestEloEver;
    records.bestEloEver = params.generalElo;
    result.newBestElo = previous > 0;
  }
  writeJson(RECORDS_KEY, records);
  return result;
};

/* ---------- anti-frustración ---------- */

export const BREATHER_AFTER_FAILS = 3;
export const SOFT_EXIT_AFTER_FAILS = 5;
