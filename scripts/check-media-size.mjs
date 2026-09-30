/**
 * Guard against oversized files in public/ (they slow pages and eat Vercel deployment storage).
 * Runs before every build. Export web-sized copies into public/ and keep originals in local-media/.
 *
 * Usage: node scripts/check-media-size.mjs
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const FAIL_MB = 3;
const WARN_MB = 1.5;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    }),
  );
  return files.flat();
}

const files = await walk(publicDir);
const sized = await Promise.all(files.map(async (file) => ({ file, mb: (await stat(file)).size / 1048576 })));
const rel = (file) => path.relative(root, file);

const tooBig = sized.filter((f) => f.mb > FAIL_MB).sort((a, b) => b.mb - a.mb);
const heavy = sized.filter((f) => f.mb > WARN_MB && f.mb <= FAIL_MB).sort((a, b) => b.mb - a.mb);

for (const { file, mb } of heavy) {
  console.warn(`⚠ ${mb.toFixed(1)} MB  ${rel(file)}`);
}

if (tooBig.length) {
  console.error(`\n✗ ${tooBig.length} file(s) in public/ are over ${FAIL_MB} MB:`);
  for (const { file, mb } of tooBig) console.error(`  ${mb.toFixed(1)} MB  ${rel(file)}`);
  console.error(
    '\nExport a web-sized version (WebP for images, H.264 MP4 for video/GIFs) and move the original to local-media/.',
  );
  process.exit(1);
}

const totalMb = sized.reduce((sum, f) => sum + f.mb, 0);
console.log(`✓ public/ media check passed (${files.length} files, ${totalMb.toFixed(1)} MB total)`);
