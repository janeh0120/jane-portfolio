import Matter from 'matter-js';

/**
 * Pre-computes folders raining into a pile for the migration reel ("Until there are thousands…").
 *
 * The reel draws every frame as a pure function of time, so instead of running physics live we
 * simulate once, record each folder's position and angle per step, and the reel samples the
 * recording. Same seed in, same pile out.
 */

import { FALL_FPS, type FolderFall } from './folder-fall-sample';

export type { FolderFall };

export type FolderFallOptions = {
  width: number;
  height: number;
  count: number;
  /** How long to record, seconds. */
  duration: number;
  /** Width/height of the folder shape. */
  ratio: number;
  /** The first folder starts here, at rest (the pink folder that just grew out of the window). */
  first: { x: number; y: number; size: number };
  seed?: number;
};

export function simulateFolderFall({ width, height, count, duration, ratio, first, seed = 11 }: FolderFallOptions): FolderFall {
  const { Engine, Bodies, Body, Composite } = Matter;
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const engine = Engine.create({ gravity: { x: 0, y: 1.9 }, positionIterations: 14, velocityIterations: 10 });
  const wall = { isStatic: true, friction: 0.6 };
  Composite.add(engine.world, [
    // Floor sits a touch above the frame's bottom edge: under the full pile, the bottom row sinks
    // in by about that much and ends up flush with the edge.
    Bodies.rectangle(width / 2, height - 8 + 50, width * 3, 100, wall),
    Bodies.rectangle(-50, 0, 100, height * 6, wall),
    Bodies.rectangle(width + 50, 0, 100, height * 6, wall),
  ]);

  const steps = Math.ceil(duration * FALL_FPS);
  const sizes: number[] = [];
  const spawnAt: number[] = [];
  const bodies: (Matter.Body | null)[] = [];
  for (let i = 0; i < count; i++) {
    sizes.push(i === 0 ? first.size : 28 + rand() * 8);
    // A steady downpour over ~1.3s, enough to bury the frame right up to the top.
    spawnAt.push(i === 0 ? 0 : Math.round((0.08 + (i / count) * 1.3) * FALL_FPS));
    bodies.push(null);
  }

  const frames = new Float32Array(count * steps * 3).fill(NaN);
  for (let step = 0; step < steps; step++) {
    for (let i = 0; i < count; i++) {
      if (bodies[i] || spawnAt[i] !== step) continue;
      const w = sizes[i];
      const h = w * ratio;
      const x = i === 0 ? first.x : w / 2 + rand() * (width - w);
      const y = i === 0 ? first.y : -h - rand() * 220;
      const body = Bodies.rectangle(x, y, w, h, {
        chamfer: { radius: Math.min(5, w * 0.08) },
        friction: 0.45,
        frictionStatic: 0.8,
        restitution: 0.12,
        density: 0.002,
        angle: i === 0 ? 0 : (rand() - 0.5) * 0.9,
      });
      if (i > 0) {
        Body.setVelocity(body, { x: (rand() - 0.5) * 2.2, y: 1 + rand() * 2 });
        Body.setAngularVelocity(body, (rand() - 0.5) * 0.08);
      }
      Composite.add(engine.world, body);
      bodies[i] = body;
    }

    Engine.update(engine, 1000 / FALL_FPS);

    for (let i = 0; i < count; i++) {
      const body = bodies[i];
      if (!body) continue;
      const o = (step * count + i) * 3;
      frames[o] = body.position.x;
      frames[o + 1] = body.position.y;
      frames[o + 2] = body.angle;
    }
  }

  return { steps, sizes, frames };
}
