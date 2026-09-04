/**
 * Converts a hex color string to an RGB triplet string, e.g. '#ffffff' -> '255, 255, 255'
 */
export function hexToRgb(hex: string): string {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c
      .split('')
      .map((x) => x + x)
      .join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '255, 255, 255';
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}
