// Verificación empírica: ¿la suma de los números MOSTRADOS coincide con la opción marcada correcta?
import { chromium } from 'playwright-core';

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173/');
  await page.waitForSelector('text=¿Qué entrenas hoy?');

  // instrumentación: registrar todo lo que muestra el término anzan, cada 20ms
  await page.evaluate(() => {
    const w = window as unknown as { __terms: string[]; __timer: number };
    w.__terms = [];
    w.__timer = window.setInterval(() => {
      const el = document.querySelector('.tm-anzan-term');
      w.__terms.push(el ? (el.textContent ?? '').trim() : '');
    }, 20);
  });

  // Anzan con 5 rondas rápidas (config custom vía preset + personalizar sería lento;
  // usamos preset Básico y jugamos 3 rondas... preset por defecto = Intermedio 5 rondas)
  await page.click('text=Flash Anzan');
  await page.waitForSelector('text=Rondas por sesión');
  await page.keyboard.press('1'); // preset Básico: 1 díg · 5 núm · 1000ms
  await page.waitForTimeout(150);
  await page.click('text=3 rondas');
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Empezar' }).click();

  const results: string[] = [];
  for (let round = 0; round < 3; round += 1) {
    try {
      await page.waitForSelector('text=¿Cuál fue el total?', { timeout: 25000 });
    } catch (err) {
      await page.screenshot({ path: 'qa/trainer-v3/anzan-stuck.png' });
      const observed = await page.evaluate(() => (window as unknown as { __terms: string[] }).__terms.slice(-80));
      console.log('ATASCADO en ronda', round + 1, '· últimos términos vistos:', JSON.stringify(observed));
      throw err;
    }
    // leer los términos registrados y limpiarlos para la siguiente ronda
    const observed = await page.evaluate(() => {
      const w = window as unknown as { __terms: string[] };
      const list = w.__terms;
      w.__terms = [];
      return list;
    });
    // condensar en runs consecutivos no vacíos
    const runs: string[] = [];
    let prev = '';
    for (const t of observed) {
      if (t && t !== prev) runs.push(t);
      if (t !== prev) prev = t;
    }
    const numbers = runs.filter((r) => /^[−-]?\d+$/.test(r)).map((r) => Number(r.replace('−', '-')));
    const observedSum = numbers.reduce((s, v) => s + v, 0);

    const options = await page.$$eval('.tm-choice .tm-display', (els) => els.map((e) => (e.textContent ?? '').trim()));
    // responder A y leer cuál queda marcada correcta
    await page.keyboard.press('a');
    await page.waitForTimeout(250);
    const correct = await page.$$eval('.tm-choice[data-state="correct"] .tm-display', (els) => els.map((e) => (e.textContent ?? '').trim()));
    const verdict = Number(correct[0]) === observedSum ? 'OK' : '*** MISMATCH ***';
    results.push(`Ronda ${round + 1}: vistos [${numbers.join(', ')}] suma=${observedSum} · opciones [${options.join(', ')}] · correcta=${correct[0]} → ${verdict}`);
    if (round < 2) await page.waitForSelector('text=¿Cuál fue el total?', { state: 'hidden', timeout: 15000 });
  }
  for (const r of results) console.log(r);
  await browser.close();
}

main().catch((error) => { console.error(error); process.exit(1); });
