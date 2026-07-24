// Sanity check del motor v3: invariantes de todos los generadores.
// Ejecutar: npx tsx scripts/engine-sanity.ts

import { generateExercises, generateFlashAnzanExercise, createByTopic, practiceTopics } from '../src/lib/exerciseGenerator';
import { generateMultiplicationExercises } from '../src/lib/multiplicationGenerator';
import { generateCepreExercises } from '../src/lib/cepreGenerator';
import type { Exercise, Level, PracticeTopic } from '../src/types';

let failures = 0;
const fail = (message: string) => {
  failures += 1;
  console.error('FAIL:', message);
};

const checkExercise = (exercise: Exercise, context: string) => {
  const { choices, answer } = exercise;
  if (choices.length !== 4) fail(`${context}: ${choices.length} opciones — «${exercise.prompt}»`);
  const correct = choices.filter((choice) => choice.isCorrect);
  if (correct.length !== 1) fail(`${context}: ${correct.length} correctas — «${exercise.prompt}»`);
  if (correct[0] && Math.abs(correct[0].value - answer) > 1e-6) {
    fail(`${context}: opción correcta ${correct[0].value} ≠ answer ${answer} — «${exercise.prompt}»`);
  }
  const values = new Set(choices.map((choice) => choice.value.toFixed(6)));
  if (values.size !== 4) fail(`${context}: opciones duplicadas — «${exercise.prompt}» → ${choices.map((c) => c.label).join(', ')}`);
  const labels = new Set(choices.map((choice) => choice.label));
  if (labels.size !== 4) fail(`${context}: labels duplicados — «${exercise.prompt}» → ${choices.map((c) => c.label).join(', ')}`);
  const keys = [...choices.map((choice) => choice.key)].sort().join('');
  if (keys !== 'ABCD') fail(`${context}: keys ${keys} — «${exercise.prompt}»`);
  if (exercise.category !== 'fractions' && !exercise.prompt.startsWith('Simplifica')) {
    for (const choice of choices) {
      if (choice.value < 0 && answer >= 0) fail(`${context}: opción negativa ${choice.label} con answer ${answer} — «${exercise.prompt}»`);
    }
  }
};

const levels: Level[] = ['level1', 'level2', 'level3', 'level4', 'level5'];

// 1. todos los topics × niveles × rungs
for (const topic of practiceTopics) {
  for (const level of levels) {
    for (const rung of [1, 4, 7, 10]) {
      for (let iteration = 0; iteration < 30; iteration += 1) {
        const exercise = createByTopic(topic as PracticeTopic, level, rung);
        checkExercise(exercise, `${topic}/${level}/r${rung}`);
        if (exercise.answer === 0 && topic !== 'series') fail(`${topic}/${level}/r${rung}: answer 0 — «${exercise.prompt}»`);
      }
    }
  }
}

// 2. porcentajes siempre enteros
for (let iteration = 0; iteration < 300; iteration += 1) {
  const exercise = createByTopic('percentages', 'level3', 7);
  if (!Number.isInteger(exercise.answer)) fail(`percentages: respuesta decimal ${exercise.answer} — «${exercise.prompt}»`);
}

// 3. generateExercises produce la cantidad pedida sin repetir prompts
for (const level of levels) {
  const exercises = generateExercises({ level, category: 'mixed', topics: ['mixed'], amount: 50, mode: 'mixed', instantFeedback: true });
  if (exercises.length !== 50) fail(`generateExercises/${level}: ${exercises.length} ≠ 50`);
  const prompts = new Set(exercises.map((exercise) => `${exercise.category}|${exercise.prompt}|${exercise.answerLabel}`));
  if (prompts.size !== 50) fail(`generateExercises/${level}: ejercicios repetidos (${prompts.size}/50)`);
}

// 4. anzan: acumulado correcto, siempre ≥1, sin términos consecutivos iguales
for (let iteration = 0; iteration < 200; iteration += 1) {
  const exercise = generateFlashAnzanExercise({
    digits: 2, terms: 10, displayMs: 500, operationMode: 'additionSubtraction', advanceMode: 'timed', instantFeedback: true, preset: 'custom',
  });
  let running = 0;
  let previous: number | null = null;
  for (const term of exercise.terms) {
    running += term.signedValue;
    if (running < 1) fail(`anzan: acumulado ${running} < 1 en «${exercise.prompt}»`);
    if (previous !== null && term.value === previous) fail(`anzan: término repetido ${term.value} en «${exercise.prompt}»`);
    previous = term.value;
  }
  if (running !== exercise.answer) fail(`anzan: answer ${exercise.answer} ≠ acumulado ${running}`);
  checkExercise({ ...exercise, category: 'addition', explanation: '', acceptedText: [] } as unknown as Exercise, 'anzan/choices');
}

// 5. multiplicación y cepre siguen íntegros
for (const level of levels) {
  const mult = generateMultiplicationExercises({ level, amount: 30, mode: 'speed', multiplicationType: 'mixed', chainFactorCount: 3, instantFeedback: true });
  if (mult.length !== 30) fail(`multiplication/${level}: ${mult.length} ≠ 30`);
  mult.forEach((exercise) => checkExercise(exercise, `multiplication/${level}`));
  const cepre = generateCepreExercises({ block: 'mixed', level, amount: 20, mode: 'practice', instantFeedback: true });
  if (cepre.length !== 20) fail(`cepre/${level}: ${cepre.length} ≠ 20`);
  cepre.forEach((exercise) => checkExercise(exercise, `cepre/${level}`));
}

// 6. anti-atajo: en una muestra grande, ≥60% de ejercicios tienen un distractor con el mismo último dígito
let sameLastDigit = 0;
const SAMPLE = 400;
for (let iteration = 0; iteration < SAMPLE; iteration += 1) {
  const exercise = createByTopic('multiplication', 'level3', 6);
  const answerDigit = Math.abs(Math.round(exercise.answer)) % 10;
  if (exercise.choices.some((choice) => !choice.isCorrect && Number.isInteger(choice.value) && Math.abs(Math.round(choice.value)) % 10 === answerDigit)) {
    sameLastDigit += 1;
  }
}
if (sameLastDigit / SAMPLE < 0.6) fail(`anti-atajo: solo ${Math.round((sameLastDigit / SAMPLE) * 100)}% con distractor de mismo último dígito`);
else console.log(`anti-atajo OK: ${Math.round((sameLastDigit / SAMPLE) * 100)}% con distractor de mismo último dígito`);

if (failures === 0) console.log('ENGINE SANITY: OK — todos los invariantes pasan');
else {
  console.error(`ENGINE SANITY: ${failures} fallos`);
  process.exit(1);
}
