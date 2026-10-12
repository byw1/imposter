/**
 * Plays a real game of Imposter in Chromium and saves every screen worth
 * showing, at the iPhone 6.9" size (440×956 points, 3x).
 *
 *   node scripts/store-art/capture.js <url> <out-dir> [--gif]
 *
 * The app is the web export (`npx expo export -p web`), served by serve.js.
 * Nothing here is mocked: five players are typed in, roles are dealt, each
 * card is held to peek, the table votes and the imposter guesses. Roles and
 * words are random, so the script reads the screen to find out who the
 * imposter is and what the word was. With --gif it also records the round as
 * a video for the README's gameplay GIF.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const [url = 'http://localhost:8099/', outDir = path.join(__dirname, '.cache', 'screens')] = process.argv.slice(2);
const gif = process.argv.includes('--gif');
const NAMES = ['Maya', 'Leo', 'Priya', 'Sam', 'Jordan'];
const VIEWPORT = { width: 440, height: 956 };

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 3,
    ...(gif ? { recordVideo: { dir: outDir, size: VIEWPORT } } : {}),
  });
  const page = await context.newPage();
  // When the deal starts and the verdict lands, in seconds into the recording, so the GIF can be trimmed to the round.
  const t0 = Date.now();
  const marks = {};
  const file = (name) => path.join(outDir, `${name}.png`);
  const shot = async (name, settle = 900) => {
    await page.waitForTimeout(settle);
    await page.screenshot({ path: file(name) });
    console.log('  ✓', name);
  };
  // Hidden screens stay mounted under the one on top, so only visible text counts.
  const tap = (text) => page.getByText(text, { exact: true }).locator('visible=true').first().click();
  const lines = async () => (await page.innerText('body')).split('\n').map((l) => l.trim()).filter(Boolean);

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // The table.
  await tap('Add players');
  await page.waitForTimeout(800);
  for (const name of NAMES) {
    const field = page.locator('input').first();
    await field.fill(name);
    await field.press('Enter');
    await page.waitForTimeout(250);
  }
  await page.locator('input').first().blur();
  await shot('players');

  // Back to the front door for a few frames: the headline's censor bar lifts
  // now and then, and the store art wants the word showing.
  if (!gif) {
    await page.mouse.click(30, 30);
    await page.waitForTimeout(1500);
    let best = { lime: -1, buffer: null };
    for (let i = 0; i < 14; i++) {
      const buffer = await page.screenshot();
      const lime = await limeIn(page, buffer);
      if (lime > best.lime) best = { lime, buffer };
      await page.waitForTimeout(450);
    }
    fs.writeFileSync(file('home'), best.buffer);
    console.log('  ✓ home');
    await page.mouse.click(73, 925);
    await shot('topics', 1500);
    await page.mouse.click(367, 925);
    await shot('you', 1500);
    await page.mouse.click(220, 925);
    await page.waitForTimeout(1200);
  }

  // The deal: hold each card, read it, let go.
  await tap('Start game');
  marks.start = (Date.now() - t0) / 1000;
  await page.waitForTimeout(1500);
  await shot('deal');
  let imposter = null;
  let word = null;
  for (let i = 0; i < NAMES.length; i++) {
    const before = await lines();
    const name = before[before.indexOf('PASS THE PHONE TO') + 1];
    const box = await page.getByRole('button', { name: 'Hold to see your role' }).locator('visible=true').first().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1600);
    const card = await lines();
    const isImposter = card.some((l) => /YOU.RE THE IMPOSTER/i.test(l));
    if (isImposter) {
      imposter = name;
      if (!gif) await shot('card-imposter', 0);
    } else if (!word) {
      word = card[card.findIndex((l) => /YOU.RE IN/i.test(l)) - 1];
      if (!gif) await shot('card-in', 0);
    }
    await page.mouse.up();
    await page.waitForTimeout(900);
  }
  console.log(`  imposter: ${imposter}, word: ${word}`);
  await shot('clues');

  // The vote: the count starts by itself.
  await tap('Vote');
  await page.waitForTimeout(400);
  if (!gif) await shot('count', 0);
  await page.waitForTimeout(1700);
  if (!gif) await shot('point', 0);
  await page.waitForTimeout(1600);
  await tap(imposter);
  await shot('picked', 500);

  // The reveal, and a wrong guess, so the table wins.
  await page.getByText(/^Reveal /).locator('visible=true').first().click();
  await page.waitForTimeout(1200);
  if (!gif) await shot('drum', 0);
  await page.waitForTimeout(3500);
  await shot('reveal');
  await tap(`Pass to ${imposter}`);
  await page.waitForTimeout(800);
  const options = await lines();
  const from = options.findIndex((l) => /Pick the secret word/.test(l));
  const guess = options.slice(from + 1).find((l) => l !== word && l !== 'Lock guess');
  await tap(guess);
  await shot('guess', 400);
  await tap('Lock guess');
  await page.waitForTimeout(2800);
  await page.screenshot({ path: file('caught') });
  console.log('  ✓ caught');
  marks.end = (Date.now() - t0) / 1000 + 1;
  await page.waitForTimeout(4500);
  await shot('recap');

  const video = page.video();
  await context.close();
  if (video) fs.renameSync(await video.path(), path.join(outDir, 'gameplay.webm'));
  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify({ imposter, word, marks }));
  await browser.close();
}

/** How much of the headline's hidden word is showing: lime pixels in its box. */
async function limeIn(page, buffer) {
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const canvas = new OffscreenCanvas(360, 110);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 300, 940, 720, 220, 0, 0, 360, 110);
    const { data } = ctx.getImageData(0, 0, 360, 110);
    let n = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 1] > 200 && data[i] > 150 && data[i + 2] < 120) n++;
    return n;
  }, buffer.toString('base64'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
