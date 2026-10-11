/**
 * Writes Shade's seven moods as static SVG files, for the design system and
 * store art: `node spec/generate-mascot.js <out-dir>`.
 *
 * The face comes from src/ui/shadeFace.ts, the same shapes the app draws, so
 * the static art can't drift from the real mascot. The `?` on the card is
 * drawn as a shape, so it renders inside an <img> without the display font.
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'shadeFace.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const face = {};
new Function('exports', outputText)(face);

const { SHADE } = face;
const attrs = (part) =>
  Object.entries(part)
    .filter(([key]) => key !== 'tag')
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${value}"`)
    .join(' ');
const el = (part) =>
  part.tag === 'path'
    ? `<path ${attrs(part)} stroke-linecap="round" stroke-linejoin="round"/>`
    : `<${part.tag} ${attrs(part)}/>`;

function svg(mood) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="-6 -6 132 132">',
    '<g fill="#FFFFFF" stroke="#FFFFFF" stroke-width="12" stroke-linejoin="round"><ellipse cx="60" cy="73" rx="42" ry="39"/><g transform="rotate(9 60 30)"><rect x="40" y="5" width="40" height="50" rx="9"/></g></g>',
    ...face.headParts().map(el),
    '<ellipse cx="34" cy="60" rx="5" ry="9" fill="#FFFFFF" opacity="0.28" transform="rotate(20 34 60)"/>',
    ...face.eyeParts(mood, 0, false).map(el),
    ...face.mouthParts(mood).map(el),
    `<g transform="rotate(9 60 30)"><rect x="40" y="5" width="40" height="50" rx="9" fill="${SHADE.card}" stroke="${SHADE.ink}" stroke-width="4"/><path d="M54 22.5 A6 6 0 1 1 63.5 28 C61 29.5 60 31 60 34" stroke="${SHADE.ink}" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="60" cy="41.5" r="3.2" fill="${SHADE.ink}"/></g>`,
    '</svg>',
    '',
  ].join('\n');
}

const out = process.argv[2];
if (!out) {
  console.error('Usage: node spec/generate-mascot.js <out-dir>');
  process.exit(1);
}
fs.mkdirSync(out, { recursive: true });
for (const mood of face.MASCOT_MOODS) {
  fs.writeFileSync(path.join(out, `shade-${mood}.svg`), svg(mood));
  console.log(`shade-${mood}.svg`);
}
