/**
 * Any CSS colour as sRGB channels, for code that needs real numbers (WebGL). Browsers can report a
 * computed colour in any format, such as oklch() for Tailwind's palette, so it's painted to a canvas
 * and read back instead of being parsed as text.
 */
export function colorToRgb(value: string): [number, number, number] | null {
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!context || !value) return null;
  context.canvas.width = context.canvas.height = 1;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

export function colorToHex(value: string): string | null {
  const rgb = colorToRgb(value);
  return rgb && `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
