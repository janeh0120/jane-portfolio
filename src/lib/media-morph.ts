/**
 * Grows an image out of its spot on the page into the media overlay (Play, About), and shrinks it
 * back on close, while the overlay's backdrop fades in or out behind it. A copy of the image does the
 * flying because the carousel clips its slides.
 *
 * Skipped (the overlay just appears) for reduced motion, sources that are off screen, video
 * previews, or overlay media that isn't ready in time.
 */

const MORPH_MS = 460;
const MORPH_EASE = 'cubic-bezier(0.3, 0.7, 0.2, 1)';

type Rect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height' | 'bottom'>;

export type MediaMorph = {
  /** Call right after the overlay is shown (has `.active`), with the clicked image and the overlay's media. */
  open(source: HTMLImageElement | null | undefined, target: HTMLElement | null | undefined): Promise<void>;
  /** Call before hiding the overlay. Resolves once the image is back in place. */
  close(source: HTMLImageElement | null | undefined, target: HTMLElement | null | undefined): Promise<void>;
  /** True while an image is in flight; ignore close and keyboard input until it lands. */
  readonly busy: boolean;
};

export function createMediaMorph(modal: HTMLElement): MediaMorph {
  const content = modal.querySelector<HTMLElement>('.gallery-modal-content');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let busy = false;

  // Resolves true once the overlay media has a size to fly to, false if it isn't ready in time.
  function mediaReady(media: HTMLElement): Promise<boolean> {
    const img = media instanceof HTMLImageElement ? media : media.querySelector('img');
    const video = media instanceof HTMLVideoElement ? media : null;
    const loaded = img
      ? img.complete && img.naturalWidth
        ? Promise.resolve()
        : img.decode()
      : new Promise<void>((resolve) => {
          if (!video || video.readyState >= 1) resolve();
          else video.addEventListener('loadedmetadata', () => resolve(), { once: true });
        });
    const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 400));
    return Promise.race([loaded.then(() => true, () => false), timeout]);
  }

  const onScreen = (rect: Rect) => rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight;

  // The source's visible corner: its own, or the tile that clips it.
  function cornerOf(source: HTMLElement) {
    const own = getComputedStyle(source).borderRadius;
    if (own && own !== '0px') return own;
    return source.parentElement ? getComputedStyle(source.parentElement).borderRadius : '0px';
  }

  async function fly(image: HTMLImageElement, from: Rect, to: Rect, radii: [string, string]) {
    const flyer = image.cloneNode(false) as HTMLImageElement;
    flyer.removeAttribute('loading');
    flyer.removeAttribute('style');
    flyer.className = 'gallery-flyer';
    document.body.appendChild(flyer);
    const frame = (rect: Rect, radius: string) => ({
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      borderRadius: radius,
    });
    await flyer.animate([frame(from, radii[0]), frame(to, radii[1])], {
      duration: MORPH_MS,
      easing: MORPH_EASE,
      fill: 'forwards',
    }).finished;
    return flyer;
  }

  // The backdrop is the overlay's ::before (the page colour, slightly see-through); fading it keeps
  // the colour right in both colour modes.
  function fadeBackdrop(from: number, to: number) {
    return modal.animate([{ opacity: from }, { opacity: to }], {
      duration: MORPH_MS,
      easing: MORPH_EASE,
      fill: 'both',
      pseudoElement: '::before',
    });
  }

  async function open(source: HTMLImageElement | null | undefined, target: HTMLElement | null | undefined) {
    if (reduceMotion.matches || busy || !content || !source || !target) return;
    if (!onScreen(source.getBoundingClientRect())) return;

    busy = true;
    modal.classList.add('is-morphing');
    if (!(await mediaReady(target)) || !modal.classList.contains('active')) {
      modal.classList.remove('is-morphing');
      busy = false;
      return;
    }

    target.style.opacity = '0';
    source.style.visibility = 'hidden';
    const backdrop = fadeBackdrop(0, 1);
    const reveal = content.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: MORPH_MS * 0.6,
      delay: MORPH_MS * 0.4,
      easing: 'ease-out',
      fill: 'both',
    });
    const flyer = await fly(source, source.getBoundingClientRect(), target.getBoundingClientRect(), [
      cornerOf(source),
      getComputedStyle(target).borderRadius,
    ]);

    target.style.opacity = '';
    source.style.visibility = '';
    modal.classList.remove('is-morphing');
    backdrop.cancel();
    reveal.cancel();
    flyer.remove();
    busy = false;
  }

  async function close(source: HTMLImageElement | null | undefined, target: HTMLElement | null | undefined) {
    if (reduceMotion.matches || busy || !content || !source || !target) return;
    const home = source.getBoundingClientRect();
    if (!onScreen(home)) return;

    busy = true;
    const from = target.getBoundingClientRect();
    target.style.opacity = '0';
    source.style.visibility = 'hidden';
    modal.classList.add('is-morphing');
    const backdrop = fadeBackdrop(1, 0);
    const hide = content.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: MORPH_MS * 0.4,
      easing: 'ease-out',
      fill: 'both',
    });
    const flyer = await fly(source, from, home, [getComputedStyle(target).borderRadius, cornerOf(source)]);

    source.style.visibility = '';
    flyer.remove();
    target.style.opacity = '';
    backdrop.cancel();
    hide.cancel();
    modal.classList.remove('is-morphing');
    busy = false;
  }

  return {
    open,
    close,
    get busy() {
      return busy;
    },
  };
}
