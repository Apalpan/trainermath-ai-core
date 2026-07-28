import { chromium } from 'playwright-core';

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173/');
  await page.waitForSelector('text=¿Qué entrenas hoy?');
  // setup con toma ambiental de hue (Flash Cards = 285 violeta)
  await page.click('text=Flash Cards');
  await page.waitForSelector('text=Mazos');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'qa/trainer-v3/lumo2-setup-ambient.png' });
  await page.keyboard.press('Escape');
  await page.waitForSelector('text=¿Qué entrenas hoy?');
  // resultados centrados
  await page.click('text=Operaciones');
  await page.waitForSelector('text=Presets');
  await page.keyboard.press('1');
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.waitForTimeout(800);
  for (let i = 0; i < 25; i += 1) {
    const done = await page.locator('text=Otra ronda').count();
    if (done > 0) break;
    await page.keyboard.press('a');
    await page.waitForTimeout(1050);
  }
  await page.waitForSelector('text=Otra ronda', { timeout: 20000 });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: 'qa/trainer-v3/lumo2-results.png' });
  await browser.close();
  console.log('lumo2 QA listo');
}

main().catch((error) => { console.error(error); process.exit(1); });
