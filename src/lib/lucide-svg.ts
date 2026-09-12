/** Lucide SVG markup for client-side injection (comment mode, admin). */
export function lucideSvg(
  name: 'x' | 'send' | 'menu' | 'arrow-left' | 'arrow-right' | 'arrow-up-right',
  size = 16,
) {
  const paths: Record<string, string> = {
    x: 'M18 6 6 18M6 6l12 12',
    send: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939',
    menu: 'M4 5h16M4 12h16M4 19h16',
    'arrow-left': 'm12 19-7-7 7-7m7 7H5',
    'arrow-right': 'M5 12h14m-7-7 7 7-7 7',
    'arrow-up-right': 'M7 7h10v10M7 17 17 7',
  };

  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
}
