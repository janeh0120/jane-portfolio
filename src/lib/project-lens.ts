/**
 * Lens warp for the homepage project column.
 *
 * Project images are drawn into an offscreen WebGL target at their live positions, then one fixed,
 * screen-space lens pass runs over it: in zones at the top and bottom of the viewport the image is
 * magnified outward (fisheye) inside an hourglass-shaped lens and split into RGB fringes. The middle of
 * the screen is untouched — cards there stay the real HTML (crisp, clickable, live demo) — and a card
 * only hands over to WebGL inside a lens zone, where the lens is still neutral at the boundary.
 *
 * Fail-safe by design: the HTML column is always complete on its own. An image is only hidden after
 * WebGL has successfully drawn it in the same frame, and any failure (no WebGL, shader/link error,
 * runtime error, context loss, texture load error) tears the lens down and restores the plain column.
 */
import { Renderer, Program, Mesh, Geometry, Texture, Transform, RenderTarget, Triangle } from 'ogl';

/** Fraction of the viewport height covered by each lens zone. */
const ZONE = 0.24;
/** Cap on offscreen buffer size (device pixels) so huge displays don't use excessive GPU memory. */
const MAX_BUFFER_PIXELS = 3_600_000;

const cardVertex = /* glsl */ `
  attribute vec2 position;
  uniform vec2 uCenter;     // CSS px
  uniform vec2 uSize;       // CSS px
  uniform vec2 uViewport;   // CSS px
  varying vec2 vLocal;
  void main() {
    vLocal = position * uSize;
    vec2 clip = ((uCenter + vLocal) / uViewport) * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  }
`;

const cardFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uSize;
  uniform vec2 uImageSize;
  uniform float uRadius;
  varying vec2 vLocal;
  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  void main() {
    vec2 uv = vLocal / uSize + 0.5;
    // object-fit: cover
    float ca = uSize.x / uSize.y, ia = uImageSize.x / uImageSize.y;
    vec2 scale = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
    uv = (uv - 0.5) * scale + 0.5;
    float mask = 1.0 - smoothstep(-0.75, 0.75, roundedBox(vLocal, uSize * 0.5, uRadius));
    vec4 color = texture2D(uTexture, vec2(uv.x, 1.0 - uv.y));
    gl_FragColor = vec4(color.rgb * mask, mask); // premultiplied
  }
`;

const lensVertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const lensFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uScene;
  uniform vec2 uViewport;   // CSS px
  uniform float uCenterX;   // lens axis, CSS px (the column's centre)
  uniform float uHalfWidth; // half the column width, CSS px
  uniform float uZone;      // zone height as a fraction of the viewport
  uniform vec3 uPage;       // page background colour (0..1), for compositing split channels
  varying vec2 vUv;

  vec4 scene(vec2 px) {
    vec2 uv = px / uViewport;
    return texture2D(uScene, vec2(uv.x, 1.0 - uv.y));
  }

  void main() {
    vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uViewport;     // CSS px, y down
    float edgeDist = min(px.y, uViewport.y - px.y) / uViewport.y;
    float e = 1.0 - smoothstep(0.0, uZone, edgeDist);   // 0 in the middle, 1 at the screen edge
    float e2 = e * e;

    // Fisheye: magnify horizontally around the column axis, more toward the edge.
    float dx = px.x - uCenterX;
    float k = 1.0 + 0.9 * e2;
    // Chromatic dispersion: each channel is magnified by a slightly different amount.
    float spread = 0.16 * e2;
    vec4 r = scene(vec2(uCenterX + dx / (k * (1.0 + spread)), px.y));
    vec4 g = scene(vec2(uCenterX + dx / k, px.y));
    vec4 b = scene(vec2(uCenterX + dx / (k * (1.0 - spread)), px.y));

    // Hourglass lens: content is contained inside a shape that flares outward toward the screen edge.
    float lensHalf = uHalfWidth * (1.0 + 0.55 * e2);
    float inLens = mix(1.0, 1.0 - smoothstep(lensHalf - 0.75, lensHalf + 0.75, abs(dx)), step(0.001, e));
    vec3 cover = vec3(r.a, g.a, b.a) * inLens;   // per-channel coverage
    vec3 color = vec3(r.r, g.g, b.b) * inLens;   // premultiplied per channel
    float alpha = max(max(cover.r, cover.g), cover.b);

    // Where channels separate, an uncovered channel shows the page behind it rather than black.
    gl_FragColor = vec4(color + uPage * (alpha - cover), alpha);
  }
`;

type Card = {
  media: HTMLElement;
  caption: HTMLElement | null;
  mesh: Mesh;
  program: Program;
  ready: boolean;
};

function assertLinked(gl: WebGLRenderingContext, program: Program, name: string) {
  const handle = (program as unknown as { program: WebGLProgram }).program;
  if (!handle || !gl.getProgramParameter(handle, gl.LINK_STATUS)) {
    throw new Error(`Lens shader failed to compile/link (${name})`);
  }
}

/**
 * Starts the lens over the given column. Throws if WebGL or the shaders are unavailable, in which
 * case nothing on the page has been changed. Returns a function that removes the lens.
 */
export function startProjectLens(column: HTMLElement): () => void {
  const cards: Card[] = [];
  let canvas: HTMLCanvasElement | undefined;
  let gl: WebGLRenderingContext | undefined;
  let probe: HTMLSpanElement | undefined;
  let frame = 0;
  let stopped = false;
  let visible = true;
  const listeners: Array<() => void> = [];

  // Restores the plain HTML column. Safe to call more than once, from anywhere.
  function stop() {
    if (stopped) return;
    stopped = true;
    if (frame) cancelAnimationFrame(frame);
    listeners.forEach((off) => off());
    for (const card of cards) {
      card.media.style.opacity = '';
      if (card.caption) card.caption.style.opacity = '';
    }
    probe?.remove();
    canvas?.remove();
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }

  try {
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: false, dpr: 1 });
    gl = renderer.gl as WebGLRenderingContext;
    if (!gl || typeof gl.getParameter !== 'function') throw new Error('WebGL unavailable');
    const ctx = gl;
    ctx.clearColor(0, 0, 0, 0);
    canvas = ctx.canvas as HTMLCanvasElement;
    canvas.setAttribute('aria-hidden', 'true');
    // The page scrolls inside #site-canvas (which shrinks beside the comments sidebar in comment
    // mode). Stick the lens to that container's visible area, so it matches its width and rounded
    // corners and never covers the sidebar. Without it, fall back to covering the viewport.
    const host = document.getElementById('site-canvas');
    Object.assign(
      canvas.style,
      host
        ? // height 0 until the first frame sizes it, so the canvas never pushes the page down
          { position: 'sticky', top: '0', display: 'block', width: '100%', height: '0px', marginBottom: '0px', pointerEvents: 'none', zIndex: '5' }
        : { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '5' },
    );

    const quad = new Geometry(ctx, {
      position: { size: 2, data: new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]) },
      index: { data: new Uint16Array([0, 1, 2, 2, 1, 3]) },
    });
    const cardsScene = new Transform();
    let target = new RenderTarget(ctx, { width: 1, height: 1 });
    const radius = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--radius-card')) * 16 || 8;

    const lensProgram = new Program(ctx, {
      vertex: lensVertex,
      fragment: lensFragment,
      transparent: true,
      depthTest: false,
      uniforms: {
        uScene: { value: target.texture },
        uViewport: { value: [1, 1] },
        uCenterX: { value: 0 },
        uHalfWidth: { value: 1 },
        uZone: { value: ZONE },
        uPage: { value: [0.94, 0.94, 0.945] },
      },
    });
    assertLinked(ctx, lensProgram, 'lens');
    lensProgram.setBlendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
    const lens = new Mesh(ctx, { geometry: new Triangle(ctx), program: lensProgram });

    for (const media of column.querySelectorAll<HTMLElement>('[data-lens-src]')) {
      const texture = new Texture(ctx, { generateMipmaps: false });
      const program = new Program(ctx, {
        vertex: cardVertex,
        fragment: cardFragment,
        transparent: true,
        depthTest: false,
        cullFace: false, // y is flipped into clip space, which reverses winding
        uniforms: {
          uTexture: { value: texture },
          uCenter: { value: [0, 0] },
          uSize: { value: [1, 1] },
          uViewport: { value: [1, 1] },
          uImageSize: { value: [1, 1] },
          uRadius: { value: radius },
        },
      });
      assertLinked(ctx, program, 'card');
      program.setBlendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
      const mesh = new Mesh(ctx, { geometry: quad, program });
      mesh.setParent(cardsScene);
      const card: Card = {
        media,
        caption: media.parentElement?.querySelector<HTMLElement>('[data-lens-caption]') ?? null,
        mesh,
        program,
        ready: false,
      };
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        if (stopped) return;
        texture.image = image;
        program.uniforms.uImageSize.value = [image.naturalWidth, image.naturalHeight];
        card.ready = true; // a card that never loads simply stays plain HTML
        requestRender();
      };
      image.src = media.dataset.lensSrc!;
      cards.push(card);
    }

    // The page background as 0..1 RGB (resolved from --color-page, so it follows dark mode)
    probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;color:var(--color-page)';
    document.body.appendChild(probe);
    const pageColor = () => {
      const [r, g, b] = (getComputedStyle(probe!).color.match(/[\d.]+/g) ?? ['240', '240', '241']).map(Number);
      return [r / 255, g / 255, b / 255];
    };

    let bufferKey = '';
    function render() {
      frame = 0;
      if (stopped) return;
      try {
        // Visible area the lens covers, and its top-left corner in viewport coordinates
        let w = window.innerWidth;
        let h = window.innerHeight;
        let ox = 0;
        let oy = 0;
        if (host) {
          const box = host.getBoundingClientRect();
          w = host.clientWidth;
          h = host.clientHeight;
          ox = box.left + host.clientLeft;
          oy = box.top + host.clientTop;
          // sticky to the top of the scroll area without taking up space in the page flow
          canvas!.style.height = `${h}px`;
          canvas!.style.marginBottom = `-${h}px`;
        }
        const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(MAX_BUFFER_PIXELS / (w * h)));
        renderer.dpr = dpr;
        renderer.setSize(w, h);
        const key = `${w}x${h}@${dpr}`;
        if (key !== bufferKey) {
          bufferKey = key;
          target = new RenderTarget(ctx, { width: Math.round(w * dpr), height: Math.round(h * dpr) });
          lensProgram.uniforms.uScene.value = target.texture;
        }

        const zonePx = h * ZONE;
        const handover: Card[] = [];
        for (const card of cards) {
          const r = card.media.getBoundingClientRect();
          const rect = { left: r.left - ox, top: r.top - oy, bottom: r.bottom - oy, width: r.width, height: r.height };
          const inZone = rect.top < zonePx || rect.bottom > h - zonePx;
          const onScreen = rect.bottom > 0 && rect.top < h;
          const drawGl = visible && card.ready && inZone && onScreen;
          card.mesh.visible = drawGl;
          if (drawGl) {
            const u = card.program.uniforms;
            u.uCenter.value = [rect.left + rect.width / 2, rect.top + rect.height / 2];
            u.uSize.value = [card.media.offsetWidth, card.media.offsetHeight];
            u.uViewport.value = [w, h];
            handover.push(card);
          }
          // Captions fade out as they reach a lens zone (images are what pass through the lens)
          if (card.caption) {
            const c = card.caption.getBoundingClientRect();
            const edge = Math.min(c.top - oy, h - (c.bottom - oy));
            card.caption.style.opacity = visible ? String(Math.max(0, Math.min(1, edge / zonePx))) : '';
          }
        }

        const col = column.getBoundingClientRect();
        lensProgram.uniforms.uViewport.value = [w, h];
        lensProgram.uniforms.uCenterX.value = col.left - ox + col.width / 2;
        lensProgram.uniforms.uHalfWidth.value = col.width / 2;
        lensProgram.uniforms.uPage.value = pageColor();

        renderer.render({ scene: cardsScene, target, clear: true });
        renderer.render({ scene: lens, clear: true });
        if (ctx.isContextLost()) throw new Error('WebGL context lost');

        // Only hide an HTML image once WebGL has drawn it this frame.
        for (const card of cards) card.media.style.opacity = handover.includes(card) ? '0' : '';
      } catch (error) {
        console.warn('Lens effect stopped; showing the standard layout.', error);
        stop();
      }
    }
    function requestRender() {
      if (!frame && !stopped) frame = requestAnimationFrame(render);
    }

    const on = (target: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions) => {
      target.addEventListener(type, fn, opts);
      listeners.push(() => target.removeEventListener(type, fn, opts));
    };
    const scroller = document.getElementById('site-canvas') ?? window;
    on(scroller, 'scroll', requestRender, { passive: true });
    on(window, 'scroll', requestRender, { passive: true });
    on(window, 'resize', requestRender);
    // Comment mode resizes the page area without resizing the window
    if (host && 'ResizeObserver' in window) {
      const ro = new ResizeObserver(() => requestRender());
      ro.observe(host);
      listeners.push(() => ro.disconnect());
    }
    on(canvas, 'webglcontextlost', (event) => {
      event.preventDefault();
      stop();
    });

    // Pause entirely (and show plain HTML) while the column is off screen.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      canvas!.style.display = visible ? 'block' : 'none';
      requestRender();
    });
    io.observe(column);
    listeners.push(() => io.disconnect());

    // First child of the scroll area (so it can stick to its top), in the same stacking context as
    // the nav (z-index 50) and footer so both stay above the lens.
    if (host) host.prepend(canvas);
    else document.body.appendChild(canvas);
    requestRender();
  } catch (error) {
    stop();
    throw error;
  }

  return stop;
}
