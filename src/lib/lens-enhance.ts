import type { LensOptions } from './project-lens';

/**
 * Progressive enhancement for the lens warp (src/lib/project-lens.ts).
 *
 * The page is complete without it. The lens loads only after the page has finished loading, only on
 * wider screens, and never for visitors who prefer reduced motion. Any failure (download, WebGL,
 * shader, runtime) is caught and leaves the plain HTML in place.
 *
 * Mark each image the lens may take over with `data-lens-src="<image url>"` (optionally a caption
 * inside the same parent with `data-lens-caption`), then call `enhanceWithLens(container)`.
 */
export function enhanceWithLens(container: HTMLElement | null, options?: LensOptions) {
  const wide = window.matchMedia('(min-width: 768px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  async function enhance() {
    if (!container || !wide.matches || reduceMotion.matches) return;
    try {
      const { startProjectLens } = await import('./project-lens');
      startProjectLens(container, options);
    } catch (error) {
      console.warn('Lens effect unavailable; showing the standard layout.', error);
    }
  }

  const whenIdle = (fn: () => void) =>
    'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200);

  if (document.readyState === 'complete') whenIdle(enhance);
  else window.addEventListener('load', () => whenIdle(enhance), { once: true });
}
