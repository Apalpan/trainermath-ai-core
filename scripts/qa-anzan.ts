import { chromium } from 'playwright-core';

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173/');
  await page.waitForSelector('text=Flash Anzan');
  await page.click('text=Flash Anzan');
  await page.waitForSelector('text=Rondas por sesión');
  await page.keyboard.press('Enter');
  let previous = 0;
  const marks = [500, 2600, 3100, 3500, 4000, 4600, 5300, 6100, 7000, 8200, 9500, 11000];
  for (let index = 0; index < marks.length; index += 1) {
    await page.waitForTimeout(marks[index] - previous);
    previous = marks[index];
    await page.screenshot({ path: `qa/trainer-v3/anzan-t${marks[index]}.png` });
  }
  await browser.close();
  console.log('anzan timeline listo');
}

main().catch((error) => { console.error(error); process.exit(1); });
