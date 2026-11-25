import type { LensOptions } from './project-lens';

/**
 * Progressive enhancement for the lens warp (src/lib/project-lens.ts).
 *
 * The page is complete without it. The lens loads only after the page has finished loading, only on
 * wider screens (stopping if the screen narrows), and never for visitors who prefer reduced motion.
 * Any failure (download, WebGL, shader, runtime) is caught and leaves the plain HTML in place.
 *
 * Mark each image the lens may take over with `data-lens-src="<image url>"` (optionally a caption
 * inside the same parent with `data-lens-caption`), then call `enhanceWithLens(container)`.
 */
export function enhanceWithLens(container: HTMLElement | null, options?: LensOptions) {
  const wide = window.matchMedia('(min-width: 768px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let stopLens: (() => void) | undefined;
  let ready = false;
  let attempt = 0;

  // Runs the lens only while the screen is wide and motion is allowed. Crossing below 768px (a
  // resized window, a rotated tablet) or turning on reduced motion stops it, which restores the
  // plain cards and full-opacity captions; going back starts a fresh one.
  async function update() {
    if (!container || !ready) return;
    const want = wide.matches && !reduceMotion.matches;
    if (!want) {
      attempt++;
      stopLens?.();
      stopLens = undefined;
      return;
    }
    if (stopLens) return;
    const current = ++attempt;
    try {
      const { startProjectLens } = await import('./project-lens');
      if (current !== attempt || stopLens) return; // the screen changed while it loaded
      stopLens = startProjectLens(container, options);
    } catch (error) {
      console.warn('Lens effect unavailable; showing the standard layout.', error);
    }
  }

  wide.addEventListener('change', update);
  reduceMotion.addEventListener('change', update);

  const whenIdle = (fn: () => void) =>
    'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200);
  const begin = () => {
    ready = true;
    void update();
  };

  if (document.readyState === 'complete') whenIdle(begin);
  else window.addEventListener('load', () => whenIdle(begin), { once: true });
}
