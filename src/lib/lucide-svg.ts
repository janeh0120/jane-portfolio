/** Lucide SVG markup for client-side injection (comment mode, admin). */
export function lucideSvg(
  name:
    | 'x'
    | 'send'
    | 'menu'
    | 'arrow-left'
    | 'arrow-right'
    | 'arrow-up-right'
    | 'check'
    | 'square-mouse-pointer',
  size = 16,
) {
  const paths: Record<string, string> = {
    x: 'M18 6 6 18M6 6l12 12',
    send: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939',
    menu: 'M4 5h16M4 12h16M4 19h16',
    'arrow-left': 'm12 19-7-7 7-7m7 7H5',
    'arrow-right': 'M5 12h14m-7-7 7 7-7 7',
    'arrow-up-right': 'M7 7h10v10M7 17 17 7',
    check: 'M20 6 9 17l-5-5',
    'square-mouse-pointer':
      'M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033zM21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6',
  };

  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
}
