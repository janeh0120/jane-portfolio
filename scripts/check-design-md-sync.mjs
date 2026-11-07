#!/usr/bin/env node
/**
 * Checks that the values written out in DESIGN.md and on the /design-system page match
 * src/styles/global.css, which is the source of truth. From DESIGN.md: colours, type, radii, and
 * spacing in the front matter, plus the dark mode table. From the page: the value labels in its data
 * arrays, including their units, and that every token it names exists. It resolves var(), calc(), and
 * color-mix() first, so it compares what each token works out to, not how it's written. Tokens missing
 * from either side count as mismatches, apart from the names listed below. It doesn't read prose, so
 * rules and rationale are still kept up by hand.
 *
 *   node scripts/check-design-md-sync.mjs
 */
import { readFileSync } from 'node:fs';
import { ROOT, css, darkTokens, lightTokens, resolveVars, toPx, toRgba } from './lib/css-tokens.mjs';

const designMd = readFileSync(`${ROOT}DESIGN.md`, 'utf8');
const page = readFileSync(`${ROOT}src/pages/design-system.astro`, 'utf8');

// Colours that are deliberately on one side only, each for a stated reason.
const DESIGN_ONLY_COLORS = new Set(['primary']); // the format requires it; an alias of ink
const CSS_ONLY_COLORS = new Set(['link']); // an alias of ink for links
const DARK_TABLE_SKIPS = new Set(['link', 'glass-hover']); // an alias; covered by the glass row

// DESIGN.md's spacing names that don't follow --space-<name>.
const SPACING_NAMES = {
  section: '--space-section',
  'section-mobile': '--space-section-sm',
  inset: '--space-inset',
  'bar-inset': '--bar-inset',
  'max-site': '--max-w-site',
  'max-case-study': '--max-w-prose',
  'max-about': '--max-w-narrow',
};

const problems = [];
let compared = 0;

function compare(path, documented, actual, same, show = (value) => value) {
  compared += 1;
  if (!same(documented, actual)) {
    const source = path.startsWith('page ') ? 'the page' : 'DESIGN.md';
    problems.push(`${path}: ${source} has ${show(documented)}, global.css has ${show(actual)}`);
  }
}

// --- global.css: light values, with the dark block read separately ---

const sameColor = (a, b) =>
  a.slice(0, 3).every((channel, i) => Math.round(channel) === Math.round(b[i])) &&
  Math.abs(a[3] - b[3]) < 0.005;
const showColor = ([r, g, b, a]) =>
  `rgb(${r.toFixed(0)} ${g.toFixed(0)} ${b.toFixed(0)} / ${(a * 100).toFixed(0)}%)`;
const samePx = (a, b) => Math.abs(a - b) < 0.01;
const showPx = (value) => `${value}px`;
const sameValue = (a, b) => a === b;

// --- DESIGN.md front matter: only the plain nesting the format uses, so no YAML dependency ---

function readFrontMatter(text) {
  const source = text.match(/^---\n([\s\S]*?)\n---/);
  if (!source) throw new Error('Could not find the front matter in DESIGN.md');
  const root = {};
  const stack = [{ indent: -1, node: root }];
  for (const line of source[1].split('\n')) {
    const match = line.match(/^(\s*)([\w-]+):\s*(.*)$/);
    if (!match) continue;
    const indent = match[1].length;
    while (stack.at(-1).indent >= indent) stack.pop();
    const value = match[3].replace(/^"|"$/g, '');
    if (value === '' || value.startsWith('>')) {
      const node = {};
      stack.at(-1).node[match[2]] = node;
      stack.push({ indent, node });
    } else {
      stack.at(-1).node[match[2]] = value;
    }
  }
  return root;
}

const front = readFrontMatter(designMd);

// A {group.name} reference in DESIGN.md resolves to the value it points at
function deref(value) {
  const reference = String(value).match(/^\{(\w+)\.([\w-]+)\}$/);
  return reference ? deref(front[reference[1]][reference[2]]) : value;
}

// --- Colours ---

for (const [name, value] of Object.entries(front.colors)) {
  if (DESIGN_ONLY_COLORS.has(name)) continue;
  const token = `--color-${name}`;
  if (!(token in lightTokens)) {
    problems.push(`colors.${name}: in DESIGN.md, but global.css has no ${token}`);
    continue;
  }
  compare(
    `colors.${name}`,
    toRgba(deref(value), lightTokens),
    toRgba(`var(${token})`, lightTokens),
    sameColor,
    showColor,
  );
}

for (const token of Object.keys(lightTokens)) {
  const name = token.match(/^--color-([\w-]+)$/)?.[1];
  if (name && !(name in front.colors) && !CSS_ONLY_COLORS.has(name)) {
    problems.push(`colors.${name}: global.css has ${token}, but DESIGN.md doesn't list it`);
  }
}

// --- Dark mode table ---

const darkRows = {};
for (const [, name, cell] of designMd.matchAll(/^\| ([\w-]+) \| (.+?) \|$/gm)) {
  if (name === 'Token') continue;
  const white = cell.match(/^white at ([\d.]+)%/);
  const value = white ? `rgb(255 255 255 / ${white[1]}%)` : cell.match(/#[\da-f]{6}|rgb\([^)]*\)/i)?.[0];
  if (value) darkRows[name] = value;
}

for (const [token, value] of Object.entries(darkTokens)) {
  const name = token.match(/^--color-([\w-]+)$/)?.[1];
  if (!name || DARK_TABLE_SKIPS.has(name)) continue;
  if (!(name in darkRows)) {
    problems.push(`dark mode ${name}: global.css sets it, but the DESIGN.md table doesn't list it`);
    continue;
  }
  compare(`dark mode ${name}`, toRgba(darkRows[name], lightTokens), toRgba(value, lightTokens), sameColor, showColor);
  delete darkRows[name];
}
for (const name of Object.keys(darkRows)) {
  problems.push(`dark mode ${name}: in the DESIGN.md table, but global.css doesn't set it`);
}

// --- Type: weight, largest size, line height, and family from each --type-* shorthand ---

const trackings = ['--tracking-display', '--tracking-body'].map((name) => resolveVars(`var(${name})`, lightTokens));

for (const [name, style] of Object.entries(front.typography)) {
  const raw = lightTokens[`--type-${name}`];
  const shorthand = raw && resolveVars(raw, lightTokens);
  if (!shorthand) {
    problems.push(`typography.${name}: in DESIGN.md, but global.css has no --type-${name}`);
    continue;
  }
  const parts = shorthand.match(/^(\d+) (.+) \/ ([\d.]+) (.+)$/);
  if (!parts) throw new Error(`Not a type shorthand: --type-${name}: ${shorthand}`);
  const size = parts[2].match(/^clamp\(.+, ([\d.]+rem)\)$/)?.[1] ?? parts[2];
  compare(`typography.${name}.fontWeight`, style.fontWeight, parts[1], sameValue);
  compare(`typography.${name}.fontSize`, style.fontSize, size, sameValue);
  compare(`typography.${name}.lineHeight`, style.lineHeight, parts[3], sameValue);
  const family = resolveVars(parts[4], lightTokens).match(/^"([^"]+)"/)?.[1];
  compare(`typography.${name}.fontFamily`, style.fontFamily, family, sameValue);
  if (style.letterSpacing && !trackings.includes(style.letterSpacing)) {
    problems.push(`typography.${name}.letterSpacing: ${style.letterSpacing} isn't a --tracking-* value`);
  }
}

for (const token of Object.keys(lightTokens)) {
  const name = token.match(/^--type-([\w-]+)$/)?.[1];
  if (name && !(name in front.typography)) {
    problems.push(`typography.${name}: global.css has ${token}, but DESIGN.md doesn't list it`);
  }
}

// --- Radii and spacing ---

for (const [name, value] of Object.entries(front.rounded)) {
  const token = `--radius-${name}`;
  if (!(token in lightTokens)) {
    problems.push(`rounded.${name}: in DESIGN.md, but global.css has no ${token}`);
    continue;
  }
  compare(`rounded.${name}`, toPx(deref(value), lightTokens), toPx(`var(${token})`, lightTokens), samePx, showPx);
}

for (const [name, value] of Object.entries(front.spacing)) {
  const token = SPACING_NAMES[name] ?? `--${name}`;
  if (!(token in lightTokens)) {
    problems.push(`spacing.${name}: in DESIGN.md, but global.css has no ${token}`);
    continue;
  }
  compare(`spacing.${name}`, toPx(deref(value), lightTokens), toPx(`var(${token})`, lightTokens), samePx, showPx);
}

const documentedSpacing = new Set(Object.keys(front.spacing).map((name) => SPACING_NAMES[name] ?? `--${name}`));
for (const token of Object.keys(lightTokens)) {
  if (/^--space-\d+$/.test(token) && !documentedSpacing.has(token)) {
    problems.push(`spacing: global.css has ${token}, but DESIGN.md doesn't list it`);
  }
}

// --- /design-system page: the value labels in its data arrays ---

function pageArray(name) {
  const source = page.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n?\\](?:;|\\.map)`));
  if (!source) throw new Error(`Could not find const ${name} in design-system.astro`);
  return source[1];
}

// Each `{ key: 'value', ... }` row of an array, read as strings, numbers, or number lists
function pageRows(name) {
  return [...pageArray(name).matchAll(/\{([^{}]*)\}/g)].map(([, row]) => {
    const fields = {};
    for (const [, key, text, number, list] of row.matchAll(/(\w+): (?:'([^']*)'|(\d+)\b|\[([^\]]*)\])/g)) {
      fields[key] = text ?? (number !== undefined ? Number(number) : list.split(', ').map(Number));
    }
    return fields;
  });
}

// Every token of a family on the page, and none that aren't in global.css
function compareTokenSets(path, onPage, inCss) {
  for (const token of onPage) {
    if (!inCss.includes(token)) problems.push(`page ${path}: lists ${token}, which global.css doesn't have`);
  }
  for (const token of inCss) {
    if (!onPage.includes(token)) problems.push(`page ${path}: global.css has ${token}, but the page doesn't list it`);
  }
}

const cssTokens = Object.keys(lightTokens);

// Radii: every label is `<value>px · <use>`
const radiusRows = pageRows('radii');
compareTokenSets(
  'radii',
  radiusRows.map((row) => row.token),
  cssTokens.filter((token) => token.startsWith('--radius-') && !/-(sm|md|lg|xl|full)$/.test(token)),
);
for (const row of radiusRows) {
  if (!(row.token in lightTokens)) continue;
  const label = row.detail.match(/^([\d.]+px) · /)?.[1];
  if (!label) {
    problems.push(`page radii ${row.name}: "${row.detail}" should start with the value in px`);
    continue;
  }
  compare(`page radii ${row.name}`, toPx(label, {}), toPx(`var(${row.token})`, lightTokens), samePx, showPx);
}

// Type: weight, size or size range, and line height where the label gives one
const WEIGHT_NAMES = { Regular: '400', Medium: '500', Bold: '700' };
const typeRows = pageRows('typeStyles');
compareTokenSets(
  'type',
  typeRows.map((row) => `--type-${row.token}`),
  cssTokens.filter((token) => token.startsWith('--type-')),
);
for (const row of typeRows) {
  if (!lightTokens[`--type-${row.token}`]) continue;
  const shorthand = resolveVars(lightTokens[`--type-${row.token}`], lightTokens);
  const [, weight, size, lineHeight] = shorthand.match(/^(\d+) (.+) \/ ([\d.]+) /);
  const range = size.match(/^clamp\(([\d.]+)rem, .+, ([\d.]+)rem\)$/);
  const expectedSize = range ? `${range[1]}–${range[2]}rem` : size;
  const spec = row.spec.match(/^(\w+) · ([^ ]+)(?: \/ ([\d.]+))? · /);
  if (!spec) {
    problems.push(`page type ${row.token}: "${row.spec}" should read "Weight · size · use"`);
    continue;
  }
  compare(`page type ${row.token} weight`, WEIGHT_NAMES[spec[1]], weight, sameValue);
  compare(`page type ${row.token} size`, spec[2], expectedSize, sameValue);
  if (spec[3]) compare(`page type ${row.token} line height`, spec[3], lineHeight, sameValue);
}

// Spacing: the steps, and the formula that writes their labels
const spacingSteps = pageArray('spacing').split(', ').map(Number);
compareTokenSets(
  'spacing',
  spacingSteps.map((step) => `--space-${step}`),
  cssTokens.filter((token) => /^--space-\d+$/.test(token)),
);
if (!page.includes('value: `${step * 0.25}rem`')) {
  problems.push('page spacing: labels should be written as `${step * 0.25}rem`');
}
for (const step of spacingSteps) {
  if (`--space-${step}` in lightTokens) {
    compare(`page spacing ${step}`, step * 4, toPx(`var(--space-${step})`, lightTokens), samePx, showPx);
  }
}

// Page widths: the label is written exactly as the token is
const WIDTH_TOKENS = { Site: '--max-w-site', 'Case study': '--max-w-prose', About: '--max-w-narrow' };
for (const row of pageRows('widths')) {
  const token = WIDTH_TOKENS[row.name];
  if (!token) {
    problems.push(`page widths ${row.name}: not mapped to a token in check-design-md-sync.mjs`);
    continue;
  }
  compare(`page widths ${row.name} label`, row.label, resolveVars(lightTokens[token], lightTokens), sameValue);
  compare(`page widths ${row.name} bar`, row.px, toPx(`var(${token})`, lightTokens), samePx, showPx);
}

// Line colours: the label gives the width the row actually draws, and the colour exists
for (const row of pageRows('borders')) {
  if (!(row.token in lightTokens)) problems.push(`page borders ${row.name}: global.css has no ${row.token}`);
  const label = row.detail.match(/^([\d.]+px) · /)?.[1];
  if (!label) {
    problems.push(`page borders ${row.name}: "${row.detail}" should start with the width in px`);
    continue;
  }
  compare(`page borders ${row.name}`, toPx(label, {}), toPx(row.width, lightTokens), samePx, showPx);
}

// Motion: durations, easing curves, and the numbers in the short descriptions
const durationRows = pageRows('durations');
compareTokenSets(
  'durations',
  durationRows.map((row) => row.token),
  cssTokens.filter((token) => token.startsWith('--duration-')),
);
for (const row of durationRows) {
  if (row.token in lightTokens) compare(`page duration ${row.token}`, `${row.ms}ms`, lightTokens[row.token], sameValue);
}

const easingRows = pageRows('easings');
compareTokenSets(
  'easings',
  easingRows.map((row) => row.token),
  cssTokens.filter((token) => token.startsWith('--ease-')),
);
for (const row of easingRows) {
  if (!lightTokens[row.token]) continue;
  const curve = resolveVars(lightTokens[row.token], lightTokens).match(/^cubic-bezier\((.+)\)$/)?.[1];
  compare(`page easing ${row.name}`, row.curve.join(', '), curve, sameValue);
}

const motionRows = pageRows('motion');
const pressNumbers = motionRows.find((row) => row.name === 'Press')?.detail.match(/(\d+)%.*?(\d+)%/);
compare('page motion Press', pressNumbers?.[1], String(Math.round(lightTokens['--press-scale'] * 100)), sameValue);
compare('page motion Press icon', pressNumbers?.[2], String(Math.round(lightTokens['--press-scale-icon'] * 100)), sameValue);
const hoverLabel = motionRows.find((row) => row.name === 'Hover')?.detail.match(/([\d.]+m?s)/)?.[1];
compare('page motion Hover', hoverLabel, lightTokens['--duration-150'], sameValue);

// Colours and shadows: the page only names these, so each name must exist
for (const [, token] of page.matchAll(/token: '(--(?:color|shadow)-[\w-]+)'/g)) {
  if (!(token in lightTokens)) problems.push(`page: names ${token}, which global.css doesn't have`);
}

// --- Result ---

if (problems.length) {
  console.log(`Documented values disagree with global.css, the source of truth:\n`);
  for (const problem of problems) console.log(`  ${problem}`);
  console.log(`\nMismatches: ${problems.length}`);
  process.exitCode = 1;
} else {
  console.log(`DESIGN.md and /design-system match global.css: ${compared} values compared`);
}
