/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linearly interpolates between two numbers.
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
