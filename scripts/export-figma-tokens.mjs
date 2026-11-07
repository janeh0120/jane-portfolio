#!/usr/bin/env node
/**
 * Exports the design tokens in src/styles/global.css as a Tokens Studio file for Figma, so the
 * Figma library is built from the same values as the site. global.css stays the source of truth:
 * rerun this after changing a token and re-import.
 *
 *   node scripts/export-figma-tokens.mjs        writes design-tokens/tokens-studio.json
 *
 * Sets and the Figma variable collections they become (via Tokens Studio's themes):
 *   primitives  Tailwind's colour scales the roles point at        → "Primitives"
 *   core        spacing, radii, widths, type, shadows, motion       → "Core", text and effect styles
 *   light/dark  the colour roles, aliased to primitives             → "Colour mode", Light and Dark
 *
 * What Figma can't express is flattened, with the CSS kept in the description: color-mix() roles
 * become a resolved hex, and clamp() type sizes become a desktop style (largest size) plus a
 * -mobile style (smallest).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { ROOT, css, darkTokens, lightTokens, resolveVars, tailwindTokens, toHex, toPx, toRgba } from './lib/css-tokens.mjs';

const OUT = `${ROOT}design-tokens/tokens-studio.json`;
const PRIMITIVE_FAMILIES = ['neutral', 'blue', 'red', 'orange', 'emerald'];
const FONT_FAMILY = 'TeX Gyre Heros';
// The font ships Regular and Bold only (see @font-face), so the browser draws 500 as 400.
// Figma has no synthesised weights, so Medium would be a missing font there.
const FONT_STYLES = { 400: 'Regular', 500: 'Regular', 700: 'Bold' };

const darkModeTokens = { ...lightTokens, ...darkTokens };
const round = (n) => Math.round(n * 100) / 100;

// Descriptions carry only what Figma loses (the CSS behind a flattened value). The CSS comments
// aren't copied: many head a group of tokens, so they'd land on the first one alone.
function token(type, value, description) {
  return { value, type, ...(description && { description }) };
}

// --- primitives: Tailwind's scales for the families the roles use ---

const primitives = { color: { white: token('color', '#ffffff'), black: token('color', '#000000') } };
for (const family of PRIMITIVE_FAMILIES) {
  primitives.color[family] = {};
  for (const [name, value] of Object.entries(tailwindTokens)) {
    const step = name.match(new RegExp(`^--color-${family}-(\\d+)$`))?.[1];
    if (step) primitives.color[family][step] = token('color', toHex(toRgba(value, {})));
  }
}

// --- colour roles, once per mode ---

const isPrimitive = (name) =>
  /^--color-(white|black)$/.test(name) || new RegExp(`^--color-(${PRIMITIVE_FAMILIES.join('|')})-\\d+$`).test(name);
const roleNames = Object.keys(lightTokens).filter((name) => name.startsWith('--color-') && !isPrimitive(name));

function colourRole(name, tokens) {
  const raw = tokens[name];
  const alias = raw.match(/^var\(--color-([\w-]+)\)$/)?.[1];
  if (alias) {
    const step = alias.match(/^(\w+)-(\d+)$/);
    return token('color', step ? `{color.${step[1]}.${step[2]}}` : `{color.${alias}}`);
  }
  return token('color', toHex(toRgba(raw, tokens)), `CSS: ${raw}`);
}

const modeSet = (tokens) => ({
  color: Object.fromEntries(roleNames.map((name) => [name.slice('--color-'.length), colourRole(name, tokens)])),
});

// --- core ---

const px = (name, type) => token(type, round(toPx(`var(${name})`, lightTokens)));
const pick = (pattern) => Object.keys(lightTokens).filter((name) => pattern.test(name));

const spacing = Object.fromEntries(
  pick(/^--(space-[\w-]+|bar-inset)$/).map((name) => [name.replace(/^--(space-)?/, ''), px(name, 'spacing')]),
);
const sizing = Object.fromEntries(pick(/^--max-w-/).map((name) => [name.slice('--max-w-'.length), px(name, 'sizing')]));
// The aliases of rounded-lg (sm, md, xl, full) are left out: Figma only needs the one corner
const borderRadius = Object.fromEntries(
  ['--radius-base', '--radius-panel', '--radius-menu', '--radius-pill'].map((name) => [
    name.slice('--radius-'.length),
    px(name, 'borderRadius'),
  ]),
);

// Which letter spacing each type style is paired with in the CSS; unpaired styles inherit body's
const trackingFor = {};
for (const [, style, tracking] of css.matchAll(/font: var\(--type-(\w+)\);\s*letter-spacing: var\((--tracking-\w+)\)/g)) {
  trackingFor[style] ??= tracking;
}

const typography = {};
for (const name of pick(/^--type-/)) {
  const style = name.slice('--type-'.length);
  const resolved = resolveVars(lightTokens[name], lightTokens);
  const parts = resolved.match(/^(\d+) (clamp\((.+?), .+, (.+?)\)|[\d.]+rem) \/ ([\d.]+) /);
  if (!parts) throw new Error(`Can't read the type style ${name}: ${resolved}`);
  const [, weight, size, clampMin, clampMax, lineHeight] = parts;
  const letterSpacing = parseFloat(resolveVars(`var(${trackingFor[style] ?? '--tracking-body'})`, lightTokens)) * 100;
  const fontStyle = FONT_STYLES[weight];
  if (!fontStyle) throw new Error(`No ${FONT_FAMILY} style for weight ${weight} (${name})`);
  const note = weight === '500' ? `Weight 500 in CSS, which draws as Regular: ${FONT_FAMILY} has no Medium.` : '';
  const value = (rem) => ({
    fontFamily: '{fontFamilies.sans}',
    fontWeight: fontStyle,
    fontSize: round(toPx(rem, lightTokens)),
    lineHeight: `${round(lineHeight * 100)}%`,
    letterSpacing: `${round(letterSpacing)}%`,
  });
  if (size.startsWith('clamp')) {
    typography[style] = token('typography', value(clampMax), `Desktop: the largest size of ${size}. ${note}`.trim());
    typography[`${style}-mobile`] = token('typography', value(clampMin), `Mobile: the smallest size of ${size}. ${note}`.trim());
  } else {
    typography[style] = token('typography', value(size), note);
  }
}

function shadow(name) {
  const layers = resolveVars(`var(${name})`, lightTokens).split(/,\s*(?![^()]*\))/);
  return token(
    'boxShadow',
    layers.map((layer) => {
      const [, lengths, colour] = layer.trim().match(/^(.+?) (rgb\(.+\))$/);
      const [x, y, blur, spread] = lengths.split(' ').map((length) => toPx(length, {}));
      return { type: 'dropShadow', color: toHex(toRgba(colour, {})), x, y, blur, spread };
    }),
  );
}

const duration = Object.fromEntries(
  pick(/^--duration-\d+$/).map((name) => [name.slice('--duration-'.length), token('number', parseFloat(lightTokens[name]), 'Milliseconds')]),
);
const easing = Object.fromEntries(
  pick(/^--ease-(standard|settle)$/).map((name) => [
    name.slice('--ease-'.length),
    token('other', resolveVars(lightTokens[name], lightTokens)),
  ]),
);
const press = Object.fromEntries(
  pick(/^--press-scale/).map((name) => [name.slice('--press-'.length), token('number', Number(lightTokens[name]))]),
);

const core = {
  spacing,
  sizing,
  borderRadius,
  borderWidth: { default: px('--border-width', 'borderWidth') },
  fontFamilies: { sans: token('fontFamilies', FONT_FAMILY) },
  typography,
  boxShadow: { raised: shadow('--shadow-raised'), floating: shadow('--shadow-floating') },
  motion: { duration, easing, press },
};

// --- themes: one Figma variable collection per group, Light and Dark as modes ---

const themes = [
  { id: 'primitives', name: 'Tailwind', group: 'Primitives', selectedTokenSets: { primitives: 'enabled' } },
  { id: 'core', name: 'Default', group: 'Core', selectedTokenSets: { primitives: 'source', core: 'enabled' } },
  { id: 'light', name: 'Light', group: 'Colour mode', selectedTokenSets: { primitives: 'source', light: 'enabled' } },
  { id: 'dark', name: 'Dark', group: 'Colour mode', selectedTokenSets: { primitives: 'source', dark: 'enabled' } },
];

const output = {
  primitives,
  core,
  light: modeSet(lightTokens),
  dark: modeSet(darkModeTokens),
  $themes: themes,
  $metadata: { tokenSetOrder: ['primitives', 'core', 'light', 'dark'] },
};

mkdirSync(`${ROOT}design-tokens`, { recursive: true });
writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`);
const count = (node) =>
  node && typeof node === 'object' && 'type' in node && 'value' in node
    ? 1
    : Object.values(node ?? {}).reduce((sum, child) => sum + (typeof child === 'object' ? count(child) : 0), 0);
console.log(
  `Wrote ${OUT.slice(ROOT.length)}: ${count(primitives)} primitives, ${count(core)} core, ` +
    `${roleNames.length} colour roles × 2 modes`,
);
