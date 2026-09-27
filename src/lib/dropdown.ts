import { lucideSvg } from './lucide-svg';

/**
 * Replaces the OS-drawn menu of a native <select> with the site dropdown menu.
 * The <select> stays in the DOM as the source of truth: callers keep reading
 * `.value` and listening for `change`.
 */

type Enhanced = HTMLSelectElement & { __dropdownTrigger?: HTMLButtonElement };

const MENU_GAP = 6;
const VIEWPORT_PAD = 8;

let openMenu: { menu: HTMLElement; close: (restoreFocus?: boolean) => void } | null = null;
let idCounter = 0;

/**
 * Adds one shared fill that slides to the hovered, focused, or `.is-active`
 * option. The menu must be positioned (fixed, absolute, or relative).
 */
export function attachDropdownHighlight(menu: HTMLElement): () => void {
  const pill = document.createElement('span');
  pill.className = 'dropdown-highlight';
  pill.setAttribute('aria-hidden', 'true');
  menu.prepend(pill);
  menu.classList.add('has-highlight');

  let hovered: HTMLElement | null = null;
  let focused: HTMLElement | null = null;
  let shown = false;

  const optionFrom = (target: EventTarget | null) => {
    const item = target instanceof Element ? target.closest<HTMLElement>('.dropdown-option') : null;
    return item && menu.contains(item) && item.getAttribute('aria-disabled') !== 'true' ? item : null;
  };

  const update = () => {
    const target =
      menu.hidden
        ? null
        : (hovered ?? focused ?? menu.querySelector<HTMLElement>('.dropdown-option.is-active'));
    if (!target) {
      shown = false;
      pill.classList.remove('is-visible');
      return;
    }
    if (!shown) pill.classList.add('is-instant');
    pill.style.transform = `translateY(${target.offsetTop}px)`;
    pill.style.height = `${target.offsetHeight}px`;
    if (!shown) {
      void pill.offsetHeight;
      pill.classList.remove('is-instant');
      shown = true;
    }
    pill.classList.add('is-visible');
  };

  const onOver = (event: PointerEvent) => {
    const item = optionFrom(event.target);
    if (!item || item === hovered) return;
    hovered = item;
    update();
  };
  const onLeave = () => {
    hovered = null;
    update();
  };
  const onFocusIn = (event: FocusEvent) => {
    focused = optionFrom(event.target);
    update();
  };
  const onFocusOut = () => {
    focused = null;
    update();
  };

  menu.addEventListener('pointerover', onOver);
  menu.addEventListener('pointerleave', onLeave);
  menu.addEventListener('focusin', onFocusIn);
  menu.addEventListener('focusout', onFocusOut);
  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.target !== pill)) update();
  });
  observer.observe(menu, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  update();

  return () => {
    observer.disconnect();
    menu.removeEventListener('pointerover', onOver);
    menu.removeEventListener('pointerleave', onLeave);
    menu.removeEventListener('focusin', onFocusIn);
    menu.removeEventListener('focusout', onFocusOut);
    menu.classList.remove('has-highlight');
    pill.remove();
  };
}

function labelFor(select: HTMLSelectElement): string {
  const aria = select.getAttribute('aria-label');
  if (aria) return aria;
  const label = select.id ? document.querySelector(`label[for="${select.id}"]`) : null;
  return label?.textContent?.trim() ?? '';
}

export function enhanceSelect(select: HTMLSelectElement): HTMLButtonElement {
  const enhanced = select as Enhanced;
  if (enhanced.__dropdownTrigger) return enhanced.__dropdownTrigger;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = select.className;
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  const label = labelFor(select);

  const menuId = `dropdown-menu-${++idCounter}`;
  trigger.setAttribute('aria-controls', menuId);

  select.classList.add('dropdown-native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  select.insertAdjacentElement('afterend', trigger);
  enhanced.__dropdownTrigger = trigger;

  let menu: HTMLElement | null = null;
  let activeIndex = -1;

  const syncTrigger = () => {
    const option = select.options[select.selectedIndex];
    const text = option?.textContent ?? '';
    trigger.textContent = text;
    if (label) trigger.setAttribute('aria-label', text ? `${label}, ${text}` : label);
    trigger.dataset.value = select.value;
    trigger.dataset.empty = select.value === '' ? 'true' : 'false';
    trigger.disabled = select.disabled;
  };

  const proto = HTMLSelectElement.prototype;
  for (const key of ['value', 'selectedIndex'] as const) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    if (!descriptor?.get || !descriptor.set) continue;
    Object.defineProperty(select, key, {
      configurable: true,
      get() {
        return descriptor.get!.call(this);
      },
      set(next) {
        descriptor.set!.call(this, next);
        syncTrigger();
      },
    });
  }

  new MutationObserver(syncTrigger).observe(select, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'selected'],
  });
  select.addEventListener('change', syncTrigger);

  const setActive = (index: number) => {
    if (!menu) return;
    const items = [...menu.querySelectorAll<HTMLElement>('.dropdown-option')];
    if (items.length === 0) return;
    activeIndex = (index + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle('is-active', i === activeIndex));
    const active = items[activeIndex];
    trigger.setAttribute('aria-activedescendant', active.id);
    if (menu.scrollHeight > menu.clientHeight) {
      const top = active.offsetTop;
      const bottom = top + active.offsetHeight;
      if (top < menu.scrollTop) menu.scrollTop = top;
      else if (bottom > menu.scrollTop + menu.clientHeight) {
        menu.scrollTop = bottom - menu.clientHeight;
      }
    }
  };

  const choose = (index: number) => {
    const option = select.options[index];
    if (!option || option.disabled) return;
    const changed = select.selectedIndex !== index;
    select.selectedIndex = index;
    close(true);
    if (changed) {
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const position = () => {
    if (!menu) return;
    const rect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuRect.height + MENU_GAP + VIEWPORT_PAD && rect.top > spaceBelow;
    const top = openUp ? rect.top - menuRect.height - MENU_GAP : rect.bottom + MENU_GAP;
    const maxLeft = window.innerWidth - menuRect.width - VIEWPORT_PAD;
    const left = Math.max(VIEWPORT_PAD, Math.min(rect.left, maxLeft));
    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
    menu.dataset.placement = openUp ? 'top' : 'bottom';
  };

  const onOutside = (event: Event) => {
    const target = event.target as Node;
    if (menu?.contains(target) || trigger.contains(target)) return;
    close();
  };

  const onScroll = (event: Event) => {
    if (menu && event.target instanceof Node && menu.contains(event.target)) return;
    close();
  };

  function close(restoreFocus = false) {
    if (!menu) return;
    menu.remove();
    menu = null;
    activeIndex = -1;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    document.removeEventListener('pointerdown', onOutside, true);
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', onScroll);
    if (openMenu?.close === close) openMenu = null;
    if (restoreFocus && trigger.isConnected) trigger.focus();
  }

  const open = () => {
    if (menu || select.disabled) return;
    openMenu?.close();

    menu = document.createElement('div');
    menu.id = menuId;
    menu.className = 'dropdown-menu is-floating';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('data-comment-ui', '');
    if (label) menu.setAttribute('aria-label', label);

    [...select.options].forEach((option, index) => {
      const item = document.createElement('div');
      item.id = `${menuId}-option-${index}`;
      item.className = 'dropdown-option';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(index === select.selectedIndex));
      if (option.disabled) item.setAttribute('aria-disabled', 'true');
      item.innerHTML = `<span class="dropdown-check">${lucideSvg('check', 14)}</span>`;
      const text = document.createElement('span');
      text.className = 'dropdown-label';
      text.textContent = option.textContent;
      item.appendChild(text);
      item.addEventListener('pointermove', () => setActive(index));
      item.addEventListener('mousedown', (event) => event.preventDefault());
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        choose(index);
      });
      menu!.appendChild(item);
    });

    document.body.appendChild(menu);
    attachDropdownHighlight(menu);
    trigger.setAttribute('aria-expanded', 'true');
    position();
    setActive(Math.max(0, select.selectedIndex));

    document.addEventListener('pointerdown', onOutside, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    openMenu = { menu, close };
  };

  trigger.addEventListener('click', () => {
    if (menu) close();
    else open();
  });

  trigger.addEventListener('keydown', (event) => {
    const isOpen = Boolean(menu);
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!isOpen) {
          open();
          return;
        }
        setActive(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
        return;
      }
      case 'Home':
      case 'End':
        if (!isOpen) return;
        event.preventDefault();
        setActive(event.key === 'Home' ? 0 : select.options.length - 1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen) choose(activeIndex);
        else open();
        return;
      case 'Escape':
        if (!isOpen) return;
        event.preventDefault();
        event.stopPropagation();
        close(true);
        return;
      case 'Tab':
        if (isOpen) close();
        return;
    }
  });

  syncTrigger();
  return trigger;
}

export function enhanceSelects(root: ParentNode = document) {
  root.querySelectorAll<HTMLSelectElement>('select[data-dropdown]').forEach(enhanceSelect);
}
