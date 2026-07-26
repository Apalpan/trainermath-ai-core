import { chromium } from 'playwright-core';

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173/');
  await page.waitForSelector('text=¿Qué entrenas hoy?');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'qa/trainer-v3/v31-home.png' });

  // Contrarreloj
  await page.click('text=Contrarreloj');
  await page.waitForSelector('text=Sprint 60');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'qa/trainer-v3/v31-blitz-setup.png' });
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'qa/trainer-v3/v31-blitz-run.png' });
  // responder unas cuantas
  for (let i = 0; i < 4; i += 1) { await page.keyboard.press('a'); await page.waitForTimeout(900); }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForSelector('text=¿Qué entrenas hoy?');

  // Memoria de Dígitos
  await page.click('text=Memoria de Dígitos');
  await page.waitForSelector('text=Continuar');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'qa/trainer-v3/v31-span-show.png' });
  await page.waitForTimeout(1300);
  await page.screenshot({ path: 'qa/trainer-v3/v31-span-answer.png' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForSelector('text=¿Qué entrenas hoy?');

  // Anzan con el fix de velocidad: preset Reto ahora 700ms
  await page.click('text=Flash Anzan');
  await page.waitForSelector('text=Rondas por sesión');
  await page.keyboard.press('4');
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.waitForTimeout(3400);
  await page.screenshot({ path: 'qa/trainer-v3/v31-anzan-sign.png' });
  await browser.close();
  console.log('QA v3.1 listo');
}

main().catch((error) => { console.error(error); process.exit(1); });
