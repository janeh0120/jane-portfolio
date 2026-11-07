#!/usr/bin/env node
/**
 * Flags styling that bypasses the design tokens (see DESIGN.md): literal spacing values, raw
 * colours, off-token corner radii, ad-hoc shadows, type set directly instead of with the
 * --type-*, --tracking-*, and --weight-* tokens, and transitions or animations timed without the
 * --duration-* and --ease-* tokens.
 *
 * Exempt: the case study reels (illustrations with their own palette), EdgeBlur (alpha masks), and
 * the specular button pair (its WebGL shine needs literal colours; they mirror the tokens). Token
 * definitions in src/styles/global.css are exempt from the colour check. A single deliberate
 * exception is marked with a `design-tokens-ignore: <reason>` comment on the line or the line above.
 *
 *   node scripts/check-design-tokens.mjs           summary
 *   node scripts/check-design-tokens.mjs --list    every finding with file:line
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const EXEMPT = [
  /src\/components\/react\/\w*Reel/,
  /src\/components\/EdgeBlur\.astro/,
  /src\/components\/react\/(SpecularButton|LeaveFeedbackButton)\./,
];
const TOKEN_FILE = 'src/styles/global.css';
const list = process.argv.includes('--list');

// Raw values that are deliberately allowed, each for a stated reason.
const ALLOWED_SPACING = new Set(['0', '0px', '1px', '2px']); // hairlines and focus offsets

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(css|astro|tsx)$/.test(name) ? [path] : [];
  });
}

const checks = {
  spacing: {
    label: 'Literal spacing values (padding, margin, gap)',
    re: /(?<![-\w])(?:padding|margin|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?\s*:\s*([^;{}]+);/g,
    find(value) {
      return value
        .split(/\s+/)
        // Negative values are optical nudges and em values scale with the text; both are allowed.
        .filter((part) => /^[\d.]+(px|rem)$/.test(part) && !ALLOWED_SPACING.has(part));
    },
  },
  colors: {
    label: 'Raw colours outside the token file',
    re: /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g,
    find(value, file, line) {
      if (file === TOKEN_FILE) return [];
      if (/var\(--[\w-]+,\s*$/.test(line.slice(0, line.indexOf(value)))) return []; // var() fallback
      if (/mask(-image)?:/.test(line)) return []; // alpha masks, not colour
      return [value];
    },
  },
  radius: {
    label: 'Corner radii not using a radius token',
    re: /border-radius\s*:\s*([^;{}]+);/g,
    find(value) {
      return /var\(--radius|^0$|^50%$|inherit/.test(value.trim()) ? [] : [value.trim()];
    },
  },
  shadows: {
    label: 'Shadows not using a shadow token',
    re: /box-shadow\s*:\s*([^;{}]+);/g,
    find(value) {
      const v = value.trim();
      return /^none$|var\(--shadow|^0 0 0 \d+px var\(/.test(v) ? [] : [v]; // focus rings are allowed
    },
  },
  type: {
    label: 'Type set directly instead of with a type token',
    re: /(?<![-\w])((?:font-size|line-height|font-weight|letter-spacing)\s*:\s*[^;{}]+);/g,
    find(value) {
      const [, v] = value.split(/:\s*/);
      // Tokens, inheritance, and line-height 0 (icon boxes) are fine
      return /^(var\(--|inherit|normal|0$)/.test(v.trim()) ? [] : [value.replace(/\s+/g, ' ')];
    },
  },
};

// Motion is checked per declaration, not per line, because transitions span several lines.
const motion = {
  label: 'Transitions and animations not using motion tokens',
  re: /(?<![-\w])(?:transition|transition-delay|animation)\s*:([^;{}]*);/g,
  find(value) {
    const found = [...value.matchAll(/cubic-bezier\([^)]*\)|(?<![-\w])ease(?:-in-out|-in|-out)?(?![-\w])/g)];
    // Loops (demo cycles, blinks) keep their own cycle length; 0s is an instant switch
    if (!/infinite/.test(value)) found.push(...value.matchAll(/(?<![-\w.])(?!0m?s\b)\d*\.?\d+m?s(?![-\w])/g));
    return found.map((m) => m[0]);
  },
};

const results = Object.fromEntries([...Object.keys(checks), 'motion'].map((key) => [key, []]));

for (const path of files(SRC)) {
  const file = relative(ROOT, path);
  if (EXEMPT.some((re) => re.test(file))) continue;
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');
  // Blank out comments, keeping line breaks so line numbers still match
  const code = text.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  for (const match of code.matchAll(motion.re)) {
    const index = code.slice(0, match.index).split('\n').length - 1;
    if (/design-tokens-ignore/.test(lines[index]) || /design-tokens-ignore/.test(lines[index - 1] ?? '')) continue;
    for (const value of motion.find(match[1])) results.motion.push({ file, line: index + 1, value });
  }
  let inFontFace = false; // @font-face descriptors (font-weight: 700) describe the file, not type
  lines.forEach((line, index) => {
    if (/@font-face/.test(line)) inFontFace = true;
    if (inFontFace) {
      if (/^\s*\}/.test(line)) inFontFace = false;
      return;
    }
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
    if (/design-tokens-ignore/.test(line) || /design-tokens-ignore/.test(lines[index - 1] ?? '')) return;
    for (const [key, check] of Object.entries(checks)) {
      for (const match of line.matchAll(check.re)) {
        for (const value of check.find(match[1], file, line)) {
          results[key].push({ file, line: index + 1, value });
        }
      }
    }
  });
}

let total = 0;
for (const [key, check] of [...Object.entries(checks), ['motion', motion]]) {
  const found = results[key];
  total += found.length;
  const distinct = new Set(found.map((f) => f.value)).size;
  console.log(`${check.label}: ${found.length} uses, ${distinct} distinct values`);
  if (list) for (const f of found) console.log(`  ${f.file}:${f.line}  ${f.value}`);
}
console.log(`\nTotal: ${total}`);
// Fail the build on any drift
if (total > 0) process.exitCode = 1;
