import { chromium } from 'playwright-core';

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://apalpan.github.io/trainermath-ai-core/');
  await page.waitForSelector('text=¿Qué entrenas hoy?', { timeout: 20000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'qa/trainer-v3/live-home.png' });
  await page.click('text=Flash Anzan');
  await page.waitForSelector('text=Rondas por sesión');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3600);
  await page.screenshot({ path: 'qa/trainer-v3/live-anzan.png' });
  await browser.close();
  console.log('live OK');
}

main().catch((error) => { console.error(error); process.exit(1); });
