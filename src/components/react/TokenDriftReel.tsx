import { useEffect, useRef, useState } from 'react';
import './TokenDriftReel.css';

/**
 * Motion reel for the design system audit: one checkbox split down the middle, design on the left and
 * code on the right (each half labelled), disagreeing on colour, weight, and spacing. In one beat,
 * both halves settle on the same tokens and line up.
 *
 * The whole reel is one timeline in seconds. `render(t)` writes every style straight to the DOM from
 * `t`, so a frame is a pure function of time and React only renders the scene once.
 * (The earlier version, which changed the tokens one at a time, is in archive/token-drift-reel-one-by-one.)
 */

/** The reel is laid out at this width, then scaled to fit its container. */
const W = 960;
const ASPECTS = { '16/9': 16 / 9, '16/10': 16 / 10 } as const;
type Aspect = keyof typeof ASPECTS;

const LOOP = 7.9;
/** Shown instead of the animation when the visitor prefers reduced motion: the two sides disagreeing. */
const STILL_TIME = 1.4;

/** The moment both halves settle on the same tokens. */
const SETTLE = 2.55;
const SETTLE_END = SETTLE + 0.6;
/** The measurements stay up long enough to read, then clear. */
const CLEAR = 5.2;
const CLEAR_END = CLEAR + 0.4;
/** Everything eases back to how it started, so the last frame runs straight into the first. */
const DRIFT = 6.9;
const DRIFT_END = DRIFT + 0.7;

const TEXT_SECONDARY = '#525252';
const INPUT_LABEL = '#7a7a7a';
const TEXT_PRIMARY = '#171717';
/** The heavier label in design, as a text stroke so the weight can ease rather than snap. */
const HEAVY_STROKE = 1.1;

const GAP = { design: 4, code: 24, shared: 12 };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const smooth = (p: number) => p * p * (3 - 2 * p);
const inOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const ease = (t: number, a: number, b: number) => smooth(seg(t, a, b));
/** Fades in over [a, b] and out over [c, d]. */
const pulse = (t: number, a: number, b: number, c: number, d: number) => Math.min(ease(t, a, b), 1 - ease(t, c, d));

function mixHex(a: string, b: string, p: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], p))).join(',')})`;
}

function Checkbox({ side }: { side: 'design' | 'code' }) {
  return (
    <div className={`token-drift-reel__layer token-drift-reel__layer--${side}`} data-layer={side}>
      <div className="token-drift-reel__component">
        <span className="token-drift-reel__box" />
        <div className="token-drift-reel__text">
          <span className="token-drift-reel__label" data-label>
            Selection Label
            <i className="token-drift-reel__outline" data-outline />
          </span>
          <div className="token-drift-reel__band" data-band>
            <span data-band-value />
          </div>
          <span className="token-drift-reel__description" data-description>
            Supporting description text
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TokenDriftReel({ aspect = '16/9' }: { aspect?: Aspect }) {
  const H = Math.round(W / ASPECTS[aspect]);
  const base = import.meta.env.BASE_URL;

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

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
  const timeRef = useRef(0);
  const renderRef = useRef<((t: number) => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const q = <T extends Element = HTMLElement>(sel: string, from: ParentNode = canvas) => from.querySelector(sel) as T;

    const side = (name: string) => {
      const layer = q(`[data-layer="${name}"]`);
      return {
        label: q('[data-label]', layer),
        outline: q('[data-outline]', layer),
        band: q('[data-band]', layer),
        bandValue: q('[data-band-value]', layer),
        description: q('[data-description]', layer),
      };
    };
    const design = side('design');
    const code = side('code');

    const render = (t: number) => {
      const kept = 1 - ease(t, DRIFT, DRIFT_END);

      // ---------------------------------------------------------- the checkbox on each side
      const settled = ease(t, SETTLE, SETTLE_END) * kept;
      design.label.style.color = mixHex(TEXT_SECONDARY, TEXT_PRIMARY, settled);
      code.label.style.color = mixHex(INPUT_LABEL, TEXT_PRIMARY, settled);
      design.label.style.webkitTextStroke = `${lerp(HEAVY_STROKE, 0, settled)}px currentColor`;

      const moved = inOut(seg(t, SETTLE, SETTLE_END)) * kept;
      const marks = pulse(t, 0.5, 0.9, CLEAR, CLEAR_END);
      for (const [name, parts] of [['design', design], ['code', code]] as const) {
        const gap = lerp(GAP[name], GAP.shared, moved);
        parts.description.style.transform = `translateY(${gap}px)`;
        parts.band.style.height = `${gap}px`;
        parts.band.style.opacity = String(marks);
        parts.bandValue.textContent = String(Math.round(gap));
        parts.outline.style.opacity = String(marks);
      }
    };

    renderRef.current = render;
    render(timeRef.current);
    document.fonts?.ready.then(() => renderRef.current?.(timeRef.current));
    return () => {
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
      timeRef.current = (timeRef.current + dt) % LOOP;
      render(timeRef.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="token-drift-reel"
      data-aspect={aspect}
      data-ready={scale > 0 ? '' : undefined}
      role="img"
      aria-label="Animation: a checkbox split between design and code. Its label colour, weight, and the spacing above its description differ between the two, then both sides settle on the same tokens and match."
    >
      <div
        className="token-drift-reel__half token-drift-reel__half--design"
        style={{ backgroundImage: `url('${base}images/case-studies/des-sys/pink-texture.webp')` }}
      />
      <div
        className="token-drift-reel__half token-drift-reel__half--code"
        style={{ backgroundImage: `url('${base}images/case-studies/des-sys/grey-texture.webp')` }}
      />
      <div
        ref={canvasRef}
        className="token-drift-reel__canvas"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
        aria-hidden="true"
      >
        <div className="token-drift-reel__stage">
          <Checkbox side="design" />
          <Checkbox side="code" />

          <span className="tag token-drift-reel__side-tag token-drift-reel__side-tag--design">Design</span>
          <span className="tag token-drift-reel__side-tag token-drift-reel__side-tag--code">Code</span>
        </div>
      </div>
    </div>
  );
}
