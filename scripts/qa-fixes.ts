import { chromium } from 'playwright-core';

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173/');
  await page.waitForSelector('text=¿Qué entrenas hoy?');

  // tema claro → setup (verifica CTA naranja con texto oscuro)
  await page.click('[aria-label="Cambiar a modo claro"]');
  await page.waitForTimeout(300);
  await page.click('text=Operaciones');
  await page.waitForSelector('text=Presets');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'qa/trainer-v3/fix-setup-light.png' });

  // arena → Esc abre diálogo → Esc lo cierra (fix C3)
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  const dialogOpen = await page.locator('text=¿Salir del entrenamiento?').count();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  const dialogClosed = await page.locator('text=¿Salir del entrenamiento?').count();
  console.log('dialogo abre con Esc:', dialogOpen === 1, '· cierra con Esc:', dialogClosed === 0);

  // pregunta sigue viva tras cerrar el diálogo
  await page.keyboard.press('a');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'qa/trainer-v3/fix-arena-light-feedback.png' });

  await browser.close();
  console.log('fix QA listo');
}

main().catch((error) => { console.error(error); process.exit(1); });
