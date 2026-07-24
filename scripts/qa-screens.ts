// QA visual Trainer Math 3.0 — recorre pantallas reales y captura screenshots.
// Requiere `npm run preview` corriendo en :4173. Ejecutar: npx tsx scripts/qa-screens.ts

import { chromium } from 'playwright-core';
import * as fs from 'node:fs';

const BASE = 'http://localhost:4173/';
const OUT = 'qa/trainer-v3';

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  const shot = (name: string) => page.screenshot({ path: `${OUT}/${name}.png` });

  await page.goto(BASE);
  await page.waitForSelector('text=¿Qué entrenas hoy?', { timeout: 15000 });
  await page.waitForTimeout(400);
  await shot('01-home-dark');

  // Setup Operaciones
  await page.click('text=Operaciones');
  await page.waitForSelector('text=Presets');
  await page.waitForTimeout(300);
  await shot('02-setup-operaciones');
  await page.click('text=Personalizar');
  await page.waitForTimeout(300);
  await shot('03-setup-custom');

  // Arena
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await shot('04-arena-question');
  await page.keyboard.press('a');
  await page.waitForTimeout(180);
  await shot('05-arena-feedback');
  await page.waitForTimeout(1200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await shot('06-exit-confirm');
  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForSelector('text=¿Qué entrenas hoy?');

  // Flash Anzan
  await page.click('text=Flash Anzan');
  await page.waitForSelector('text=Rondas por sesión');
  await page.waitForTimeout(300);
  await shot('07-setup-anzan');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await shot('08-anzan-countdown');
  await page.waitForTimeout(2600);
  await shot('09-anzan-number');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForSelector('text=¿Qué entrenas hoy?');

  // Flash Cards
  await page.click('text=Flash Cards');
  await page.waitForSelector('text=Mazos');
  await page.waitForTimeout(300);
  await shot('10-setup-cards');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  await shot('11-card-front');
  await page.keyboard.press(' ');
  await page.waitForTimeout(600);
  await shot('12-card-back');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  await page.waitForSelector('text=¿Qué entrenas hoy?');

  // Sesión completa → Results (Operaciones preset Rápido = 10 preguntas)
  await page.click('text=Operaciones');
  await page.waitForSelector('text=Presets');
  await page.keyboard.press('1');
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  for (let i = 0; i < 30; i += 1) {
    const done = await page.locator('text=Otra ronda').count();
    if (done > 0) break;
    await page.keyboard.press('a');
    await page.waitForTimeout(1150);
  }
  await page.waitForSelector('text=Otra ronda', { timeout: 20000 });
  await page.waitForTimeout(1300);
  await shot('13-results');
  await page.click('text=Ver análisis');
  await page.waitForTimeout(400);
  await shot('14-results-detail');
  await page.keyboard.press('Escape');
  await page.waitForSelector('text=¿Qué entrenas hoy?');

  // Light theme
  await page.click('[aria-label="Cambiar a modo claro"]');
  await page.waitForTimeout(400);
  await shot('15-home-light');
  await page.click('text=Operaciones');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await shot('16-arena-light');
  await desktop.close();

  // Mobile
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mpage = await mobile.newPage();
  await mpage.goto(BASE);
  await mpage.waitForSelector('text=¿Qué entrenas hoy?', { timeout: 15000 });
  await mpage.waitForTimeout(400);
  await mpage.screenshot({ path: `${OUT}/17-mobile-home.png` });
  await mpage.click('text=Operaciones');
  await mpage.waitForTimeout(400);
  await mpage.screenshot({ path: `${OUT}/18-mobile-setup.png` });
  await mpage.keyboard.press('Enter');
  await mpage.waitForTimeout(700);
  await mpage.screenshot({ path: `${OUT}/19-mobile-arena.png` });
  await mobile.close();

  await browser.close();
  console.log('QA screenshots listos en', OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
