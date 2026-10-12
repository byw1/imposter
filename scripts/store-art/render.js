/**
 * Turns the captured screens into the App Store screenshots, two social
 * videos and the README's pictures.
 *
 *   node scripts/store-art/render.js [store] [videos] [readme] [gif]
 *
 * No arguments renders everything. It reads .cache/screens (from capture.js),
 * builds a small folder of assets next to the HTML templates (fonts from
 * node_modules, Shade from shadeFace.ts via spec/generate-mascot.js) and
 * screenshots the templates in Chromium. Videos are drawn frame by frame from
 * a pure render(t) function, so every frame lands exactly on time, then
 * encoded with ffmpeg.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const HERE = __dirname;
const ROOT = path.join(HERE, '..', '..');
const CACHE = path.join(HERE, '.cache');
const ASSETS = path.join(CACHE, 'assets');
const OUT = path.join(HERE, 'out');
const DOCS = path.join(ROOT, 'docs', 'images');
const jobs = process.argv.slice(2);
const want = (job) => jobs.length === 0 || jobs.includes(job);

function prepare() {
  fs.mkdirSync(ASSETS, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(DOCS, { recursive: true });
  for (const file of ['store.html', 'video.html', 'readme.html']) fs.copyFileSync(path.join(HERE, file), path.join(CACHE, file));
  const screens = path.join(CACHE, 'screens');
  for (const file of fs.readdirSync(screens)) if (file.endsWith('.png')) fs.copyFileSync(path.join(screens, file), path.join(ASSETS, file));
  execFileSync('node', [path.join(ROOT, 'spec', 'generate-mascot.js'), ASSETS]);
  const fonts = path.join(ROOT, 'node_modules', '@expo-google-fonts');
  fs.copyFileSync(path.join(fonts, 'bricolage-grotesque', '800ExtraBold', 'BricolageGrotesque_800ExtraBold.ttf'), path.join(ASSETS, 'Bricolage-800.ttf'));
  fs.copyFileSync(path.join(fonts, 'plus-jakarta-sans', '700Bold', 'PlusJakartaSans_700Bold.ttf'), path.join(ASSETS, 'Jakarta-700Bold.ttf'));
  fs.copyFileSync(path.join(fonts, 'plus-jakarta-sans', '800ExtraBold', 'PlusJakartaSans_800ExtraBold.ttf'), path.join(ASSETS, 'Jakarta-800ExtraBold.ttf'));
  const store = path.join(CACHE, 'store');
  fs.mkdirSync(store, { recursive: true });
  for (const file of fs.existsSync(OUT) ? fs.readdirSync(OUT) : []) if (file.startsWith('appstore-')) fs.copyFileSync(path.join(OUT, file), path.join(store, file));
  const meta = path.join(screens, 'meta.json');
  return fs.existsSync(meta) ? JSON.parse(fs.readFileSync(meta, 'utf8')) : {};
}

async function open(browser, file, query, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(CACHE, file)}?${query}`);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 1 : new Promise((r) => (i.onload = i.onerror = r))))));
  await page.waitForTimeout(300);
  return page;
}

async function store(browser) {
  for (let n = 1; n <= 7; n++) {
    const page = await open(browser, 'store.html', `n=${n}`, { width: 1320, height: 2868 });
    // App Store Connect rejects screenshots with an alpha channel: JPEG-free PNG from an opaque page has none.
    await page.screenshot({ path: path.join(OUT, `appstore-${n}.png`), omitBackground: false });
    await page.close();
    console.log(`  ✓ appstore-${n}.png`);
  }
}

async function videos(browser, meta) {
  const fps = 30;
  for (const v of ['A', 'B']) {
    const page = await open(browser, 'video.html', `v=${v}&who=${encodeURIComponent(meta.imposter || 'Sam')}`, { width: 1080, height: 1920 });
    const frames = path.join(CACHE, `frames-${v}`);
    fs.rmSync(frames, { recursive: true, force: true });
    fs.mkdirSync(frames);
    const total = Math.round((await page.evaluate(() => window.DUR)) * fps);
    for (let i = 0; i < total; i++) {
      await page.evaluate((t) => {
        window.render(t);
        return Promise.all([...document.images].map((im) => (im.complete ? 1 : new Promise((r) => (im.onload = im.onerror = r)))));
      }, i / fps);
      await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
    }
    await page.close();
    const name = v === 'A' ? 'video-one-of-you-is-lying.mp4' : 'video-whos-lying.mp4';
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%04d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(OUT, name)]);
    console.log(`  ✓ ${name} (${total} frames)`);
  }
}

async function readme(browser) {
  const pages = { banner: [2400, 1000], phones: [2400, 1240], shade: [2400, 560], screenshots: [2400, 750] };
  for (const [p, [width, height]] of Object.entries(pages)) {
    const page = await open(browser, 'readme.html', `p=${p}`, { width, height });
    await page.screenshot({ path: path.join(DOCS, `${p}.jpg`), type: 'jpeg', quality: 88 });
    await page.close();
    console.log(`  ✓ docs/images/${p}.jpg`);
  }
}

function gameplayGif() {
  const webm = path.join(CACHE, 'gif', 'gameplay.webm');
  if (!fs.existsSync(webm)) return console.log('  (no gameplay recording: run capture.js with --gif first)');
  const palette = path.join(CACHE, 'palette.png');
  // Just the round, from the deal to the verdict, played a little fast.
  const meta = JSON.parse(fs.readFileSync(path.join(CACHE, 'gif', 'meta.json'), 'utf8'));
  const trim = meta.marks ? ['-ss', String(meta.marks.start), '-to', String(meta.marks.end)] : [];
  const filters = 'setpts=PTS/1.5,fps=10,scale=300:-1:flags=lanczos';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...trim, '-i', webm, '-vf', `${filters},palettegen=stats_mode=diff`, palette]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...trim, '-i', webm, '-i', palette, '-lavfi', `${filters}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4`, path.join(DOCS, 'gameplay.gif')]);
  console.log('  ✓ docs/images/gameplay.gif');
}

(async () => {
  const meta = prepare();
  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files'],
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  });
  if (want('store')) await store(browser);
  if (want('readme')) {
    prepare(); // picks up the fresh store screenshots for the strip
    await readme(browser);
  }
  if (want('videos')) await videos(browser, meta);
  await browser.close();
  if (want('gif')) gameplayGif();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
