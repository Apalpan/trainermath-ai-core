import { useCallback, useEffect, useMemo, useState } from 'react';
import './trainer.css';
import type { FlashDeckId } from '../../lib/flashCards';
import { getNextRank, getRankForElo, loadDailyGoal, loadDayStreak, registerSessionRecords, addXp } from '../../lib/gameSystem';
import type { RankDef } from '../../lib/gameSystem';
import {
  calculateAnzanSessionMetrics,
  calculateBlitzMetrics,
  calculateCepreMetrics,
  calculateDigitSpanMetrics,
  calculateDoubleX2Metrics,
  calculateFlashCardsMetrics,
  calculateMetrics,
  calculateMultiplicationMetrics,
} from '../../lib/scoring';
import { analyzeSessions } from '../../lib/sessionAnalytics';
import { flushSheetSync, getPendingSyncCount, getSheetEndpoint, queueSheetSync, setSheetEndpoint } from '../../lib/sheetSync';
import { isSoundEnabled, playRankUp, playSessionComplete, setSoundEnabled } from '../../lib/soundEngine';
import { loadSessions, saveSession, updateSessionSyncStatus } from '../../lib/storage';
import type {
  AnzanConfig,
  BlitzConfig,
  CepreConfig,
  DigitSpanConfig,
  DoubleX2Config,
  DrillKind,
  MultiplicationConfig,
  TrainingConfig,
  TrainingSession,
  UserAnswer,
} from '../../types';
import ArenaScreen from './screens/ArenaScreen';
import type { ArenaResult } from './screens/ArenaScreen';
import AnzanScreen from './screens/AnzanScreen';
import type { AnzanResult } from './screens/AnzanScreen';
import BlitzScreen from './screens/BlitzScreen';
import type { BlitzResult } from './screens/BlitzScreen';
import DigitSpanScreen from './screens/DigitSpanScreen';
import type { DigitSpanResult } from './screens/DigitSpanScreen';
import FlashCardsScreen from './screens/FlashCardsScreen';
import type { FlashCardsResult } from './screens/FlashCardsScreen';
import HomeScreen, { SheetSyncPanel } from './screens/HomeScreen';
import ResultsScreen from './screens/ResultsScreen';
import type { GameOutcome } from './screens/ResultsScreen';
import SetupScreen from './screens/SetupScreen';
import type { FlashCardsSetup } from './screens/SetupScreen';
import X2Screen from './screens/X2Screen';
import type { X2Result } from './screens/X2Screen';

type Screen = 'home' | 'setup' | 'arena' | 'results';
type TrainerTheme = 'dark' | 'light';

const THEME_KEY = 'trainermath-v2:theme';
const CONFIGS_KEY = 'trainermath-v3:configs';

const defaultOperations: TrainingConfig = {
  level: 'level2',
  category: 'mixed',
  topics: ['mixed'],
  amount: 25,
  mode: 'mixed',
  instantFeedback: true,
};

const defaultAnzan: AnzanConfig = {
  digits: 2,
  terms: 8,
  displayMs: 750,
  operationMode: 'addition',
  advanceMode: 'timed',
  instantFeedback: true,
  preset: 'medium',
  rounds: 5,
  progression: 'speed',
};

const defaultCepre: CepreConfig = {
  block: 'mixed',
  level: 'level2',
  amount: 20,
  mode: 'practice',
  instantFeedback: true,
};

const defaultMultiplication: MultiplicationConfig = {
  level: 'level2',
  amount: 30,
  mode: 'speed',
  multiplicationType: 'mixed',
  chainFactorCount: 3,
  instantFeedback: true,
};

const defaultX2: DoubleX2Config = { start: 12, stepLimit: 20 };

const defaultFlashCards: FlashCardsSetup = { decks: ['tablasExtendidas', 'cuadrados', 'fraccionPorcentaje'], amount: 15 };

const defaultBlitz: BlitzConfig = { level: 'level2', category: 'mixed', topics: ['mixed'], durationSec: 60 };

const defaultDigitSpan: DigitSpanConfig = { rounds: 10 };

const readTheme = (): TrainerTheme => {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

interface StoredConfigs {
  operations?: TrainingConfig;
  multiplication?: MultiplicationConfig;
  anzan?: AnzanConfig;
  x2?: DoubleX2Config;
  cepre?: CepreConfig;
  flashCards?: FlashCardsSetup;
  blitz?: BlitzConfig;
  digitSpan?: DigitSpanConfig;
}

const readConfigs = (): StoredConfigs => {
  try {
    const raw = localStorage.getItem(CONFIGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as StoredConfigs) : {};
  } catch {
    return {};
  }
};

export default function TrainerMathApp() {
  const stored = useMemo(readConfigs, []);
  const [screen, setScreen] = useState<Screen>('home');
  const [theme, setTheme] = useState<TrainerTheme>(readTheme);
  const [drill, setDrill] = useState<DrillKind>('operations');
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  // key estable por partida: solo cambia al INICIAR una partida nueva, nunca en re-renders
  const [runId, setRunId] = useState(0);

  const startRun = useCallback(() => {
    setRunId((value) => value + 1);
    setScreen('arena');
  }, []);

  const [operations, setOperations] = useState<TrainingConfig>({ ...defaultOperations, ...stored.operations });
  const [multiplication, setMultiplication] = useState<MultiplicationConfig>({ ...defaultMultiplication, ...stored.multiplication });
  const [anzan, setAnzan] = useState<AnzanConfig>({ ...defaultAnzan, ...stored.anzan });
  const [x2, setX2] = useState<DoubleX2Config>({ ...defaultX2, ...stored.x2 });
  const [cepre, setCepre] = useState<CepreConfig>({ ...defaultCepre, ...stored.cepre });
  const [flashCards, setFlashCards] = useState<FlashCardsSetup>({ ...defaultFlashCards, ...stored.flashCards });
  const [blitz, setBlitz] = useState<BlitzConfig>({ ...defaultBlitz, ...stored.blitz });
  const [digitSpan, setDigitSpan] = useState<DigitSpanConfig>({ ...defaultDigitSpan, ...stored.digitSpan });

  const [sheetEndpoint, setSheetEndpointState] = useState('');
  const [syncPending, setSyncPending] = useState(0);
  const [syncMessage, setSyncMessage] = useState('Conecta Apps Script solo si quieres enviar tus intentos al Sheet.');
  const [showSheetPanel, setShowSheetPanel] = useState(false);

  useEffect(() => {
    setSessions(loadSessions());
    setSheetEndpointState(getSheetEndpoint());
    setSyncPending(getPendingSyncCount());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.background = theme === 'light' ? '#f3f5f9' : '#0b0e14';
    } catch {
      // localStorage puede fallar en contextos restringidos.
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(CONFIGS_KEY, JSON.stringify({ operations, multiplication, anzan, x2, cepre, flashCards, blitz, digitSpan }));
    } catch {
      // localStorage puede fallar en contextos restringidos.
    }
  }, [anzan, blitz, cepre, digitSpan, flashCards, multiplication, operations, x2]);

  const insights = useMemo(() => analyzeSessions(sessions), [sessions]);
  const daily = useMemo(() => loadDailyGoal(), [screen]);
  const dayStreak = useMemo(() => loadDayStreak(), [screen]);

  const persistSession = useCallback((session: TrainingSession) => {
    const pendingSession: TrainingSession = { ...session, syncStatus: 'pending' };
    setSessions(saveSession(pendingSession));
    const pending = queueSheetSync(pendingSession);
    setSyncPending(pending);
    void flushSheetSync().then((result) => {
      setSyncPending(result.pending);
      if (!result.configured) {
        setSyncMessage(`${result.pending} intento(s) en cola local. Conecta Apps Script para enviarlos.`);
        return;
      }
      const status = result.pending === 0 ? 'synced' : 'pending';
      setSessions(updateSessionSyncStatus(session.id, status));
      setSyncMessage(result.sent > 0 ? `Se enviaron ${result.sent} intento(s) al Sheet.` : 'Sin intentos pendientes por enviar.');
    });
  }, []);

  const completeSession = useCallback((session: TrainingSession, runStats: { xpEarned: number; bestCombo: number }) => {
    const previousElo = sessions[0]?.metrics.generalElo ?? sessions[0]?.metrics.elo ?? 1000;
    const rankBefore: RankDef = getRankForElo(previousElo);
    const newElo = session.metrics.generalElo ?? session.metrics.elo ?? previousElo;
    const rankAfter: RankDef = getRankForElo(newElo);

    const records = registerSessionRecords({
      drill: session.kind,
      bestComboSession: runStats.bestCombo,
      accuracy: session.metrics.accuracy,
      generalElo: newElo,
    });
    if (runStats.xpEarned > 0) addXp(runStats.xpEarned);

    session.metrics.xpEarned = runStats.xpEarned;
    session.metrics.bestCombo = runStats.bestCombo;
    persistSession(session);
    setOutcome({ xpEarned: runStats.xpEarned, bestCombo: runStats.bestCombo, records, rankBefore, rankAfter });
    if (rankAfter.index > rankBefore.index) playRankUp();
    else playSessionComplete();
    setScreen('results');
  }, [persistSession, sessions]);

  /* ---------- completions por drill ---------- */

  const onArenaComplete = useCallback((result: ArenaResult) => {
    const base = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      answers: result.answers,
    };
    let session: TrainingSession;
    if (drill === 'cepreExam') {
      session = { ...base, kind: 'cepreExam', config: cepre, metrics: calculateCepreMetrics(result.answers, result.totalTimeMs, cepre, sessions) };
    } else if (drill === 'multiplicationSprint') {
      session = { ...base, kind: 'multiplicationSprint', config: multiplication, metrics: calculateMultiplicationMetrics(result.answers, result.totalTimeMs, multiplication, sessions) };
    } else {
      const metrics = calculateMetrics(result.answers, result.totalTimeMs, operations, sessions);
      if (result.ladderSummary) {
        metrics.avgRung = Math.round(result.ladderSummary.avgRung * 10) / 10;
        metrics.peakRung = result.ladderSummary.peakRung;
        metrics.endRung = result.ladderSummary.endRung;
      }
      session = { ...base, kind: 'operations', config: operations, metrics };
    }
    completeSession(session, result);
  }, [cepre, completeSession, drill, multiplication, operations, sessions]);

  const onAnzanComplete = useCallback((result: AnzanResult) => {
    const session: TrainingSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      kind: 'flashAnzan',
      config: anzan,
      metrics: calculateAnzanSessionMetrics(result.answers, result.totalTimeMs, anzan, result.roundSnapshots, sessions),
      answers: result.answers,
    };
    completeSession(session, result);
  }, [anzan, completeSession, sessions]);

  const onX2Complete = useCallback((result: X2Result) => {
    if (result.history.length < 2) {
      setScreen('home');
      return;
    }
    const answers: UserAnswer[] = result.history.slice(1).map((value, index) => ({
      exerciseId: `x2-${index + 1}`,
      category: 'multiplication',
      prompt: `${result.history[index]} × 2`,
      input: String(value),
      correctAnswer: String(value),
      isCorrect: true,
      answeredAtMs: result.stepDurations.slice(0, index + 1).reduce((sum, time) => sum + time, 0),
      responseTimeMs: result.stepDurations[index] ?? (result.totalTimeMs / Math.max(1, result.history.length - 1)),
      trainer: 'math',
      topic: 'Multiplicar x2',
      microtopic: 'Duplicación progresiva',
      questionType: 'calculo',
      errorType: 'ninguno',
    }));
    const session: TrainingSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      kind: 'doubleX2',
      config: x2,
      metrics: calculateDoubleX2Metrics(answers, result.totalTimeMs, x2, result.history, sessions),
      answers,
    };
    completeSession(session, { xpEarned: Math.max(0, (result.history.length - 1) * 6), bestCombo: result.history.length - 1 });
  }, [completeSession, sessions, x2]);

  const onBlitzComplete = useCallback((result: BlitzResult) => {
    const metrics = calculateBlitzMetrics(result.answers, result.totalTimeMs, blitz, sessions);
    metrics.avgRung = Math.round(result.ladderSummary.avgRung * 10) / 10;
    metrics.peakRung = result.ladderSummary.peakRung;
    metrics.endRung = result.ladderSummary.endRung;
    const session: TrainingSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      kind: 'blitz',
      config: blitz,
      metrics,
      answers: result.answers,
    };
    completeSession(session, result);
  }, [blitz, completeSession, sessions]);

  const onDigitSpanComplete = useCallback((result: DigitSpanResult) => {
    const session: TrainingSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      kind: 'digitSpan',
      config: digitSpan,
      metrics: calculateDigitSpanMetrics(result.answers, result.totalTimeMs, result.spanHistory, sessions),
      answers: result.answers,
    };
    completeSession(session, result);
  }, [completeSession, digitSpan, sessions]);

  const onFlashCardsComplete = useCallback((result: FlashCardsResult) => {
    const session: TrainingSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      kind: 'flashCards',
      config: { decks: result.decks, amount: result.amount },
      metrics: calculateFlashCardsMetrics(result.answers, result.totalTimeMs, sessions),
      answers: result.answers,
    };
    completeSession(session, result);
  }, [completeSession, sessions]);

  /* ---------- sheet ---------- */

  const saveEndpointAndFlush = async () => {
    setSheetEndpoint(sheetEndpoint);
    const result = await flushSheetSync();
    setSyncPending(result.pending);
    setSyncMessage(result.configured
      ? `Endpoint guardado. Enviados: ${result.sent}. Pendientes: ${result.pending}.`
      : 'Endpoint vacío: los intentos se quedan en este dispositivo.');
  };

  const latestSession = sessions[0];

  return (
    <main className="tm-app" data-theme={theme} data-surface={screen === 'arena' ? 'focus' : undefined}>
      {screen === 'home' && (
        <HomeScreen
          sessions={sessions}
          insights={insights}
          daily={daily}
          dayStreak={dayStreak}
          theme={theme}
          soundOn={soundOn}
          sheetPanel={showSheetPanel ? (
            <SheetSyncPanel
              endpoint={sheetEndpoint}
              pending={syncPending}
              message={syncMessage}
              onEndpointChange={setSheetEndpointState}
              onSave={() => { void saveEndpointAndFlush(); }}
              onClose={() => setShowSheetPanel(false)}
            />
          ) : null}
          onSelectDrill={(nextDrill) => { setDrill(nextDrill); setScreen('setup'); }}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          onToggleSound={() => {
            setSoundOn((current) => {
              setSoundEnabled(!current);
              return !current;
            });
          }}
          onToggleSheetPanel={() => setShowSheetPanel((value) => !value)}
        />
      )}

      {screen === 'setup' && (
        <SetupScreen
          drill={drill}
          operations={operations}
          multiplication={multiplication}
          anzan={anzan}
          x2={x2}
          cepre={cepre}
          flashCards={flashCards}
          blitz={blitz}
          digitSpan={digitSpan}
          onChangeOperations={setOperations}
          onChangeMultiplication={setMultiplication}
          onChangeAnzan={setAnzan}
          onChangeX2={setX2}
          onChangeCepre={setCepre}
          onChangeFlashCards={setFlashCards}
          onChangeBlitz={setBlitz}
          onChangeDigitSpan={setDigitSpan}
          onStart={startRun}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'arena' && (drill === 'operations' || drill === 'multiplicationSprint' || drill === 'cepreExam') && (
        <ArenaScreen
          key={`${drill}-${runId}`}
          drill={drill}
          config={drill === 'operations' ? operations : drill === 'multiplicationSprint' ? multiplication : cepre}
          onComplete={onArenaComplete}
          onExit={() => setScreen('setup')}
        />
      )}

      {screen === 'arena' && drill === 'flashAnzan' && (
        <AnzanScreen key={`anzan-${runId}`} config={anzan} onComplete={onAnzanComplete} onExit={() => setScreen('setup')} />
      )}

      {screen === 'arena' && drill === 'doubleX2' && (
        <X2Screen key={`x2-${runId}`} config={x2} onComplete={onX2Complete} onExit={() => setScreen('setup')} />
      )}

      {screen === 'arena' && drill === 'flashCards' && (
        <FlashCardsScreen
          key={`cards-${runId}`}
          decks={flashCards.decks as FlashDeckId[]}
          amount={flashCards.amount}
          onComplete={onFlashCardsComplete}
          onExit={() => setScreen('home')}
        />
      )}

      {screen === 'arena' && drill === 'blitz' && (
        <BlitzScreen key={`blitz-${runId}`} config={blitz} onComplete={onBlitzComplete} onExit={() => setScreen('setup')} />
      )}

      {screen === 'arena' && drill === 'digitSpan' && (
        <DigitSpanScreen key={`span-${runId}`} config={digitSpan} onComplete={onDigitSpanComplete} onExit={() => setScreen('setup')} />
      )}

      {screen === 'results' && latestSession && outcome && (
        <ResultsScreen
          session={latestSession}
          outcome={outcome}
          onRepeat={startRun}
          onConfigure={() => setScreen('setup')}
          onHome={() => setScreen('home')}
        />
      )}
    </main>
  );
}
