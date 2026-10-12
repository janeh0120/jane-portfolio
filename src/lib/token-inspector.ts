/**
 * Inspect mode for /design-system: like Figma's dev mode, hovering (or tapping) a component in a
 * specimen shows its box, shades its padding, and lists which design tokens it's built from.
 *
 * Tokens are found by resolving every token in global.css (the names are passed in) and matching
 * them against the element's computed styles, so the breakdown always reflects the real CSS. A value
 * with no matching token is flagged.
 */

export type InspectorOptions = {
  /** Containers whose contents are specimens (made non-interactive and inspectable). */
  specimens: HTMLElement[];
  /** Token names from global.css, e.g. `--color-ink`, `--space-3`. */
  tokens: string[];
  /** Component roots to inspect, with a display name. `exempt` explains a deliberate exception. */
  parts: { selector: string; name: string; exempt?: string }[];
};

type Row = { label: string; token: string | null; value: string };

export function startTokenInspector({ specimens, tokens, parts }: InspectorOptions) {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;';
  document.body.appendChild(probe);

  // Token name → resolved value, per kind (re-read each time so it follows the colour mode)
  function resolve(prefix: string, prop: string, read: (cs: CSSStyleDeclaration) => string) {
    const map: [string, string][] = [];
    for (const name of tokens.filter((t) => t.startsWith(prefix))) {
      probe.style.setProperty(prop, `var(${name})`);
      map.push([name, read(getComputedStyle(probe))]);
      probe.style.removeProperty(prop);
    }
    return map;
  }

  // Colours can be reported in different formats for the same colour (rgb() vs color(srgb …)),
  // so they're compared as the pixel they paint
  const swatch = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  function paint(value: string) {
    if (!swatch || !CSS.supports('color', value)) return value;
    swatch.clearRect(0, 0, 1, 1);
    swatch.fillStyle = value;
    swatch.fillRect(0, 0, 1, 1);
    return swatch.getImageData(0, 0, 1, 1).data.join(',');
  }

  // Tokens that only rename another (same value by definition) are skipped when naming a match
  const ALIASES = new Set(['--color-link', '--space-inset', '--bar-inset']);

  // Every token with this value, in global.css order; two different roles that happen to share a
  // value (canvas and on-accent are both white in light mode) are both named
  function match(map: [string, string][], value: string) {
    const target = paint(value);
    const names = map.filter(([name, v]) => !ALIASES.has(name) && paint(v) === target).map(([name]) => name);
    return names.length ? names.join(' / ') : null;
  }

  const px = (v: string) => Math.round(parseFloat(v) * 100) / 100;

  function describe(el: HTMLElement): { name: string; rows: Row[]; exempt?: string } {
    const cs = getComputedStyle(el);
    const colors = resolve('--color-', 'background-color', (c) => c.backgroundColor);
    const spaces = resolve('--space-', 'padding-top', (c) => c.paddingTop);
    const radii = resolve('--radius-', 'border-top-left-radius', (c) => c.borderTopLeftRadius);
    const shadows = resolve('--shadow-', 'box-shadow', (c) => c.boxShadow);
    const rows: Row[] = [];
    const transparent = (v: string) => v === 'rgba(0, 0, 0, 0)' || v === 'transparent';

    if (!transparent(cs.backgroundColor)) {
      rows.push({ label: 'Fill', token: match(colors, cs.backgroundColor), value: cs.backgroundColor });
    }
    // Text and icon colours are matched by resolving colour tokens as text colours
    const textColors = () => resolve('--color-', 'color', (c) => c.color);
    if (el.textContent?.trim()) {
      rows.push({ label: 'Text', token: match(textColors(), cs.color), value: cs.color });
      rows.push(typeRow(cs));
    } else if (el.querySelector('svg')) {
      rows.push({ label: 'Icon', token: match(textColors(), cs.color), value: cs.color });
    }
    const borderWidth = parseFloat(cs.borderTopWidth);
    if (borderWidth > 0 && cs.borderTopStyle !== 'none' && !transparent(cs.borderTopColor)) {
      const borderColors = resolve('--color-', 'border-top-color', (c) => c.borderTopColor);
      rows.push({
        label: 'Border',
        token: match(borderColors, cs.borderTopColor),
        value: `${px(cs.borderTopWidth)}px ${cs.borderTopColor}`,
      });
    }

    const padding = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft];
    if (padding.some((p) => parseFloat(p) > 0)) {
      const unique = [...new Set(padding)];
      const tokensFor = unique.map((p) => (parseFloat(p) === 0 ? '0' : match(spaces, p)));
      rows.push({
        label: 'Padding',
        token: tokensFor.includes(null) ? null : tokensFor.join(' · '),
        value: padding.map(px).join(' ') + ' px',
      });
    }
    if ((cs.display.includes('flex') || cs.display.includes('grid')) && parseFloat(cs.columnGap) > 0) {
      rows.push({ label: 'Gap', token: match(spaces, cs.columnGap), value: cs.columnGap });
    }
    // One radius, or (when the corners differ) the main one plus the corners that break from it
    const corners = [
      ['top left', cs.borderTopLeftRadius],
      ['top right', cs.borderTopRightRadius],
      ['bottom right', cs.borderBottomRightRadius],
      ['bottom left', cs.borderBottomLeftRadius],
    ] as const;
    const main = corners.map(([, v]) => v).sort((a, b) => parseFloat(b) - parseFloat(a))[0];
    if (parseFloat(main) > 0) {
      const odd = corners.filter(([, v]) => v !== main);
      const mainToken = match(radii, main);
      const oddTokens = odd.map(([corner, v]) => [corner, match(radii, v)] as const);
      const token = mainToken && oddTokens.every(([, t]) => t)
        ? [mainToken, ...oddTokens.map(([corner, t]) => `${corner} ${t}`)].join(', ')
        : null;
      const value = [main, ...odd.map(([corner, v]) => `${corner} ${v}`)].join(', ');
      rows.push({ label: 'Radius', token, value });
    }
    if (cs.boxShadow && cs.boxShadow !== 'none') {
      rows.push({ label: 'Shadow', token: match(shadows, cs.boxShadow), value: 'shadow' });
    }
    const box = el.getBoundingClientRect();
    rows.push({ label: 'Size', token: '', value: `${Math.round(box.width)} × ${Math.round(box.height)}` });

    const part = parts.find((p) => el.matches(p.selector));
    const variants = [...el.classList].filter((c) => c.startsWith('is-') && !/is-(hover|pressed|focus|active)$/.test(c));
    const base = part?.name ?? el.tagName.toLowerCase();
    // Variants the name already says (Secondary button) aren't repeated
    const extra = variants.map((v) => v.slice(3)).filter((v) => !base.toLowerCase().includes(v));
    const name = [base, ...extra].join(' · ');
    return { name, rows, exempt: part?.exempt };
  }

  // Type is matched like everything else: resolve each --type-* token and compare size, line
  // height, and weight
  function typeRow(cs: CSSStyleDeclaration): Row {
    const key = (c: CSSStyleDeclaration) => `${c.fontSize}/${c.lineHeight}/${c.fontWeight}`;
    const types = resolve('--type-', 'font', key);
    return { label: 'Type', token: match(types, key(cs)), value: `${px(cs.fontSize)}px / ${cs.lineHeight} / ${cs.fontWeight}` };
  }

  // Overlay pieces, styled like Figma's dev mode: a selection outline, red padding measurements
  // with value badges, and a callout card joined to the element by a dotted leader and a pin.
  const layer = document.createElement('div');
  layer.className = 'inspect-overlay';
  layer.setAttribute('aria-hidden', 'true');
  const box = document.createElement('div');
  box.className = 'inspect-box';
  const measures = ['top', 'right', 'bottom', 'left'].map((side) => {
    const line = document.createElement('div');
    line.className = 'inspect-measure';
    line.dataset.side = side;
    const badge = document.createElement('span');
    badge.className = 'inspect-badge';
    layer.append(line, badge);
    return { side, line, badge };
  });
  const leader = document.createElement('div');
  leader.className = 'inspect-leader';
  const pin = document.createElement('span');
  pin.className = 'inspect-pin';
  layer.append(box, leader, pin);
  const panel = document.createElement('div');
  panel.className = 'inspect-panel';
  panel.setAttribute('role', 'status');
  document.body.append(layer, panel);

  function hide() {
    layer.hidden = true;
    panel.hidden = true;
  }
  hide();

  const place = (el: HTMLElement, rect: { left: number; top: number; width: number; height: number }) =>
    Object.assign(el.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });

  function show(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const midX = r.left + r.width / 2;
    const midY = r.top + r.height / 2;
    layer.hidden = false;
    place(box, r);

    // The callout card
    const { name, rows, exempt } = describe(el);
    panel.replaceChildren();
    const title = document.createElement('p');
    title.className = 'inspect-panel-title';
    title.textContent = name;
    panel.appendChild(title);
    const list = document.createElement('dl');
    for (const row of rows) {
      const dt = document.createElement('dt');
      dt.textContent = row.label;
      const dd = document.createElement('dd');
      if (row.label === 'Fill' || row.label === 'Border') {
        const swatch = document.createElement('span');
        swatch.className = 'inspect-swatch';
        swatch.style.background = row.label === 'Fill' ? cs.backgroundColor : cs.borderTopColor;
        dd.appendChild(swatch);
      }
      const text = document.createElement('span');
      if (row.token === null) {
        // A deliberate exception is shown plainly; anything else is flagged
        if (!exempt) dd.classList.add('is-untokened');
        text.textContent = exempt ? row.value : `${row.value} · not a token`;
      } else {
        // Token names read cleaner without the leading dashes: color-fill, space-2
        text.textContent = row.token ? row.token.replace(/--/g, '') : row.value;
        if (row.token) dd.title = row.value;
      }
      dd.appendChild(text);
      list.append(dt, dd);
    }
    panel.appendChild(list);
    if (exempt) {
      const note = document.createElement('p');
      note.className = 'inspect-panel-note';
      note.textContent = exempt;
      panel.appendChild(note);
    }
    panel.hidden = false;

    // Off to the right of the element (or the left if there's no room), joined by a dotted leader
    const gap = 8;
    const reach = 40;
    const pr = panel.getBoundingClientRect();
    const right = r.right + reach + pr.width <= window.innerWidth - gap;
    const left = right ? r.right + reach : Math.max(gap, r.left - reach - pr.width);
    const top = Math.min(Math.max(gap, midY - 20), window.innerHeight - pr.height - gap);
    Object.assign(panel.style, { left: `${left}px`, top: `${top}px` });

    const pinSide = right ? 'right' : 'left';
    // Padding measurements: a line across each padded side, with its size in a badge
    const bw = parseFloat(cs.borderTopWidth) || 0;
    const pad = {
      top: parseFloat(cs.paddingTop),
      right: parseFloat(cs.paddingRight),
      bottom: parseFloat(cs.paddingBottom),
      left: parseFloat(cs.paddingLeft),
    };
    for (const { side, line, badge } of measures) {
      const size = pad[side as keyof typeof pad];
      const visible = size >= 1;
      line.hidden = badge.hidden = !visible;
      if (!visible) continue;
      badge.textContent = String(Math.round(size * 100) / 100);
      // Lines sit inside the padding; badges sit just outside that edge, clear of the content
      const offset = 4;
      if (side === 'top' || side === 'bottom') {
        const y = side === 'top' ? r.top + bw : r.bottom - bw - size;
        place(line, { left: midX, top: y, width: 0, height: size });
        Object.assign(badge.style, {
          left: `${midX}px`,
          top: side === 'top' ? `${r.top - offset}px` : `${r.bottom + offset}px`,
          transform: side === 'top' ? 'translate(-50%, -100%)' : 'translateX(-50%)',
        });
      } else {
        const x = side === 'left' ? r.left + bw : r.right - bw - size;
        place(line, { left: x, top: midY, width: size, height: 0 });
        Object.assign(badge.style, {
          left: side === 'left' ? `${r.left - offset}px` : `${r.right + offset}px`,
          // On the side the leader leaves from, the badge drops below the line
          top: side === pinSide ? `${midY + offset}px` : `${midY}px`,
          transform: `translate(${side === 'left' ? '-100%' : '0'}, ${side === pinSide ? '0' : '-50%'})`,
        });
      }
    }

    const pinX = right ? r.right : r.left;
    place(pin, { left: pinX - 3, top: midY - 3, width: 6, height: 6 });
    const from = right ? pinX : left + pr.width;
    const to = right ? left : pinX;
    place(leader, { left: Math.min(from, to), top: midY, width: Math.abs(to - from), height: 0 });
  }

  const selector = parts.map((p) => p.selector).join(',');

  // The innermost inspectable element under the point, by geometry (specimens ignore the pointer)
  function targetAt(specimen: HTMLElement, x: number, y: number) {
    let best: HTMLElement | null = null;
    let bestArea = Infinity;
    for (const el of specimen.querySelectorAll<HTMLElement>(selector)) {
      const r = el.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom || r.width === 0) continue;
      const area = r.width * r.height;
      if (area < bestArea) {
        best = el;
        bestArea = area;
      }
    }
    return best;
  }

  let inspecting = false;

  for (const specimen of specimens) {
    specimen.classList.add('ds-specimen');
    // Not usable: nothing inside can be focused or clicked. React islands are made inert on their
    // wrapper, since changing their own markup before hydration would make React complain.
    specimen.querySelectorAll<HTMLElement>('astro-island').forEach((island) => {
      island.inert = true;
    });
    specimen.querySelectorAll<HTMLElement>('a, button, input, select, textarea, [tabindex]').forEach((el) => {
      if (!el.closest('astro-island')) el.tabIndex = -1;
    });
    const layer = document.createElement('div');
    layer.className = 'inspect-layer';
    layer.setAttribute('aria-hidden', 'true');
    specimen.appendChild(layer);

    const inspect = (event: PointerEvent) => {
      if (!inspecting) return;
      const target = targetAt(specimen, event.clientX, event.clientY);
      if (target) show(target);
      else hide();
    };
    layer.addEventListener('pointermove', inspect);
    layer.addEventListener('pointerdown', inspect);
    layer.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') hide();
    });
  }

  window.addEventListener('scroll', hide, { capture: true, passive: true });
  window.addEventListener('resize', hide);

  return {
    setInspecting(on: boolean) {
      inspecting = on;
      if (!on) hide();
    },
  };
}
