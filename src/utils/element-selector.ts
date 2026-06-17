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

function snippet(text: string, max = 60): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

function projectCardTitle(card: HTMLElement): string {
  const title = card.querySelector('.project-title');
  return title ? snippet(title.textContent ?? '', 80) : 'Project card';
}

export function getCommentTargetLabel(element: HTMLElement): string {
  if (element.dataset.commentId) {
    return element.dataset.commentId.replace(/-/g, ' ');
  }

  const card = element.closest('[data-project-card]');
  if (card instanceof HTMLElement) {
    const title = projectCardTitle(card);
    const tag = element.tagName.toLowerCase();

    if (element === card) return `Project card · ${title}`;
    if (tag === 'img') return `Project image · ${title}`;
    if (tag === 'a') return `Project link · ${title}`;
    if (element.classList.contains('project-title')) return `Project title · ${title}`;
    return `Project card · ${title}`;
  }

  const tag = element.tagName.toLowerCase();
  const text = snippet(element.textContent ?? '');
  const aria = element.getAttribute('aria-label')?.trim();

  if (tag === 'a') {
    const label = text || aria || '';
    if (element.closest('nav')) {
      return label ? `Nav link · ${label}` : 'Navigation link';
    }
    const href = element.getAttribute('href') ?? '';
    if (label) return `Link · ${label}`;
    return href ? `Link · ${href}` : 'Link';
  }

  if (tag === 'button') {
    if (element.classList.contains('hero-filter')) {
      return text ? `Hero filter · ${text}` : 'Hero filter';
    }
    return text ? `Button · ${text}` : 'Button';
  }

  const heading = tag.match(/^h([1-6])$/);
  if (heading) {
    return text ? `Heading ${heading[1]} · ${text}` : `Heading ${heading[1]}`;
  }

  if (tag === 'img') {
    const alt = element.getAttribute('alt')?.trim();
    return alt ? `Image · ${alt}` : 'Image';
  }

  if (tag === 'p') {
    return text ? `Paragraph · ${snippet(text, 50)}` : 'Paragraph';
  }

  if (tag === 'nav') return 'Main navigation';
  if (tag === 'header') return 'Site header';
  if (tag === 'footer') return 'Site footer';

  if (tag === 'section') {
    const headingText = element.querySelector('h1,h2,h3')?.textContent;
    if (headingText) return `Section · ${snippet(headingText)}`;
    return text ? `Section · ${snippet(text, 40)}` : 'Section';
  }

  if (aria) return `${getElementDisplayName(element)} · ${aria}`;

  const display = getElementDisplayName(element);
  return text ? `${display} · ${snippet(text, 50)}` : display;
}

export function getElementDisplayName(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();
  const heading = tag.match(/^h([1-6])$/);
  if (heading) return `Heading ${heading[1]}`;

  const names: Record<string, string> = {
    p: 'Paragraph',
    a: 'Link',
    button: 'Button',
    img: 'Image',
    section: 'Section',
    article: 'Article',
    nav: 'Navigation',
    header: 'Header',
    footer: 'Footer',
    main: 'Main',
    li: 'List item',
    ul: 'List',
    ol: 'List',
    figure: 'Figure',
    div: 'Block',
  };

  return names[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1);
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
