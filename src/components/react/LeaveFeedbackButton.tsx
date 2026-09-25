import { useEffect, useState, type MouseEventHandler } from 'react';
import SpecularButton from './SpecularButton';

type Theme = 'light' | 'dark';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  if (document.documentElement.classList.contains('theme-dark')) return 'dark';
  if (document.documentElement.dataset.theme === 'dark') return 'dark';
  if (document.documentElement.dataset.theme === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const themeProps = {
  light: {
    tint: '#f5f5f5',
    tintOpacity: 1,
    textColor: '#555555',
    lineColor: '#111111',
    baseColor: '#e8e8e8',
  },
  dark: {
    tint: '#262626',
    tintOpacity: 1,
    textColor: '#a8a8a8',
    lineColor: '#f3f3f3',
    baseColor: '#3a3a3a',
  },
} as const;

export type LeaveFeedbackButtonProps = {
  id?: string;
  className?: string;
  /** When true, clicking only opens comment mode if it is not already open. */
  openOnly?: boolean;
};

export default function LeaveFeedbackButton({
  id,
  className = '',
  openOnly = false,
}: LeaveFeedbackButtonProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [inCommentMode, setInCommentMode] = useState(false);

  useEffect(() => {
    const syncTheme = () => setTheme(readTheme());
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
    if (openOnly && document.body.classList.contains('comment-view-comment')) return;
    document.dispatchEvent(new CustomEvent('portfolio:leave-feedback'));
  };

  const colors = themeProps[theme];

  return (
    <span
      className="leave-feedback-wrap"
      hidden={inCommentMode}
      aria-hidden={inCommentMode}
      style={inCommentMode ? { display: 'none' } : undefined}
    >
      <SpecularButton
        id={id}
        className={className}
        size="sm"
        radius={8}
        tint={colors.tint}
        tintOpacity={colors.tintOpacity}
        blur={0}
        textColor={colors.textColor}
        lineColor={colors.lineColor}
        baseColor={colors.baseColor}
        intensity={1}
        shineSize={10}
        shineFade={40}
        thickness={1}
        speed={0.35}
        followMouse
        proximity={250}
        autoAnimate={false}
        aria-pressed={inCommentMode}
        onClick={onClick}
      >
        Leave feedback
      </SpecularButton>
    </span>
  );
}
