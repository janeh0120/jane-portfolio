import { useEffect, useRef, useState } from 'react';
import './TokenDriftReel.css';

/**
 * Motion reel for the design system audit: one checkbox split down the middle, design on the left and
 * code on the right, with its tokens brought back into line one at a time: the colour in code, the
 * weight in design, then the spacing in both.
 *
 * The whole reel is one timeline in seconds. `render(t)` writes every style straight to the DOM from
 * `t`, so a frame is a pure function of time and React only renders the scene once.
 */

/** The reel is laid out at this width, then scaled to fit its container. */
const W = 960;
const ASPECTS = { '16/9': 16 / 9, '16/10': 16 / 10 } as const;
type Aspect = keyof typeof ASPECTS;

const LOOP = 16.1;
/** Shown instead of the animation when the visitor prefers reduced motion: the two sides disagreeing. */
const STILL_TIME = 1;

const INPUT_LABEL = '#737373';
const TEXT_PRIMARY = '#171717';
/** The heavier label in design, as a text stroke so the weight can ease rather than snap. */
const HEAVY_STROKE = 1.1;

const GAP = { design: 4, code: 24, shared: 12 };

/** The two Figma-style picks start this many seconds apart from when the cursor arrives. */
const WEIGHT_PICK = 4.7;
const SPACING_PICK = 8.9;
/** Once a pick starts: the option is clicked and the value changes this much later. */
const PICK_CHANGE = 2.2;

const PANEL = { x: 105, width: 270 };
const PANEL_VISIBLE = 172;
const ROW_Y = 52;
const ROW_HEIGHT = 38;
const MENU_LIFT = 44;
const MENU_Y = 90;
const MENU_HEAD = 36;
const OPTION_HEIGHT = 34;

const CODE_ROW = 24;
const CODE_TOP = 10;

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

// ---------------------------------------------------------------- code panel

type CodeRow = { id?: string; kind?: 'old' | 'new'; before?: string; mark?: string; after?: string; text?: string };

const CODE_ROWS: CodeRow[] = [
  { text: '.spanWrapper {' },
  { id: 'color-old', kind: 'old', before: '  color: var(--color-', mark: 'input-label', after: ');' },
  { id: 'color-new', kind: 'new', before: '  color: var(--color-', mark: 'text-primary', after: ');' },
  { text: '  opacity: 100%;' },
  { text: '  display: flex;' },
  { text: '  align-items: flex-start;' },
  { id: 'weight', before: '  font-weight: var(--', mark: 'font-weight-component', after: ');' },
  { id: 'gap-old', kind: 'old', before: '  gap: var(--', mark: 'spacing-l', after: ');' },
  { id: 'gap-new', kind: 'new', before: '  gap: var(--', mark: 'spacing-s', after: ');' },
  { text: '}' },
];

// ---------------------------------------------------------------- pieces

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

function Check() {
  return (
    <svg className="token-drift-reel__check" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function PickPage({
  name,
  title,
  icon,
  from,
  to,
}: {
  name: string;
  title: string;
  icon: React.ReactNode;
  from: string;
  to: string;
}) {
  return (
    <div className="token-drift-reel__page" data-page={name}>
      <div className="token-drift-reel__panel-head">
        <span>{title}</span>
        <i>+</i>
      </div>
      <div className="token-drift-reel__row" data-row>
        <span className="token-drift-reel__icon">{icon}</span>
        <span className="token-drift-reel__swap">
          <span data-value-from>{from}</span>
          <span data-value-to>{to}</span>
        </span>
      </div>
      <div className="token-drift-reel__menu" data-menu>
        <p>Libraries</p>
        <i className="token-drift-reel__menu-highlight" data-menu-highlight />
        <div className="token-drift-reel__option">
          <span className="token-drift-reel__icon">{icon}</span>
          <span>{from}</span>
          <span data-check-from>
            <Check />
          </span>
        </div>
        <div className="token-drift-reel__option">
          <span className="token-drift-reel__icon">{icon}</span>
          <span>{to}</span>
          <span data-check-to>
            <Check />
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- component

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

    const stage = q('[data-stage]');
    const panel = q('[data-panel]');
    const cursor = q('[data-cursor]');
    const pageFill = q('[data-page="fill"]');

    const pick = (name: string) => {
      const page = q(`[data-page="${name}"]`);
      return {
        page,
        row: q('[data-row]', page),
        from: q('[data-value-from]', page),
        to: q('[data-value-to]', page),
        menu: q('[data-menu]', page),
        highlight: q('[data-menu-highlight]', page),
        checkFrom: q('[data-check-from]', page),
        checkTo: q('[data-check-to]', page),
      };
    };
    const weight = pick('weight');
    const spacing = pick('spacing');

    const codeScroll = q('[data-code-scroll]');
    const rows = Array.from(canvas.querySelectorAll<HTMLElement>('[data-code-row]'));
    const rowIndex = (id: string) => CODE_ROWS.findIndex((row) => row.id === id);

    const panelTop = H - PANEL_VISIBLE;
    const rowCentre = panelTop + ROW_Y + ROW_HEIGHT / 2;
    const targetOption = panelTop + MENU_Y + MENU_HEAD + OPTION_HEIGHT * 1.5 - MENU_LIFT;

    /** Drives one Figma-style pick and returns how far the menu is open, and the cursor if it's up. */
    const runPick = (t: number, c: number, p: ReturnType<typeof pick>) => {
      const open = Math.min(ease(t, c + 0.95, c + 1.2), 1 - ease(t, c + PICK_CHANGE - 0.05, c + PICK_CHANGE + 0.15));
      p.menu.style.opacity = String(open);
      p.menu.style.transform = `translateY(${(1 - open) * -6}px)`;
      p.menu.style.visibility = open > 0 ? 'visible' : 'hidden';
      p.highlight.style.transform = `translateY(${inOut(seg(t, c + 1.4, c + 1.7)) * OPTION_HEIGHT}px)`;
      const chosen = t >= c + 2 ? 1 : 0;
      p.checkFrom.style.opacity = String(1 - chosen);
      p.checkTo.style.opacity = String(chosen);
      const changed = ease(t, c + PICK_CHANGE - 0.05, c + PICK_CHANGE + 0.15);
      p.from.style.opacity = String(1 - changed);
      p.to.style.opacity = String(changed);
      p.row.classList.toggle('is-active', t >= c + 0.85 && t < c + PICK_CHANGE);

      const shown = pulse(t, c, c + 0.3, c + 2.9, c + 3.2);
      const toRow = inOut(seg(t, c + 0.3, c + 0.8));
      const toOption = inOut(seg(t, c + 1.3, c + 1.8));
      const away = inOut(seg(t, c + 2.4, c + 3.2));
      const pressed = (t > c + 0.85 && t < c + 0.97) || (t > c + 2 && t < c + 2.12);
      return {
        open,
        shown,
        x: lerp(lerp(PANEL.x + PANEL.width + 40, PANEL.x + 120, toRow), PANEL.x + PANEL.width + 40, away),
        y: lerp(lerp(lerp(panelTop - 16, rowCentre, toRow), targetOption, toOption), panelTop - 16, away),
        pressed,
      };
    };

    const render = (t: number) => {
      stage.style.opacity = String(Math.min(ease(t, 0, 0.4), 1 - ease(t, LOOP - 0.5, LOOP)));

      // ---------------------------------------------------------- the checkbox on each side
      code.label.style.color = mixHex(INPUT_LABEL, TEXT_PRIMARY, ease(t, 2.6, 3.1));
      design.label.style.color = TEXT_PRIMARY;
      const weightChange = WEIGHT_PICK + PICK_CHANGE;
      design.label.style.webkitTextStroke = `${lerp(HEAVY_STROKE, 0, ease(t, weightChange, weightChange + 0.5))}px currentColor`;

      const spacingChange = SPACING_PICK + PICK_CHANGE;
      const gaps = {
        design: lerp(GAP.design, GAP.shared, inOut(seg(t, spacingChange, spacingChange + 0.5))),
        code: lerp(GAP.code, GAP.shared, inOut(seg(t, 12.5, 13))),
      };
      const bandAlpha = pulse(t, 8.6, 8.9, 13.5, 13.9);
      for (const [name, parts] of [['design', design], ['code', code]] as const) {
        parts.description.style.transform = `translateY(${gaps[name]}px)`;
        parts.band.style.height = `${gaps[name]}px`;
        parts.band.style.opacity = String(bandAlpha);
        parts.bandValue.textContent = String(Math.round(gaps[name]));
      }

      code.outline.style.opacity = String(pulse(t, 0.6, 0.9, 3.7, 4));
      design.outline.style.opacity = String(pulse(t, 4.5, 4.8, 7.8, 8.1));

      // ---------------------------------------------------------- design panel
      pageFill.style.opacity = String(1 - ease(t, 4.1, 4.4));
      weight.page.style.opacity = String(pulse(t, 4.4, 4.7, 8.1, 8.4));
      spacing.page.style.opacity = String(ease(t, 8.4, 8.7));
      weight.page.style.visibility = t > 4.3 && t < 8.5 ? 'visible' : 'hidden';
      spacing.page.style.visibility = t > 8.3 ? 'visible' : 'hidden';

      const a = runPick(t, WEIGHT_PICK, weight);
      const b = runPick(t, SPACING_PICK, spacing);
      panel.style.transform = `translateY(${-Math.max(a.open, b.open) * MENU_LIFT}px)`;
      const active = t < SPACING_PICK - 0.2 ? a : b;
      cursor.style.opacity = String(active.shown);
      cursor.style.transform = `translate(${active.x}px, ${active.y}px) scale(${active.pressed ? 0.86 : 1})`;

      // ---------------------------------------------------------- code panel
      const heights = CODE_ROWS.map(() => 1);
      const tints = CODE_ROWS.map(() => 0);
      const set = (id: string, height: number, tint: number) => {
        heights[rowIndex(id)] = height;
        tints[rowIndex(id)] = tint;
      };
      set('color-old', 1 - ease(t, 3.8, 4.2), pulse(t, 1.5, 1.9, 3.8, 4.2));
      set('color-new', ease(t, 2.1, 2.5), pulse(t, 2.1, 2.5, 3.8, 4.2));
      set('gap-old', 1 - ease(t, 13.7, 14.1), pulse(t, 11.6, 12, 13.7, 14.1));
      set('gap-new', ease(t, 12, 12.4), pulse(t, 12, 12.4, 13.7, 14.1));
      const weightFocus = pulse(t, 4.6, 4.9, 7.8, 8.1);

      let y = CODE_TOP;
      rows.forEach((row, i) => {
        const h = heights[i];
        row.style.transform = `translateY(${y}px)`;
        row.style.height = `${h * CODE_ROW}px`;
        row.style.opacity = String(Math.min(1, h * 1.4));
        row.style.visibility = h > 0 ? 'visible' : 'hidden';
        row.style.setProperty('--tint', String(CODE_ROWS[i].id === 'weight' ? weightFocus : tints[i]));
        y += h * CODE_ROW;
      });
      codeScroll.style.transform = `translateY(${lerp(0, -CODE_ROW * 2, inOut(seg(t, 8.4, 8.9)))}px)`;
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
      aria-label="Animation: a checkbox split between design and code. Its label colour, weight, and the spacing above its description differ between the two, and the tokens are changed one at a time until both sides match."
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
        <div className="token-drift-reel__stage" data-stage>
          <span className="token-drift-reel__side-name" style={{ left: 28 }}>
            Design
          </span>
          <span className="token-drift-reel__side-name" style={{ left: W / 2 + 28 }}>
            Code
          </span>

          <Checkbox side="design" />
          <Checkbox side="code" />

          <div
            className="token-drift-reel__panel"
            data-panel
            style={{ left: PANEL.x, top: H - PANEL_VISIBLE, width: PANEL.width }}
          >
            <div className="token-drift-reel__page" data-page="fill">
              <div className="token-drift-reel__panel-head">
                <span>Fill</span>
                <i>+</i>
              </div>
              <div className="token-drift-reel__row">
                <span className="token-drift-reel__icon">
                  <b className="token-drift-reel__swatch" />
                </span>
                <span>text-primary</span>
              </div>
            </div>
            <PickPage name="weight" title="Typography" icon={<span>Aa</span>} from="font-weight-heading" to="font-weight-component" />
            <PickPage
              name="spacing"
              title="Auto layout"
              icon={
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 2.5h12M2 13.5h12M8 5v6M6.2 6.6 8 4.8l1.8 1.8M6.2 9.4 8 11.2l1.8-1.8" />
                </svg>
              }
              from="spacing-xxs"
              to="spacing-s"
            />
          </div>

          <div className="token-drift-reel__code" style={{ top: H - PANEL_VISIBLE }}>
            <div data-code-scroll>
              {CODE_ROWS.map((row, i) => (
                <div
                  key={i}
                  className={`token-drift-reel__code-row${row.kind ? ` is-${row.kind}` : ''}${row.id === 'weight' ? ' is-focus' : ''}`}
                  data-code-row
                >
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

          <svg className="token-drift-reel__cursor" data-cursor viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M5.5 3.5 18 13.2l-5.4.7 2.8 6.2-2.4 1.1-2.9-6.3-4.1 3.8V3.5Z"
              fill="#111"
              stroke="#fff"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
