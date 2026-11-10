import { useEffect, useRef, useState, type ReactNode } from 'react';
import './TokenDriftReel.css';

/**
 * Motion reel for the design system audit: one checkbox split down the middle, design on the left and
 * code on the right, disagreeing on colour, weight, and spacing. In one beat, every token changes
 * together in the Figma panel and the code diff, and the two halves line up.
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

/** The moment everything changes: the tokens swap, then the checkbox follows. */
const SWAP = 2.1;
const SWAP_END = SWAP + 0.4;
const SETTLE = SWAP + 0.45;
const SETTLE_END = SETTLE + 0.6;
/** The diff and the measurements stay up long enough to read, then clear. */
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

const PANEL = { x: 105, width: 270 };
/** Both panels start this far above the bottom of the reel. */
const PANEL_RISE = 280;
/** The checkbox.css title bar above the code rows. */
const CODE_TITLE = 34;
const CODE_ROW = 22;
const CODE_TOP = 8;

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

type CodeRow = { kind?: 'old' | 'new'; before?: string; mark?: string; after?: string; text?: string };

const CODE_ROWS: CodeRow[] = [
  { text: '.spanWrapper {' },
  { kind: 'old', before: '  color: var(--color-', mark: 'input-label', after: ');' },
  { kind: 'new', before: '  color: var(--color-', mark: 'text-primary', after: ');' },
  { text: '  display: flex;' },
  { text: '  font-weight: var(--font-weight-component);' },
  { kind: 'old', before: '  gap: var(--', mark: 'spacing-l', after: ');' },
  { kind: 'new', before: '  gap: var(--', mark: 'spacing-s', after: ');' },
  { text: '}' },
];

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

function PanelRow({ name, icon, from, to }: { name: string; icon: ReactNode; from: string; to: string }) {
  return (
    <div className="token-drift-reel__panel-row">
      <span className="token-drift-reel__row-name">{name}</span>
      <div className="token-drift-reel__row" data-row>
        <span className="token-drift-reel__icon">{icon}</span>
        <span className="token-drift-reel__swap">
          <span data-value-from>{from}</span>
          <span data-value-to>{to}</span>
        </span>
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
    const qa = (sel: string) => Array.from(canvas.querySelectorAll<HTMLElement>(sel));

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

    const swatch = q('[data-swatch]');
    const panelRows = qa('[data-row]');
    const valuesFrom = qa('[data-value-from]');
    const valuesTo = qa('[data-value-to]');
    const codePanel = q('[data-code]');
    const codeRows = qa('[data-code-row]');

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

      // ---------------------------------------------------------- Figma panel: every value at once
      const swapped = ease(t, SWAP, SWAP_END) * kept;
      valuesFrom.forEach((el) => {
        el.style.opacity = String(1 - swapped);
      });
      valuesTo.forEach((el) => {
        el.style.opacity = String(swapped);
      });
      swatch.style.background = mixHex(TEXT_SECONDARY, TEXT_PRIMARY, swapped);
      const active = pulse(t, SWAP - 0.4, SWAP - 0.1, CLEAR, CLEAR_END);
      panelRows.forEach((row) => row.style.setProperty('--active', String(active)));

      // ---------------------------------------------------------- code panel: the whole diff at once
      const redTint = pulse(t, SWAP - 0.4, SWAP - 0.1, CLEAR, CLEAR_END);
      const greenIn = ease(t, SWAP, SWAP_END) * kept;
      const greenTint = pulse(t, SWAP, SWAP_END, CLEAR, CLEAR_END);
      const collapse = ease(t, CLEAR, CLEAR_END) * kept;

      let y = CODE_TITLE + CODE_TOP;
      codeRows.forEach((row, i) => {
        const { kind } = CODE_ROWS[i];
        const h = kind === 'old' ? 1 - collapse : kind === 'new' ? greenIn : 1;
        row.style.transform = `translateY(${y}px)`;
        row.style.height = `${h * CODE_ROW}px`;
        row.style.opacity = String(Math.min(1, h * 1.4));
        row.style.visibility = h > 0 ? 'visible' : 'hidden';
        row.style.setProperty('--tint', String(kind === 'old' ? redTint : kind === 'new' ? greenTint : 0));
        y += h * CODE_ROW;
      });
      codePanel.style.height = `${y + CODE_TOP}px`;
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
      aria-label="Animation: a checkbox split between design and code. Its label colour, weight, and the spacing above its description differ between the two. The tokens all change together in Figma and in the code, and both sides match."
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

          <div className="token-drift-reel__panel" style={{ left: PANEL.x, top: H - PANEL_RISE, width: PANEL.width }}>
            <div className="token-drift-reel__panel-title">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 1.2 10.2 3.4 8 5.6 5.8 3.4ZM3.4 5.8 5.6 8 3.4 10.2 1.2 8ZM12.6 5.8 14.8 8 12.6 10.2 10.4 8ZM8 10.4 10.2 12.6 8 14.8 5.8 12.6Z" />
              </svg>
              Checkbox
            </div>
            <PanelRow
              name="Fill"
              icon={<b className="token-drift-reel__swatch" data-swatch />}
              from="text-secondary"
              to="text-primary"
            />
            <PanelRow name="Weight" icon={<span>Aa</span>} from="font-weight-heading" to="font-weight-component" />
            <PanelRow
              name="Gap"
              icon={
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 2.5h12M2 13.5h12M8 5v6M6.2 6.6 8 4.8l1.8 1.8M6.2 9.4 8 11.2l1.8-1.8" />
                </svg>
              }
              from="spacing-xxs"
              to="spacing-s"
            />
          </div>

          <div className="token-drift-reel__code" data-code style={{ top: H - PANEL_RISE }}>
            <div className="token-drift-reel__code-title" style={{ height: CODE_TITLE }}>
              <i>{'{}'}</i>
              checkbox.css
            </div>
            {CODE_ROWS.map((row, i) => (
              <div key={i} className={`token-drift-reel__code-row${row.kind ? ` is-${row.kind}` : ''}`} data-code-row>
                {row.kind ? <i>{row.kind === 'old' ? '−' : '+'}</i> : null}
                <code>
                  {row.text ?? row.before}
                  {row.mark ? <mark>{row.mark}</mark> : null}
                  {row.after}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
