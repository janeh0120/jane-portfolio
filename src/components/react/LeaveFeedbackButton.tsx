import { useEffect, useState, type MouseEventHandler } from 'react';
import SpecularButton from './SpecularButton';

// The primary button is the accent colour with on-accent text. The fill and text use the CSS
// tokens directly; the WebGL shine needs a real colour value, so it reads --color-accent once the
// page has loaded (and again if the colour mode changes). Until then, this mirrors it.
const ACCENT_FALLBACK = '#246cff';

function readAccent() {
  if (typeof document === 'undefined') return ACCENT_FALLBACK;
  return getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || ACCENT_FALLBACK;
}

export type LeaveFeedbackButtonProps = {
  id?: string;
  className?: string;
  /**
   * Hide this control while comment mode is open (nav only).
   * Other instances stay visible, keep the “Leave feedback” label, and disable.
   */
  hideInCommentMode?: boolean;
  /** Pin a state for the design system page. */
  previewState?: 'hover' | 'active' | 'focus' | 'disabled';
};

export default function LeaveFeedbackButton({
  id,
  className = '',
  hideInCommentMode = false,
  previewState,
}: LeaveFeedbackButtonProps) {
  const [accent, setAccent] = useState(ACCENT_FALLBACK);
  const [inCommentMode, setInCommentMode] = useState(false);

  useEffect(() => {
    const syncTheme = () => setAccent(readAccent());
    const syncMode = () => {
      setInCommentMode(document.body.classList.contains('comment-view-comment'));
    };
    syncTheme();
    syncMode();

    const onMode = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: string }>).detail;
      if (detail?.mode === 'comment' || detail?.mode === 'view') {
        setInCommentMode(detail.mode === 'comment');
        return;
      }
      syncMode();
    };

    const rootObserver = new MutationObserver(() => {
      syncTheme();
      syncMode();
    });
    rootObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    rootObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    document.addEventListener('portfolio:comment-mode', onMode);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', syncTheme);

    return () => {
      rootObserver.disconnect();
      document.removeEventListener('portfolio:comment-mode', onMode);
      media.removeEventListener('change', syncTheme);
    };
  }, []);

  const onClick: MouseEventHandler<HTMLButtonElement> = () => {
    if (document.body.classList.contains('comment-view-comment')) return;
    document.dispatchEvent(new CustomEvent('portfolio:leave-feedback'));
  };

  const hidden = hideInCommentMode && inCommentMode;
  const disabled = previewState === 'disabled' || (!hideInCommentMode && inCommentMode);
  const stateClass =
    previewState === 'active' ? 'is-pressed' : previewState === 'focus' ? 'is-focus' : '';

  if (hidden) return null;

  return (
    <SpecularButton
      id={id}
      className={[className, stateClass].filter(Boolean).join(' ')}
      size="sm"
      radius="var(--radius-base)"
      tint="var(--color-accent)"
      tintOpacity={1}
      blur={0}
      textColor="var(--color-on-accent)"
      lineColor={accent}
      baseColor={accent}
      intensity={1}
      shineSize={10}
      shineFade={40}
      thickness={1}
      speed={0.35}
      followMouse
      proximity={250}
      // Always on: an accent glow circles the edge and turns toward a nearby pointer
      autoAnimate={!disabled}
      glow={!disabled}
      disabled={disabled}
      aria-pressed={inCommentMode}
      onClick={onClick}
    >
      Leave feedback
    </SpecularButton>
  );
}
