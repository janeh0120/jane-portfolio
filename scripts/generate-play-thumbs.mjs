/**
 * Generate Play gallery grid thumbnails (WebP).
 * Full-resolution originals stay untouched for the modal.
 *
 * Usage: npm run thumbs:play
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const galleryPath = path.join(root, 'content/gallery.json');
const outDir = path.join(root, 'public/images/play-thumbs');
const MAX_EDGE = 900;
const WEBP_QUALITY = 72;

const VIDEO_RE = /\.(mp4|webm|mov|m4v)$/i;

async function writeImageThumb(srcAbs, outAbs) {
  const image = sharp(srcAbs, { animated: false, pages: 1 });
  const meta = await image.metadata();
  const width = meta.width ?? MAX_EDGE;
  const height = meta.height ?? MAX_EDGE;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));

  await image
    .rotate()
    .resize({
      width: Math.round(width * scale),
      height: Math.round(height * scale),
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(outAbs);
}

async function writeVideoThumb(srcAbs, outAbs) {
  if (!ffmpegPath) {
    throw new Error('ffmpeg-static binary not found');
  }

  const framePath = outAbs.replace(/\.webp$/i, '.frame.png');

  await execFileAsync(
    ffmpegPath,
    [
      '-y',
      '-ss',
      '0.25',
      '-i',
      srcAbs,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      framePath,
    ],
    { maxBuffer: 10 * 1024 * 1024 },
  );

  try {
    await writeImageThumb(framePath, outAbs);
  } finally {
    await import('node:fs/promises').then(({ unlink }) =>
      unlink(framePath).catch(() => {}),
    );
  }
}

async function main() {
  const gallery = JSON.parse(await readFile(galleryPath, 'utf8'));
  await mkdir(outDir, { recursive: true });

  const updated = [];

  for (const item of gallery) {
    const first = item.images?.[0];
    if (!first) {
      updated.push(item);
      continue;
    }

    const srcAbs = path.join(root, 'public', first);
    const outName = `${item.slug}.webp`;
    const outAbs = path.join(outDir, outName);
    const thumbRel = `images/play-thumbs/${outName}`;
    const isVideo = VIDEO_RE.test(first);

    try {
      if (isVideo) {
        await writeVideoThumb(srcAbs, outAbs);
      } else {
        await writeImageThumb(srcAbs, outAbs);
      }

      const { size } = await stat(outAbs);
      console.log(
        `✓ ${item.slug}: ${(size / 1024).toFixed(0)} KB ← ${first}${isVideo ? ' (poster)' : ''}`,
      );
      updated.push({ ...item, thumb: thumbRel });
    } catch (err) {
      console.error(`✗ ${item.slug}: ${err.message}`);
      const { thumb: _drop, ...rest } = item;
      updated.push(rest);
    }
  }

  await writeFile(galleryPath, `${JSON.stringify(updated, null, 2)}\n`);
  console.log(`\nUpdated ${galleryPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
