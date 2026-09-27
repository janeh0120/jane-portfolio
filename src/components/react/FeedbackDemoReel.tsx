import { useEffect, useRef, useState } from 'react';
import { attachDropdownHighlight } from '../../lib/dropdown';
import './FeedbackDemoReel.css';

const COMMENT = 'This is a really cool feature';
const CATEGORIES = [
  { id: '', label: 'Category' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'content', label: 'Content' },
  { id: 'visual-design', label: 'Visual design' },
  { id: 'bug', label: 'Bug' },
] as const;

/** The reel is laid out at this width, then scaled to fit its container. */
const DESIGN_WIDTH = 720;
const ASPECTS = { '16/9': 16 / 9, '16/10': 16 / 10 } as const;

type Aspect = keyof typeof ASPECTS;

type Step =
  | 'idle'
  | 'highlight'
  | 'popover'
  | 'typing'
  | 'category-open'
  | 'category-chosen'
  | 'done';

type Point = { x: number; y: number };

type Frame = {
  step: Step;
  typed: string;
  category: string;
  menuOpen: boolean;
  menuHover: string;
  sendHover: boolean;
  cursor: Point;
  crosshair: boolean;
  cursorHidden: boolean;
  clicking: boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function FeedbackDemoReel({ aspect = '16/9' }: { aspect?: Aspect }) {
  const designHeight = Math.round(DESIGN_WIDTH / ASPECTS[aspect]);
  const restPoint: Point = { x: DESIGN_WIDTH * 0.8, y: designHeight * 0.84 };
  const awayPoint: Point = { x: DESIGN_WIDTH * 0.94, y: designHeight * 0.96 };

  const idleFrame: Frame = {
    step: 'idle',
    typed: '',
    category: '',
    menuOpen: false,
    menuHover: '',
    sendHover: false,
    cursor: restPoint,
    crosshair: true,
    cursorHidden: false,
    clicking: false,
  };

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const textareaRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const scaleRef = useRef(1);

  const [frame, setFrameState] = useState<Frame>(idleFrame);
  const [scale, setScale] = useState(0);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const next = root.clientWidth / DESIGN_WIDTH;
      scaleRef.current = next || 1;
      setScale(next);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(root);

    const visibility = new IntersectionObserver(
      ([entry]) => setInView(entry.intersectionRatio >= 0.35),
      { threshold: [0, 0.35, 0.6] },
    );
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

  const playing = inView && pageVisible && !reducedMotion;

  useEffect(() => {
    if (reducedMotion) {
      setFrameState({
        ...idleFrame,
        step: 'category-chosen',
        typed: COMMENT,
        category: 'visual-design',
        cursorHidden: true,
      });
      return;
    }

    setFrameState(idleFrame);
    if (!playing) return;

    let cancelled = false;
    const set = (patch: Partial<Frame>) => {
      if (!cancelled) setFrameState((prev) => ({ ...prev, ...patch }));
    };

    const pointAt = (el: Element | null | undefined, fx: number, fy: number): Point | null => {
      const canvas = canvasRef.current;
      if (!el || !canvas) return null;
      const box = el.getBoundingClientRect();
      const origin = canvas.getBoundingClientRect();
      const s = scaleRef.current;
      return {
        x: (box.left - origin.left + box.width * fx) / s,
        y: (box.top - origin.top + box.height * fy) / s,
      };
    };

    const moveTo = (point: Point | null, crosshair: boolean) => {
      if (point) set({ cursor: point, crosshair });
    };

    const click = async () => {
      set({ clicking: true });
      await sleep(140);
      set({ clicking: false });
    };

    const run = async () => {
      while (!cancelled) {
        set(idleFrame);
        await sleep(700);
        if (cancelled) break;

        moveTo(pointAt(headingRef.current, 0.62, 0.55), true);
        await sleep(650);
        if (cancelled) break;

        await click();
        if (cancelled) break;
        set({ step: 'highlight' });
        await sleep(500);
        if (cancelled) break;

        set({ step: 'popover' });
        await sleep(400);
        if (cancelled) break;

        moveTo(pointAt(textareaRef.current, 0.55, 0.9), false);
        await sleep(350);
        if (cancelled) break;

        set({ step: 'typing' });
        for (let i = 1; i <= COMMENT.length; i++) {
          if (cancelled) return;
          set({ typed: COMMENT.slice(0, i) });
          await sleep(36);
        }
        await sleep(450);
        if (cancelled) break;

        moveTo(pointAt(categoryRef.current, 0.55, 0.6), false);
        await sleep(500);
        if (cancelled) break;

        await click();
        if (cancelled) break;
        set({ step: 'category-open', menuOpen: true, menuHover: '' });
        await sleep(400);
        if (cancelled) break;

        const option = menuRef.current?.querySelector('[data-option="visual-design"]');
        moveTo(pointAt(option, 0.45, 0.55), false);
        await sleep(350);
        if (cancelled) break;

        set({ menuHover: 'visual-design' });
        await sleep(500);
        if (cancelled) break;

        await click();
        if (cancelled) break;
        set({
          category: 'visual-design',
          menuOpen: false,
          menuHover: '',
          step: 'category-chosen',
        });
        await sleep(700);
        if (cancelled) break;

        moveTo(pointAt(sendRef.current, 0.5, 0.55), false);
        await sleep(450);
        if (cancelled) break;

        set({ sendHover: true });
        await sleep(300);
        if (cancelled) break;

        await click();
        if (cancelled) break;
        set({ step: 'done', sendHover: false });
        await sleep(900);
        if (cancelled) break;

        set({ cursor: awayPoint, cursorHidden: true });
        await sleep(400);
        if (cancelled) break;

        set({ step: 'idle', typed: '', category: '' });
        await sleep(500);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [playing, reducedMotion, aspect]);

  useEffect(() => {
    if (!frame.menuOpen || !menuRef.current) return;
    return attachDropdownHighlight(menuRef.current);
  }, [frame.menuOpen]);

  const { step, typed, category, menuOpen, menuHover, cursor } = frame;
  const showHighlight = step !== 'idle' && step !== 'done';
  const showPopover =
    step === 'popover' ||
    step === 'typing' ||
    step === 'category-open' ||
    step === 'category-chosen';
  const showCaret = !reducedMotion && (step === 'typing' || step === 'popover');

  return (
    <div
      ref={rootRef}
      className="feedback-demo-reel"
      data-aspect={aspect}
      data-ready={scale > 0 || undefined}
      style={{ backgroundImage: `url('/images/case-studies/feedback/blue-bg.jpg')` }}
      aria-hidden="true"
    >
      <div
        ref={canvasRef}
        className="feedback-demo-reel__canvas"
        style={{
          width: DESIGN_WIDTH,
          height: designHeight,
          transform: `scale(${scale || 1})`,
        }}
      >
        <div className="feedback-demo-reel__stage">
          <div className="feedback-demo-reel__target-wrap">
            {showHighlight && (
              <div className="comment-mode-highlight is-pinned feedback-demo-reel__highlight" />
            )}
            <p ref={headingRef} className="feedback-demo-reel__heading">
              Make inline comments on
              <br />
              my portfolio
            </p>
          </div>

          {showPopover && (
            <div className="comment-popover feedback-demo-reel__popover" data-comment-ui>
              <div className={`comment-popover-card${typed || category ? ' is-expanded' : ''}`}>
                <div className="comment-popover-body">
                  <div className="comment-popover-compose">
                    <div className="comment-popover-chips">
                      <button type="button" className="comment-popover-chip" tabIndex={-1}>
                        <span className="comment-popover-chip-icon" aria-hidden="true">
                          <span className="comment-popover-chip-target">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" />
                              <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
                            </svg>
                          </span>
                        </span>
                        <span className="comment-popover-chip-label">h1</span>
                      </button>
                    </div>
                    <div
                      ref={textareaRef}
                      className="feedback-demo-reel__textarea"
                      data-empty={typed ? undefined : true}
                      data-caret={showCaret || undefined}
                    >
                      {typed || 'Leave feedback…'}
                    </div>
                  </div>
                  <div className="comment-popover-footer">
                    <div className="comment-popover-footer-inner">
                      <div className="comment-popover-footer-row">
                        <div className="feedback-demo-reel__category">
                          <button
                            ref={categoryRef}
                            type="button"
                            className="comment-popover-category-select"
                            tabIndex={-1}
                            aria-expanded={menuOpen}
                            data-empty={category ? 'false' : 'true'}
                          >
                            {CATEGORIES.find((item) => item.id === category)?.label ?? 'Category'}
                          </button>
                          {menuOpen && (
                            <div ref={menuRef} className="dropdown-menu feedback-demo-reel__menu" role="listbox">
                              {CATEGORIES.map((item) => (
                                <div
                                  key={item.id || 'none'}
                                  role="option"
                                  data-option={item.id}
                                  aria-selected={item.id === category}
                                  className={`dropdown-option${
                                    item.id === menuHover || (!menuHover && !item.id) ? ' is-active' : ''
                                  }`}
                                >
                                  <span className="dropdown-check" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                  </span>
                                  <span>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    ref={sendRef}
                    type="button"
                    className={`icon-control is-primary inline-flex comment-popover-send${frame.sendHover ? ' is-hover' : ''}`}
                    tabIndex={-1}
                    aria-label="Post comment"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14m-7-7 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`feedback-demo-reel__cursor${frame.crosshair ? ' is-crosshair' : ''}${frame.clicking ? ' is-clicking' : ''}${frame.cursorHidden ? ' is-away' : ''}`}
          style={{ left: cursor.x, top: cursor.y }}
        >
          {frame.crosshair ? (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M12 3v18M3 12h18" stroke="#fff" strokeWidth="3.5" strokeLinecap="square" />
              <path d="M12 3v18M3 12h18" stroke="#111" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                d="M5.5 3.5 18 13.2l-5.4.7 2.8 6.2-2.4 1.1-2.9-6.3-4.1 3.8V3.5Z"
                fill="#111"
                stroke="#fff"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      <span className="sr-only">Animated demo of inline comments on the portfolio</span>
    </div>
  );
}
