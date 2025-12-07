/**
 * Tilawa Animation System
 *
 * Physics-based springs for organic movement.
 * Never linear easing - always natural.
 */

import { Easing } from 'react-native-reanimated';

// Spring configurations for react-native-reanimated
export const springs = {
  // Snappy - for buttons, quick feedback
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 1,
  },

  // Gentle - for page transitions
  gentle: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },

  // Bouncy - for playful elements
  bouncy: {
    damping: 10,
    stiffness: 300,
    mass: 1,
  },

  // Slow - for modal overlays
  slow: {
    damping: 25,
    stiffness: 150,
    mass: 1,
  },
} as const;

// Timing configurations
export const timing = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
} as const;

// Custom easing curves (for non-spring animations)
export const easings = {
  // Ease out - for enter animations
  easeOut: Easing.bezier(0.25, 0.1, 0.25, 1),

  // Ease in - for exit animations
  easeIn: Easing.bezier(0.42, 0, 1, 1),

  // Ease in-out - for state changes
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),

  // Emphasized - for important transitions
  emphasized: Easing.bezier(0.2, 0, 0, 1),
} as const;

// Animation presets for common use cases
export const animationPresets = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: timing.normal,
  },

  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: timing.fast,
  },

  scaleIn: {
    from: { scale: 0.9, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    spring: springs.snappy,
  },

  slideUp: {
    from: { translateY: 20, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
    spring: springs.gentle,
  },

  pressIn: {
    scale: 0.97,
    spring: springs.snappy,
  },

  pressOut: {
    scale: 1,
    spring: springs.snappy,
  },
} as const;

export type SpringConfig = keyof typeof springs;
export type TimingConfig = keyof typeof timing;
