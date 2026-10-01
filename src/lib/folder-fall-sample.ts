/**
 * The recorded folder rain (see folder-fall.ts) and how to read it back. Kept free of the physics
 * engine so the reel can sample a recording without loading matter-js on the main thread.
 */

export const FALL_FPS = 60;

export type FolderFall = {
  steps: number;
  /** Folder widths, design px. */
  sizes: number[];
  /** [x, y, angle] per folder per step; NaN until the folder is dropped. */
  frames: Float32Array;
};

/** Folder `i` at time `t` seconds into the recording, interpolated between steps. */
export function sampleFolderFall(fall: FolderFall, i: number, t: number) {
  const count = fall.sizes.length;
  const f = Math.min(Math.max(t * FALL_FPS, 0), fall.steps - 1);
  const a = Math.floor(f);
  const b = Math.min(a + 1, fall.steps - 1);
  const k = f - a;
  const oa = (a * count + i) * 3;
  const ob = (b * count + i) * 3;
  const fr = fall.frames;
  if (Number.isNaN(fr[oa])) return null;
  if (Number.isNaN(fr[ob])) return { x: fr[oa], y: fr[oa + 1], angle: fr[oa + 2] };
  return {
    x: fr[oa] + (fr[ob] - fr[oa]) * k,
    y: fr[oa + 1] + (fr[ob + 1] - fr[oa + 1]) * k,
    angle: fr[oa + 2] + (fr[ob + 2] - fr[oa + 2]) * k,
  };
}
