/**
 * Reads the design tokens out of src/styles/global.css and works out what each one resolves to.
 * Tokens point at Tailwind's scales, so Tailwind's theme is read too. Shared by
 * check-design-md-sync.mjs and export-figma-tokens.mjs.
 */
import { readFileSync } from 'node:fs';

export const ROOT = new URL('../..', import.meta.url).pathname;
export const css = readFileSync(`${ROOT}src/styles/global.css`, 'utf8');
const tailwindTheme = readFileSync(`${ROOT}node_modules/tailwindcss/theme.css`, 'utf8');

export function readTokens(text) {
  const tokens = {};
  for (const [, name, value] of text.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)) {
    tokens[name] ??= value.trim();
  }
  return tokens;
}

const darkMatch = css.match(/^html\.theme-dark \{\n([\s\S]*?)^\}/m);
if (!darkMatch) throw new Error('Could not find the html.theme-dark block in global.css');
/** Only the overrides in html.theme-dark */
export const darkTokens = readTokens(darkMatch[1]);
export const lightTokens = readTokens(css.replace(darkMatch[0], ''));
export const tailwindTokens = readTokens(tailwindTheme);

export function resolveVars(value, tokens) {
  return value.replace(/var\((--[\w-]+)\)/g, (_, name) => {
    const value = tokens[name] ?? tailwindTokens[name];
    if (value === undefined) throw new Error(`global.css uses ${name}, which isn't defined`);
    return resolveVars(value, tokens);
  });
}

export function toPx(value, tokens) {
  const expression = resolveVars(value, tokens)
    .replace(/calc\(/g, '(')
    .replace(/(-?[\d.]+)rem/g, (_, n) => String(n * 16))
    .replace(/(-?[\d.]+)px/g, '$1');
  if (!/^[\d.+\-*/() ]+$/.test(expression)) throw new Error(`Not a length: ${value}`);
  return Number(new Function(`return ${expression}`)());
}

export function oklchToRgb(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.min(255, Math.max(0, gamma(Math.max(0, c)) * 255)));
}

// Colours as [r, g, b, alpha], so #fff, rgb() and color-mix() compare equal when they paint the same
export function toRgba(value, tokens) {
  const color = resolveVars(value, tokens).trim();
  if (color === '#fff') return [255, 255, 255, 1];
  if (color === '#000') return [0, 0, 0, 1];
  const oklch = color.match(/^oklch\(([\d.]+)%? ([\d.]+) ([\d.]+)\)$/);
  if (oklch) return [...oklchToRgb(+oklch[1] / 100, +oklch[2], +oklch[3]), 1];
  const hex = color.match(/^#([\da-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1);
  const rgb = color.match(/^rgb\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+)(%?))?\)$/);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[5] ? rgb[4] / 100 : +rgb[4];
    return [+rgb[1], +rgb[2], +rgb[3], alpha];
  }
  const mix = color.match(/^color-mix\(in srgb, (.+) ([\d.]+)%, (.+)\)$/);
  if (mix) {
    const amount = mix[2] / 100;
    const first = toRgba(mix[1], tokens);
    if (mix[3] === 'transparent') return [first[0], first[1], first[2], first[3] * amount];
    const second = toRgba(mix[3], tokens);
    return first.map((channel, i) => channel * amount + second[i] * (1 - amount));
  }
  throw new Error(`Not a colour: ${value}`);
}

/** #rrggbb, or #rrggbbaa when not opaque */
export function toHex([r, g, b, a]) {
  const byte = (n) => Math.round(n).toString(16).padStart(2, '0');
  return `#${byte(r)}${byte(g)}${byte(b)}${a < 0.9995 ? byte(a * 255) : ''}`;
}
