/**
 * Tilawa Spacing System
 *
 * Based on 4px grid for pixel-perfect alignment.
 * Consistent spacing creates visual rhythm.
 */

export const spacing = {
  // Base unit: 4px
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
} as const;

// Screen padding
export const screenPadding = {
  horizontal: spacing.lg,
  vertical: spacing.xl,
} as const;

// Component-specific spacing
export const componentSpacing = {
  buttonPaddingHorizontal: spacing.xl,
  buttonPaddingVertical: spacing.md,
  cardPadding: spacing.lg,
  inputPadding: spacing.md,
  listItemPadding: spacing.lg,
  sectionGap: spacing['3xl'],
} as const;

export type SpacingToken = keyof typeof spacing;
