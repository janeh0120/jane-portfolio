const IGNORED_TAGS = new Set([
  'HTML',
  'BODY',
  'SCRIPT',
  'STYLE',
  'LINK',
  'META',
  'HEAD',
  'NOSCRIPT',
  'SVG',
  'PATH',
]);

const SELECTABLE_TAGS = new Set([
  'MAIN',
  'SECTION',
  'ARTICLE',
  'HEADER',
  'FOOTER',
  'NAV',
  'DIV',
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'A',
  'BUTTON',
  'IMG',
  'UL',
  'OL',
  'LI',
  'FIGURE',
]);

export function isSelectableElement(element: Element | null): element is HTMLElement {
  if (!element || !(element instanceof HTMLElement)) return false;
  if (IGNORED_TAGS.has(element.tagName)) return false;
  if (element.closest('[data-comment-ui]')) return false;
  if (!SELECTABLE_TAGS.has(element.tagName)) return false;

  const rect = element.getBoundingClientRect();
  return rect.width >= 24 && rect.height >= 16;
}

export function getElementLabel(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();
  const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (text) return `${tag}: “${text}”`;
  if (element.getAttribute('aria-label')) {
    return `${tag}: ${element.getAttribute('aria-label')}`;
  }
  return tag;
}

export function getStableSelector(element: HTMLElement): string {
  if (element.dataset.commentId) {
    return `[data-comment-id="${element.dataset.commentId}"]`;
  }

  const segments: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current.tagName !== 'BODY' && segments.length < 6) {
    if (current.id) {
      segments.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    const tag = current.tagName.toLowerCase();
    const parent = current.parentElement;
    if (!parent) break;

    const siblings = Array.from(parent.children).filter(
      (child) => child.tagName === current!.tagName,
    );
    const index = siblings.indexOf(current) + 1;
    segments.unshift(`${tag}:nth-of-type(${index})`);
    current = parent;
  }

  return segments.join(' > ') || element.tagName.toLowerCase();
}
