/**
 * Tilawa Shadow System
 *
 * Subtle elevation for depth without breaking the nocturnal aesthetic.
 * Shadows are soft and warm, never harsh.
 */

import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const createShadow = (
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number
): ShadowStyle => ({
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: opacity,
  shadowRadius: radius,
  ...Platform.select({
    android: { elevation },
    default: {},
  }),
});

export const shadows = {
  none: createShadow(0, 0, 0, 0),

  // Subtle - for cards, inputs
  sm: createShadow(1, 2, 0.1, 1),

  // Medium - for elevated cards, modals
  md: createShadow(2, 4, 0.15, 3),

  // Large - for floating elements
  lg: createShadow(4, 8, 0.2, 6),

  // Extra large - for overlays
  xl: createShadow(8, 16, 0.25, 12),

  // Glow effect for gold accents
  glow: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    ...Platform.select({
      android: { elevation: 8 },
      default: {},
    }),
  } as ShadowStyle,
} as const;

export type ShadowToken = keyof typeof shadows;
