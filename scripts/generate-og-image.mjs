/**
 * Generate the link preview that iMessage, LinkedIn, Slack, X, and others show when someone pastes a
 * link to the site: the logo reel (content/site.json → logoScroll) as a looping GIF, 1200×630.
 *
 * Writes public/og-image.gif (the loop) and public/og-image.png (its first frame, the mark on white),
 * for apps that only take a still.
 *
 * Usage: npm run og:image
 */
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));

const WIDTH = 1200;
const HEIGHT = 630;
/** Seconds each frame holds: the mark first and longest, then each photo. */
const MARK_HOLD = 1;
const PHOTO_HOLD = 0.5;
const FPS = 10;

const { startEnd, images } = site.logoScroll;
const sources = [startEnd, ...images].map((src) => path.join(root, 'public', src));
const tmp = await mkdtemp(path.join(tmpdir(), 'og-'));

try {
  const frames = await Promise.all(
    sources.map(async (src, i) => {
      const out = path.join(tmp, `${i}.png`);
      await sharp(src)
        .resize(WIDTH, HEIGHT, { fit: 'cover' })
        .flatten({ background: '#ffffff' })
        .png()
        .toFile(out);
      return out;
    }),
  );

  await sharp(frames[0]).png({ compressionLevel: 9 }).toFile(path.join(root, 'public/og-image.png'));

  const inputs = frames.flatMap((frame, i) => ['-loop', '1', '-t', String(i === 0 ? MARK_HOLD : PHOTO_HOLD), '-i', frame]);
  const concat = frames.map((_, i) => `[${i}:v]`).join('') + `concat=n=${frames.length}:v=1:a=0`;
  const gif = path.join(root, 'public/og-image.gif');
  await execFileAsync(ffmpegPath, [
    '-y',
    ...inputs,
    '-filter_complex',
    `${concat},fps=${FPS},split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    '-loop',
    '0',
    gif,
  ]);

  const kb = (await stat(gif)).size / 1024;
  console.log(`Wrote public/og-image.png and public/og-image.gif (${kb.toFixed(0)} KB)`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
