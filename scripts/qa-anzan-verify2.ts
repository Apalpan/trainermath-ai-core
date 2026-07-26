// Caso extremo: Reto (4 díg · 15 núm · 350ms · sumas y restas) + progresión de velocidad
import { chromium } from 'playwright-core';

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173/');
  await page.waitForSelector('text=¿Qué entrenas hoy?');

  await page.evaluate(() => {
    const w = window as unknown as { __terms: string[] };
    w.__terms = [];
    window.setInterval(() => {
      const el = document.querySelector('.tm-anzan-term');
      w.__terms.push(el ? (el.textContent ?? '').trim() : '');
    }, 15);
  });

  await page.click('text=Flash Anzan');
  await page.waitForSelector('text=Rondas por sesión');
  await page.keyboard.press('4'); // Reto: 4 díg · 15 núm · 350 ms · sumas y restas
  await page.waitForTimeout(150);
  await page.click('text=5 rondas');
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Empezar' }).click();

  let mismatches = 0;
  for (let round = 0; round < 5; round += 1) {
    await page.waitForSelector('text=¿Cuál fue el total?', { timeout: 40000 });
    const observed = await page.evaluate(() => {
      const w = window as unknown as { __terms: string[] };
      const list = w.__terms; w.__terms = [];
      return list;
    });
    const runs: string[] = [];
    let prev = '';
    for (const t of observed) { if (t && t !== prev) runs.push(t); if (t !== prev) prev = t; }
    const numbers = runs.filter((r) => /^[−-]?\d+$/.test(r)).map((r) => Number(r.replace('−', '-')));
    const observedSum = numbers.reduce((s, v) => s + v, 0);

    const options = await page.$$eval('.tm-choice', (els) => els.map((el) => ({
      label: (el.querySelector('.tm-display')?.textContent ?? '').trim(),
      key: (el.querySelector('.tm-choice-key')?.textContent ?? '').trim(),
    })));
    const match = options.find((o) => Number(o.label) === observedSum);
    if (!match) {
      mismatches += 1;
      console.log(`Ronda ${round + 1}: *** SUMA VISTA ${observedSum} NO ESTÁ EN OPCIONES [${options.map(o => o.label).join(', ')}] *** términos: [${numbers.join(', ')}] (${numbers.length} vistos)`);
      await page.keyboard.press('a');
    } else {
      console.log(`Ronda ${round + 1}: vistos ${numbers.length} términos, suma=${observedSum} → opción ${match.key} ✓ (respondo correcta)`);
      await page.keyboard.press(match.key.toLowerCase());
    }
    await page.waitForTimeout(250);
    const correctState = await page.$$eval('.tm-choice[data-state="correct"] .tm-display', (els) => els.map((e) => (e.textContent ?? '').trim()));
    if (Number(correctState[0]) !== observedSum) {
      mismatches += 1;
      console.log(`  → marcada correcta=${correctState[0]} ≠ suma vista ${observedSum} *** MISMATCH ***`);
    }
    if (round < 4) await page.waitForSelector('text=¿Cuál fue el total?', { state: 'hidden', timeout: 15000 });
  }
  console.log(mismatches === 0 ? 'VEREDICTO: 5/5 rondas consistentes a máxima velocidad' : `VEREDICTO: ${mismatches} inconsistencias`);
  await browser.close();
}

main().catch((error) => { console.error(error); process.exit(1); });
