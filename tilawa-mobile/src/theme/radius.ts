/**
 * Tilawa Border Radius System
 *
 * Consistent rounding for visual harmony.
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
