import { useEffect, useRef, useState, type SVGProps } from 'react';
import { sampleFolderFall, type FolderFall } from '../../lib/folder-fall-sample';
import type { FolderFallOptions } from '../../lib/folder-fall';
import './MigrationReel.css';

/**
 * Motion reel for the migration case study: "Code migrations are simple" → one folder opens into an
 * agent window → thousands of folders → "So we built a migration dashboard that discovers and
 * migrates codebases, agentically." types in while the folders are discovered and migrated.
 *
 * The whole reel is one timeline in seconds. `render(t)` writes every style straight to the DOM from
 * `t`, so a frame is a pure function of time and React only renders the scene once.
 */

/** The reel is laid out at this width, then scaled to fit its container. */
const W = 800;
const ASPECTS = { '16/9': 16 / 9, '16/10': 16 / 10 } as const;
type Aspect = keyof typeof ASPECTS;

/**
 * The loop seam is one sideways pan: "…as a Service" slides out to the left while
 * "Code migrations [folder] are simple." slides in from the right. It starts SEAM before the end
 * of the loop and finishes LOOP_TAIL into the next one.
 */
const LOOP = 19.7;
const SEAM = 0.6;
const LOOP_TAIL = 0.6;
const SEAM_START = LOOP - SEAM;

/**
 * Pauses, as [timeline time, seconds]: linger on the finished agent window (pink folder, sparkles,
 * "Done!"), on the settled pile of folders before it drops away, and on the pink, sparkled stack.
 */
const HOLDS: [number, number][] = [
  [7.75, 1.2],
  [10.55, 1.0],
  [17.15, 0.6],
];
const HOLD = HOLDS.reduce((sum, [, d]) => sum + d, 0);
/** Real playback time → timeline time, with the timeline frozen during each hold. */
const sceneTime = (t: number) => {
  for (const [at, d] of HOLDS) {
    if (t < at) return t;
    t = Math.max(at, t - d);
  }
  return t;
};
/** Shown instead of the animation when the visitor prefers reduced motion. */
const STILL_TIME = 1.6;

const BLUE = '#217EE8';
const PINK = '#F4C4E6';
const FOLDER_RATIO = 279 / 380;
const FOLDER_PATH =
  'M0 25C0 11.1929 11.1929 0 25 0H174.406C183.018 0 190 6.98152 190 15.5937C190 24.2058 196.982 31.1873 205.594 31.1873H355C368.807 31.1873 380 42.3802 380 56.1873V254C380 267.807 368.807 279 355 279H25C11.1929 279 0 267.807 0 254V25Z';

const SPARKLE_PATH =
  'M21.5419 1.95899C22.5084 -0.652864 26.2026 -0.652868 27.169 1.95899L31.9795 14.959C32.2833 15.7802 32.9308 16.4276 33.7519 16.7315L46.7519 21.5419C49.3638 22.5084 49.3638 26.2026 46.752 27.169L33.7519 31.9795C32.9308 32.2833 32.2833 32.9308 31.9795 33.7519L27.169 46.7519C26.2026 49.3638 22.5084 49.3638 21.5419 46.752L16.7315 33.7519C16.4276 32.9308 15.7802 32.2833 14.959 31.9795L1.95899 27.169C-0.652864 26.2026 -0.652868 22.5084 1.95899 21.5419L14.959 16.7315C15.7802 16.4276 16.4276 15.7802 16.7315 14.959L21.5419 1.95899Z';

/** "Thinking..." sweep: one gradient, moving left to right across the dot grid and the text. */
const SHIMMER_STOPS: [number, string][] = [
  [0, '#9a9a9a'],
  [0.3, '#9a9a9a'],
  [0.44, '#217EE8'],
  [0.56, '#E07BC4'],
  [0.7, '#9a9a9a'],
  [1, '#9a9a9a'],
];
const SHIMMER_PERIOD = 240; // px between sweeps
const SHIMMER_SPEED = 190; // px per second
const SHIMMER_GRADIENT = `linear-gradient(90deg, ${SHIMMER_STOPS.map(([at, c]) => `${c} ${at * 100}%`).join(', ')})`;

function shimmerAt(x: number, shift: number) {
  const u = (((x - shift) % SHIMMER_PERIOD) + SHIMMER_PERIOD) % SHIMMER_PERIOD / SHIMMER_PERIOD;
  for (let i = 1; i < SHIMMER_STOPS.length; i++) {
    const [a, ca] = SHIMMER_STOPS[i - 1];
    const [b, cb] = SHIMMER_STOPS[i];
    if (u <= b) return mixHex(ca, cb, (u - a) / (b - a));
  }
  return SHIMMER_STOPS[0][1];
}

const PROMPT = 'Replace hardcoded values with tokens';
const REPO = 'checkout-card';

/** The closing line, typed in word by word as the story plays out under it. */
const WORDS = [
  'So',
  'we',
  'built',
  'a',
  'migration',
  'dashboard',
  'that',
  'discovers',
  'and',
  'migrates',
  'codebases,',
  'agentically.',
].map((rest) => ({ first: '', rest }));
const SLOT_AFTER = 8; // the folder stack opens between "and" and "migrates"
/** A sparkle sits just before "agentically." */
const SPARKLE_BEFORE = 11;
const SPARKLE_SPACE = 30;
/** The "And [stack] Migrates" folders are the same size the swarm folders arrive at. */
const STACK_FOLDER = 32;
const SLOT_WIDTH = 60; // room for the stack and breathing space
/** The stack fans out up and to the right, so sit the front folder this far left of the gap's centre. */
const STACK_SHIFT = 4;
const WORD_GAP = 10;
const DIM = 0.4;

const POOL_SIZE = 84;
/** Folders that rain down in the "thousands" scene, and when the drop starts. */
/** Enough to bury the whole frame — it stands in for thousands of codebases. */
const FALL_COUNT = 460;
const FALL_START = 8.6;
/** The pink, sparkled folder from the agent window grows to the same size as the rest, then falls. */
const HUB_SIZE = 32;
/** Once the pile has settled, the floor gives way and every folder drops out the bottom. */
const FALL_EXIT = 10.6;
const EXIT_GRAVITY = 2600; // design px/s²
const exitDrop = (t: number, delay: number) => {
  const dt = Math.max(0, t - FALL_EXIT - delay);
  return 0.5 * EXIT_GRAVITY * dt * dt;
};

// ---------------------------------------------------------------- timing helpers

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const smooth = (p: number) => p * p * (3 - 2 * p);
const inOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const outCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const outBack = (p: number) => {
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};

/** Piecewise track through [time, value] keys, smoothed between each pair. */
function track(t: number, keys: [number, number][]) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return lerp(v0, v1, smooth(seg(t, t0, t1)));
    }
  }
  return keys[keys.length - 1][1];
}

function mixHex(a: string, b: string, p: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], p))).join(',')})`;
}

// ---------------------------------------------------------------- per-word tracks

/** When each word types in, [start, end] (about 55ms a letter). */
const WORD_EXPAND: [number, number][][] = [
  [[11.12, 0], [11.23, 1]], // So
  [[11.28, 0], [11.39, 1]], // we
  [[11.44, 0], [11.72, 1]], // built
  [[11.78, 0], [11.84, 1]], // a
  [[11.9, 0], [12.38, 1]], // migration
  [[12.44, 0], [12.92, 1]], // dashboard
  [[13.02, 0], [13.24, 1]], // that
  [[13.29, 0], [13.78, 1]], // discovers — the folders scatter in
  [[14.5, 0], [14.68, 1]], // and — the swarm heads for the middle
  [[14.78, 0], [15.3, 1]], // migrates
  [[17.3, 0], [17.82, 1]], // codebases,
  [[17.9, 0], [18.5, 1]], // agentically.
];
/** The phrase being typed is bright; earlier phrases dim. */
const WORD_ALPHA: [number, number][][] = [
  ...[0, 1, 2, 3, 4, 5].map((): [number, number][] => [[13.02, 1], [13.35, DIM]]),
  ...[6, 7].map((): [number, number][] => [[14.5, 1], [14.85, DIM]]),
  ...[8, 9].map((): [number, number][] => [[17.3, 1], [17.65, DIM]]),
  ...[10, 11].map((): [number, number][] => [[0, 1]]),
];
const SLOT_OPEN: [number, number][] = [[14.5, 0], [15.3, 1], [17.3, 1], [17.9, 0]];
/** What the camera centres on (a span of words, or the folder slot), and when it moves there. */
const FOCUS: { at: number; to: number; range: [number, number] | 'slot' }[] = [
  { at: 0, to: 0, range: [0, 5] }, // "So we built a migration dashboard"
  { at: 13.02, to: 13.78, range: [6, 7] }, // "that discovers"
  // the slot lands dead centre just as the swarm of folders arrives in it
  { at: 14.5, to: 15.5, range: 'slot' },
  { at: 17.3, to: 18.5, range: [10, 11] }, // "codebases, agentically."
];

// ---------------------------------------------------------------- folder pool

type PoolFolder = {
  size: number;
  /** Only the first POOL_SIZE folders take part in the discovery scene. */
  discover: { x: number; y: number; delay: number; alpha: number } | null;
  stagger: number;
};

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function scatter(
  rand: () => number,
  H: number,
  count: number,
  minDist: number,
  sample: () => { x: number; y: number },
  blocked: (x: number, y: number) => boolean,
) {
  const points: { x: number; y: number }[] = [];
  for (let tries = 0; points.length < count && tries < 6000; tries++) {
    const p = sample();
    if (blocked(p.x, p.y)) continue;
    const near = points.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < minDist * (tries > 3000 ? 0.7 : 1));
    if (!near) points.push(p);
  }
  while (points.length < count) points.push({ x: rand() * W, y: H * (0.4 + rand() * 0.6) });
  return points;
}

function buildPool(H: number): PoolFolder[] {
  const rand = rng(7);
  const discover = scatter(
    rand,
    H,
    POOL_SIZE,
    40,
    () => ({ x: rand() * W, y: rand() * H }),
    (x, y) => x > W * 0.08 && x < W * 0.92 && Math.abs(y - H / 2) < 30,
  );
  return Array.from({ length: Math.max(POOL_SIZE, FALL_COUNT) }, (_, i) => {
    const p = discover[i];
    return {
      size: 26 + rand() * 12,
      discover: p ? { ...p, delay: rand() * 0.7, alpha: rand() < 0.35 ? 0.3 + rand() * 0.25 : 1 } : null,
      stagger: rand() * 0.35,
    };
  });
}

function Folder(props: SVGProps<SVGSVGElement> & Record<`data-${string}`, unknown>) {
  return (
    <svg {...props} viewBox="0 0 380 279" preserveAspectRatio="none" aria-hidden="true">
      <path d={FOLDER_PATH} fill="currentColor" />
    </svg>
  );
}

function Sparkle(props: SVGProps<SVGSVGElement> & Record<`data-${string}`, unknown>) {
  return (
    <svg {...props} viewBox="0 0 49 49" aria-hidden="true">
      <path d={SPARKLE_PATH} fill="currentColor" />
    </svg>
  );
}

// ---------------------------------------------------------------- component

export default function MigrationReel({ aspect = '16/9' }: { aspect?: Aspect }) {
  const H = Math.round(W / ASPECTS[aspect]);
  const base = import.meta.env.BASE_URL;

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const poolRef = useRef<PoolFolder[]>(buildPool(H));

  const [scale, setScale] = useState(0);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const playing = inView && pageVisible && !reducedMotion;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => setScale(root.clientWidth / W);
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(root);

    const visibility = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: [0, 0.2],
    });
    visibility.observe(root);

    const onVisibility = () => setPageVisible(!document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReducedMotion(motion.matches);
    onMotion();
    motion.addEventListener('change', onMotion);

    return () => {
      resize.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', onMotion);
    };
  }, []);

  /** Playhead survives pauses so the reel resumes where it left off. */
  /** Starts just past the seam, so the first play opens on the settled first screen. */
  const timeRef = useRef(LOOP_TAIL);
  const renderRef = useRef<((t: number) => void) | null>(null);

  // Build the renderer once the scene is in the DOM.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const q = <T extends Element = HTMLElement>(sel: string) => canvas.querySelector(sel) as T;
    const qa = <T extends Element = HTMLElement>(sel: string) => Array.from(canvas.querySelectorAll(sel)) as T[];

    const intro = q('[data-intro]');
    const introWords = qa('[data-intro-word]');
    const spacer = q('[data-intro-folder]');
    const fly = q('[data-fly]');
    const flyTile = q('[data-fly-tile]');
    const morph = q('[data-morph]');
    const hero = q('[data-hero]');
    const morphWindow = q('[data-morph-window]');
    const windowBody = q('[data-window-body]');
    const chip = q('[data-chip]');
    const chipLabel = q('[data-chip-label]');
    const chipFolder = q('[data-chip-folder]');
    const prompt = q('[data-prompt]');
    const typed = q('[data-typed]');
    const placeholder = q('[data-placeholder]');
    const caret = q('[data-caret]');
    const send = q('[data-send]');
    const chipSparkles = qa('[data-chip-sparkle]');
    const thinkingDots = qa('[data-thinking-dot]');
    const thinkingText = q('[data-thinking-text]');
    thinkingText.style.backgroundImage = SHIMMER_GRADIENT;
    thinkingText.style.backgroundSize = `${SHIMMER_PERIOD}px 100%`;
    const status = q('[data-status]');
    const statusThinking = q('[data-status-thinking]');
    const statusDone = q('[data-status-done]');
    const thousandsText = q('[data-thousands]');
    const poolEls = qa('[data-pool]');
    const strip = q('[data-strip]');
    const wordEls = qa('[data-word]');
    const firstEls = qa('[data-first]');
    const restEls = qa('[data-rest]');
    const letterEls = restEls.map((el) => Array.from(el.children) as HTMLElement[]);
    const sparkle = q('[data-sparkle]');
    const slotFolder = q('[data-slot-folder]');
    const slotStack = qa('[data-slot-stack]');
    const slotSparkles = qa('[data-slot-sparkle]');

    // Layout facts measured from the DOM (all unscaled design px).
    let folderRect = { x: W / 2 - 28, y: H / 2 - 20, w: 56, h: 56 * FOLDER_RATIO };
    const windowRect = { x: W * 0.075, y: H * 0.23, w: W * 0.85, h: H * 0.95 };
    const bodyTop = H * 0.31;
    windowBody.style.top = `${bodyTop}px`;
    /** Where the chip's folder icon sits, relative to the window's top-left corner. */
    let chipRect = { x: 0, y: 0, w: 20, h: 20 * FOLDER_RATIO };
    /** The chip's white pill, relative to the window's top-left corner. */
    let chipBox = { x: 0, y: 0, w: 120, h: 28 };
    let firstW = WORDS.map(() => 0);
    /** Width of each word's first n typed letters, for n = 0…length. */
    let prefixW = WORDS.map(() => [0]);
    // Dot centres and text start, in the status row's own coordinates.
    let dotX: number[] = [];
    let textX = 0;
    const measure = () => {
      dotX = thinkingDots.map((el) => el.offsetLeft + el.offsetWidth / 2);
      textX = thinkingText.offsetLeft;
      folderRect = {
        x: intro.offsetLeft + spacer.offsetLeft,
        y: intro.offsetTop + spacer.offsetTop,
        w: spacer.offsetWidth,
        h: spacer.offsetHeight,
      };
      chipBox = {
        x: (windowRect.w - windowBody.offsetWidth) / 2 + chip.offsetLeft,
        y: bodyTop + chip.offsetTop,
        w: chip.offsetWidth,
        h: chip.offsetHeight,
      };
      chipRect = {
        x: (windowRect.w - windowBody.offsetWidth) / 2 + chipFolder.offsetLeft,
        y: bodyTop + chipFolder.offsetTop,
        w: chipFolder.offsetWidth,
        h: chipFolder.offsetHeight,
      };
      firstW = firstEls.map((el) => el.offsetWidth);
      prefixW = restEls.map((el, i) => [
        0,
        ...letterEls[i].map((letter) => letter.offsetLeft + letter.offsetWidth - el.offsetLeft),
      ]);
    };
    measure();
    document.fonts?.ready.then(() => {
      measure();
      renderRef.current?.(sceneTime(timeRef.current));
    });

    const hub = { x: W / 2, y: H * 0.7 };
    const hubRect = { x: hub.x - HUB_SIZE / 2, y: hub.y - (HUB_SIZE * FOLDER_RATIO) / 2, w: HUB_SIZE, h: HUB_SIZE * FOLDER_RATIO };
    const pool = poolRef.current;

    // The folder rain is simulated once with real physics, in a worker so a few hundred bodies
    // never stall the page. Falls back to the main thread if workers aren't available.
    let fall: FolderFall | null = null;
    let disposed = false;
    const options: FolderFallOptions = {
      width: W,
      height: H,
      count: FALL_COUNT,
      duration: FALL_EXIT - FALL_START + 0.1,
      ratio: FOLDER_RATIO,
      first: { ...hub, size: HUB_SIZE },
    };
    const receive = (result: FolderFall) => {
      if (disposed) return;
      fall = result;
      renderRef.current?.(sceneTime(timeRef.current));
    };
    const simulateHere = () =>
      import('../../lib/folder-fall').then(({ simulateFolderFall }) => receive(simulateFolderFall(options)));
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('../../lib/folder-fall.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<FolderFall>) => {
        receive(event.data);
        worker?.terminate();
      };
      worker.onerror = () => {
        worker?.terminate();
        simulateHere();
      };
      worker.postMessage(options);
    } catch {
      simulateHere();
    }

    const show = (el: HTMLElement, visible: boolean) => {
      el.style.visibility = visible ? 'visible' : 'hidden';
    };

    const render = (t: number) => {
      // ---------------------------------------------------------- intro sentence
      // The intro starts arriving at the end of the previous loop, so read it on a wrapped clock.
      const ti = t >= SEAM_START ? t - LOOP : t;
      const slideIn = (1 - inOut(seg(ti, -SEAM, LOOP_TAIL))) * W;
      const introAlpha = track(ti, [[2.4, 1], [2.8, 0]]);
      show(intro, introAlpha > 0);
      intro.style.transform = `translateX(${slideIn}px)`;
      introWords.forEach((el) => {
        el.style.opacity = String(introAlpha);
      });

      // ---------------------------------------------------------- folder flies into the window
      const win = windowRect;
      const rise = outCubic(seg(t, 2.45, 3.3));
      const riseY = (1 - rise) * 40;

      // The sentence's folder shrinks and lands on the chip's folder icon ("smart animate").
      const flight = inOut(seg(ti, 2.4, 3.3));
      const landed = ti >= 3.3;
      show(fly, !landed);
      fly.style.left = `${lerp(folderRect.x, win.x + chipRect.x, flight)}px`;
      fly.style.top = `${lerp(folderRect.y, win.y + riseY + chipRect.y, flight)}px`;
      fly.style.width = `${lerp(folderRect.w, chipRect.w, flight)}px`;
      fly.style.height = `${lerp(folderRect.h, chipRect.h, flight)}px`;
      fly.style.transform = `translateX(${slideIn}px)`;

      // A white tile pops in behind the folder as it lifts off, then shrinks with it into the chip's
      // white pill, so the folder arrives in the window already sitting in its chip.
      const tileIn = seg(ti, 2.15, 2.5); // pops in just as the folder starts to move, no pause on it
      const pad = folderRect.w * 0.14;
      const tileFrom = {
        x: folderRect.x - pad,
        y: folderRect.y - pad,
        w: folderRect.w + pad * 2,
        h: folderRect.h + pad * 2,
      };
      show(flyTile, tileIn > 0 && !landed);
      flyTile.style.left = `${lerp(tileFrom.x, win.x + chipBox.x, flight)}px`;
      flyTile.style.top = `${lerp(tileFrom.y, win.y + riseY + chipBox.y, flight)}px`;
      flyTile.style.width = `${lerp(tileFrom.w, chipBox.w, flight)}px`;
      flyTile.style.height = `${lerp(tileFrom.h, chipBox.h, flight)}px`;
      flyTile.style.borderRadius = `${lerp(tileFrom.h * 0.2, 6, flight)}px`;
      flyTile.style.opacity = String(outCubic(tileIn));
      flyTile.style.transform = `translateX(${slideIn}px) scale(${lerp(0.85, 1, outBack(tileIn))})`;

      // ---------------------------------------------------------- window
      const windowOut = seg(t, 7.8, 8.25);
      const morphAlpha = Math.min(track(t, [[2.4, 0], [2.65, 1]]), 1 - windowOut);
      show(morph, t > 2.4 && morphAlpha > 0);
      morph.style.left = `${win.x}px`;
      morph.style.top = `${win.y}px`;
      morph.style.width = `${win.w}px`;
      morph.style.height = `${win.h}px`;
      morph.style.opacity = String(morphAlpha);
      morph.style.transform =
        t < 7.8
          ? `translateY(${riseY}px) scale(${lerp(0.97, 1, rise)})`
          : `scale(${lerp(1, 0.95, outCubic(windowOut))})`;

      // ---------------------------------------------------------- the migrated folder
      // The chip's pink, sparkled folder grows out of the closing window, then falls with the rest as
      // physics folder 0, staying pink with its sparkles all the way down.
      const fallPose = fall && t >= FALL_START ? sampleFolderFall(fall, 0, Math.min(t, FALL_EXIT) - FALL_START) : null;
      let heroRect = { x: win.x + chipRect.x, y: win.y + chipRect.y, w: chipRect.w, h: chipRect.h };
      let heroAngle = 0;
      if (fallPose) {
        const y = fallPose.y + exitDrop(t, 0);
        heroRect = { x: fallPose.x - hubRect.w / 2, y: y - hubRect.h / 2, w: hubRect.w, h: hubRect.h };
        heroAngle = fallPose.angle;
      } else {
        const grow = inOut(seg(t, 7.8, 8.6));
        heroRect = {
          x: lerp(heroRect.x, hubRect.x, grow),
          y: lerp(heroRect.y, hubRect.y, grow),
          w: lerp(heroRect.w, hubRect.w, grow),
          h: lerp(heroRect.h, hubRect.h, grow),
        };
      }
      show(hero, t >= 7.8 && heroRect.y < H);
      hero.style.left = `${heroRect.x}px`;
      hero.style.top = `${heroRect.y}px`;
      hero.style.width = `${heroRect.w}px`;
      hero.style.height = `${heroRect.h}px`;
      hero.style.transform = `rotate(${heroAngle}rad)`;

      // ---------------------------------------------------------- agent window contents
      windowBody.style.opacity = String(track(t, [[7.8, 1], [8.05, 0]]));
      const chipOn = landed ? 1 : 0;
      chip.style.background = `rgba(255,255,255,${chipOn})`;
      chip.style.boxShadow = `0 1px 2px rgba(0,0,0,${0.06 * chipOn})`;
      chipLabel.style.opacity = String(seg(t, 3.3, 3.6));
      chipFolder.style.opacity = landed && t < 7.8 ? '1' : '0';
      const promptIn = outCubic(seg(t, 3.3, 3.75));
      prompt.style.opacity = String(promptIn);
      prompt.style.transform = `translateY(${(1 - promptIn) * 10}px)`;

      const chars = Math.floor(seg(t, 4.0, 5.4) * PROMPT.length);
      typed.textContent = PROMPT.slice(0, chars);
      placeholder.style.display = chars === 0 ? '' : 'none';
      caret.style.order = chars === 0 ? '-1' : '0';
      const typing = t > 4.0 && t < 5.4;
      caret.style.opacity = t > 3.6 && t < 5.7 && (typing || Math.floor(t * 2.4) % 2 === 0) ? '1' : '0';

      const ready = t >= 5.4 && t < 5.75;
      send.style.background = ready ? BLUE : '#a8a8a8';
      send.style.transform = `scale(${t > 5.6 && t < 5.75 ? 0.86 : 1})`;
      send.style.opacity = String(track(t, [[7.0, 1], [7.3, 0]]));

      const statusOpen = track(t, [[5.7, 0], [6.0, 1]]);
      status.style.height = `${statusOpen * 36}px`;
      status.style.opacity = String(statusOpen);
      const done = t >= 7.0;
      statusThinking.style.display = done ? 'none' : '';
      statusDone.style.display = done ? '' : 'none';
      // A gradient sweeps across the dots and the text as one continuous fill.
      const shift = t * SHIMMER_SPEED;
      thinkingText.style.backgroundPosition = `${shift - textX}px 0`;
      thinkingDots.forEach((el, i) => {
        el.style.background = shimmerAt(dotX[i], shift);
      });
      statusDone.style.opacity = String(seg(t, 7.0, 7.25));

      // The repo is updated: folder turns pink with a little bounce, then the sparkle pops in on it.
      chipFolder.style.color = mixHex(BLUE, PINK, seg(t, 7.0, 7.3));
      const bump = Math.sin(seg(t, 7.0, 7.35) * Math.PI);
      chipFolder.style.transform = `scale(${1 + bump * 0.18})`;
      chipSparkles.forEach((el, i) => {
        const spark = seg(t, 7.2 + i * 0.12, 7.6 + i * 0.12);
        el.style.opacity = String(Math.min(1, spark * 3));
        el.style.transform = `rotate(${(1 - outCubic(spark)) * -90}deg) scale(${outBack(spark)})`;
      });

      // ---------------------------------------------------------- "thousands" headline
      const thousandsAlpha = track(t, [[8.6, 0], [9.1, 1], [10.6, 1], [11.0, 0]]);
      show(thousandsText, thousandsAlpha > 0);
      thousandsText.style.opacity = String(thousandsAlpha);
      thousandsText.style.transform = `translate(-50%, calc(-50% + ${(1 - outCubic(seg(t, 8.6, 9.2))) * 12}px))`;

      // ---------------------------------------------------------- closing line
      // Just after the loop restarts, keep drawing the end of the previous loop as it slides away.
      const ts = t < LOOP_TAIL ? t + LOOP : t;
      const stripAlpha = track(ts, [[11.1, 0], [11.5, 1]]);
      // Slides off to the left in step with the intro sliding in from the right.
      const slideOut = inOut(seg(ts, SEAM_START, LOOP + LOOP_TAIL)) * W;
      show(strip, stripAlpha > 0 && ts < LOOP + LOOP_TAIL);
      strip.style.opacity = String(stripAlpha);

      // Each word comes in letter by letter at an even pace. Layout follows a smooth, fractional
      // letter count so the words after it glide along instead of jumping a letter at a time.
      const expand = WORD_EXPAND.map((keys) => seg(ts, keys[0][0], keys[1][0]));
      const typedW = WORDS.map((word, i) => {
        const n = expand[i] * word.rest.length;
        const k = Math.floor(n);
        const w = prefixW[i];
        return k >= word.rest.length ? w[k] ?? 0 : lerp(w[k] ?? 0, w[k + 1] ?? 0, n - k);
      });
      const slot = track(ts, SLOT_OPEN);
      // Lay the words out left to right. A space arrives like a typed character, as its word starts.
      const lefts: number[] = [];
      const widths: number[] = [];
      const started = WORDS.map((word, i) => Math.min(1, expand[i] * (word.rest.length + 1)));
      let x = 0;
      WORDS.forEach((_, i) => {
        if (i > 0) x += started[i] * WORD_GAP;
        if (i === SLOT_AFTER + 1) x += slot * SLOT_WIDTH;
        if (i === SPARKLE_BEFORE) x += started[i] * SPARKLE_SPACE;
        lefts.push(x);
        widths.push(firstW[i] + typedW[i]);
        x += widths[i];
      });
      // Midpoint of the space between "and" and "migrates".
      const slotX = (lefts[SLOT_AFTER] + widths[SLOT_AFTER] + lefts[SLOT_AFTER + 1]) / 2;

      const centre = (range: [number, number] | 'slot') =>
        range === 'slot' ? slotX - STACK_SHIFT : (lefts[range[0]] + lefts[range[1]] + widths[range[1]]) / 2;
      let focus = centre(FOCUS[0].range);
      for (let i = 1; i < FOCUS.length; i++) {
        const p = inOut(seg(ts, FOCUS[i].at, FOCUS[i].to));
        if (p > 0) focus = lerp(focus, centre(FOCUS[i].range), p);
      }
      const stripScale = lerp(0.94, 1, outCubic(seg(ts, 11.1, 11.6)));
      strip.style.transform = `translate(${W / 2 - focus * stripScale - slideOut}px, ${H / 2}px) scale(${stripScale})`;

      wordEls.forEach((el, i) => {
        el.style.transform = `translate(${lefts[i]}px, -50%)`;
        el.style.color = `rgba(255,255,255,${track(ts, WORD_ALPHA[i])})`;
        restEls[i].style.width = `${typedW[i]}px`;
        // Each letter fades and rises in just after the one before it.
        const n = expand[i] * WORDS[i].rest.length;
        letterEls[i].forEach((letter, k) => {
          const p = outCubic(clamp((n - k) / 1.6));
          letter.style.opacity = String(p);
          letter.style.transform = p < 1 ? `translateY(${(1 - p) * 0.28}em)` : '';
        });
      });

      // The sparkle spins in just before "agentically." as it starts typing.
      const sparkleIn = seg(ts, 17.86, 18.2);
      const sparkleX = lefts[SPARKLE_BEFORE] - WORD_GAP / 2 - SPARKLE_SPACE / 2;
      sparkle.style.opacity = String(Math.min(1, sparkleIn * 3));
      sparkle.style.transform = `translate(${sparkleX - 10}px, -50%) rotate(${(1 - outCubic(sparkleIn)) * -90}deg) scale(${outBack(sparkleIn)})`;

      const slotAlpha = track(ts, [[15.4, 0], [15.65, 1], [17.3, 1], [17.7, 0]]);
      // Once the stack lands it shakes (the migration running), turns pink as the shake settles,
      // then gets the same two AI sparkles as the migrated folder in the agent window.
      const shake = seg(ts, 16.0, 16.6);
      const shakeEnv = Math.sin(shake * Math.PI);
      const shakeRot = Math.sin(shake * Math.PI * 9) * 7 * shakeEnv;
      const shakeX = Math.sin(shake * Math.PI * 11) * 2.5 * shakeEnv;
      const pink = seg(ts, 16.35, 16.65);
      slotFolder.style.opacity = String(slotAlpha);
      slotFolder.style.transform = `translate(${slotX - STACK_SHIFT + shakeX}px, -50%) rotate(${shakeRot}deg) scale(${0.4 + 0.6 * slot})`;
      slotSparkles.forEach((el, i) => {
        const spark = seg(ts, 16.6 + i * 0.12, 17.0 + i * 0.12);
        el.style.opacity = String(Math.min(1, spark * 3));
        el.style.transform = `rotate(${(1 - outCubic(spark)) * -90}deg) scale(${outBack(spark)})`;
      });
      slotFolder.style.setProperty('--folder', mixHex(BLUE, PINK, pink));
      slotStack.forEach((el, i) => {
        // The stack builds up as the swarm lands, then the whole stack turns pink together.
        const p = outBack(seg(ts, 15.45 + i * 0.1, 15.85 + i * 0.1));
        el.style.opacity = String(Math.min(p, 1));
        const depth = (slotStack.length - i) * 4 * p;
        el.style.transform = `translate(${depth}px, ${-depth}px)`;
      });

      // ---------------------------------------------------------- folder pool
      const slotCentre = {
        x: W / 2 + (slotX - STACK_SHIFT - focus) * stripScale,
        y: H / 2,
      };
      pool.forEach((f, i) => {
        const el = poolEls[i];
        let px = 0;
        let py = 0;
        let s = 0;
        let a = 0;
        let angle = 0;
        if (t >= FALL_START && t < 11.6) {
          const p = fall && i > 0 && i < FALL_COUNT ? sampleFolderFall(fall, i, Math.min(t, FALL_EXIT) - FALL_START) : null;
          if (p) {
            px = p.x;
            // a hair of stagger so the pile crumbles rather than dropping as one sheet
            py = p.y + exitDrop(t, f.stagger * 0.12);
            angle = p.angle;
            s = fall!.sizes[i] / f.size;
            a = py - f.size < H ? 1 : 0;
          }
        } else if (f.discover && t > 13.2 && t < 15.9) {
          const d = f.discover;
          const appear = outBack(seg(t, 13.3 + d.delay, 13.65 + d.delay));
          // One continuous move from where each folder was found into the slot's folder.
          const converge = inOut(seg(t, 14.4 + f.stagger, 15.55 + f.stagger * 0.3));
          px = lerp(d.x, slotCentre.x, converge);
          py = lerp(d.y, slotCentre.y, converge);
          // settle to exactly the stack's folder size as they arrive
          s = appear * lerp(1, STACK_FOLDER / f.size, converge);
          a = lerp(d.alpha, 1, seg(converge, 0, 0.5)) * (appear > 0 ? 1 : 0) * (1 - seg(converge, 0.88, 1));
        }
        if (a <= 0 || s <= 0) {
          if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
          return;
        }
        el.style.visibility = 'visible';
        el.style.opacity = String(a);
        el.style.transform = `translate(${px - f.size / 2}px, ${py - (f.size * FOLDER_RATIO) / 2}px) rotate(${angle}rad) scale(${s})`;
      });
    };

    renderRef.current = render;
    render(sceneTime(timeRef.current));
    return () => {
      disposed = true;
      worker?.terminate();
      renderRef.current = null;
    };
  }, [H]);

  // Drive the playhead.
  useEffect(() => {
    const render = renderRef.current;
    if (!render) return;
    if (reducedMotion) {
      timeRef.current = STILL_TIME;
      render(STILL_TIME);
      return;
    }
    if (!playing) return;

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      timeRef.current = (timeRef.current + dt) % (LOOP + HOLD);
      render(sceneTime(timeRef.current));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="migration-reel"
      data-aspect={aspect}
      data-ready={scale > 0 ? '' : undefined}
      role="img"
      aria-label="Animation: code migrations are simple until there are thousands owned by different people. So we built a migration dashboard that discovers and migrates codebases, agentically."
    >
      <div
        className="migration-reel__bg"
        style={{ backgroundImage: `url('${base}images/case-studies/migration/reel-bg.webp')` }}
      />
      <div
        ref={canvasRef}
        className="migration-reel__canvas"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
        aria-hidden="true"
      >
        <div className="migration-reel__intro" data-intro>
          <span data-intro-word>Code migrations</span>
          <span className="migration-reel__intro-folder" data-intro-folder />
          <span data-intro-word>are simple.</span>
        </div>

        <div className="migration-reel__pool">
          {poolRef.current.map((f, i) => (
            <span
              key={i}
              className="migration-reel__pool-folder"
              data-pool
              style={{ width: f.size, height: f.size * FOLDER_RATIO }}
            >
              <Folder />
            </span>
          ))}
        </div>

        <span className="migration-reel__fly-tile" data-fly-tile />
        <Folder className="migration-reel__fly" data-fly />

        <div className="migration-reel__morph" data-morph>
          <div className="migration-reel__window" data-morph-window>
            <span className="migration-reel__dots">
              <i />
              <i />
              <i />
            </span>
            <div className="migration-reel__window-body" data-window-body>
              <span className="migration-reel__chip" data-chip>
                <span className="migration-reel__chip-folder" data-chip-folder>
                  <Folder />
                  <Sparkle className="migration-reel__chip-sparkle" data-chip-sparkle />
                  <Sparkle className="migration-reel__chip-sparkle migration-reel__chip-sparkle--small" data-chip-sparkle />
                </span>
                <span className="migration-reel__optical" data-chip-label>
                  {REPO}
                </span>
              </span>
              <div className="migration-reel__prompt" data-prompt>
                <div className="migration-reel__input">
                  <span className="migration-reel__input-text">
                    <span className="migration-reel__optical" data-typed />
                    <span className="migration-reel__placeholder migration-reel__optical" data-placeholder>
                      Ask me anything...
                    </span>
                    <span className="migration-reel__caret" data-caret />
                  </span>
                  <span className="migration-reel__send" data-send>
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3.5 8h9M8.5 4l4 4-4 4" />
                    </svg>
                  </span>
                </div>
                <div className="migration-reel__status" data-status>
                  <span className="migration-reel__status-row" data-status-thinking>
                    <span className="migration-reel__dot-grid">
                      {Array.from({ length: 9 }, (_, i) => (
                        <i key={i} data-thinking-dot />
                      ))}
                    </span>
                    <span className="migration-reel__shimmer migration-reel__optical" data-thinking-text>
                      Thinking...
                    </span>
                  </span>
                  <span className="migration-reel__status-row" data-status-done>
                    <svg className="migration-reel__check" viewBox="0 0 16 16" aria-hidden="true">
                      <circle cx="8" cy="8" r="6.6" />
                      <path d="M5.4 8.2 7.2 10l3.4-3.8" />
                    </svg>
                    <span className="migration-reel__optical">Done!</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <span className="migration-reel__hero" data-hero>
          <Folder />
          <Sparkle className="migration-reel__chip-sparkle" />
          <Sparkle className="migration-reel__chip-sparkle migration-reel__chip-sparkle--small" />
        </span>

        <p className="migration-reel__headline" data-thousands>
          Until there are thousands
          <br />
          owned by different people.
        </p>

        <div className="migration-reel__strip" data-strip>
          <Sparkle className="migration-reel__sparkle" data-sparkle />
          {WORDS.map((word, i) => (
            <span key={i} className="migration-reel__word" data-word>
              <span data-first>{word.first}</span>
              <span className="migration-reel__rest" data-rest>
                {word.rest.split('').map((letter, k) => (
                  <span key={k} className="migration-reel__letter">
                    {letter}
                  </span>
                ))}
              </span>
            </span>
          ))}
          <span className="migration-reel__slot-folder" data-slot-folder>
            <span className="migration-reel__slot-stack" data-slot-stack>
              <Folder />
            </span>
            <span className="migration-reel__slot-stack" data-slot-stack>
              <Folder />
            </span>
            <span className="migration-reel__slot-front">
              <Folder />
              <Sparkle className="migration-reel__chip-sparkle" data-slot-sparkle />
              <Sparkle className="migration-reel__chip-sparkle migration-reel__chip-sparkle--small" data-slot-sparkle />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
