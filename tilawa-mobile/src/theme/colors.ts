/**
 * Tilawa Color System - "Nocturnal Sanctuary"
 *
 * Philosophy: Night prayer in Mecca. Deep blacks, sacred greens, 24K gold accents.
 * Never bright, never distracting. Always reverent.
 */

export const colors = {
  // Primary Palette
  sanctuary: {
    black: '#0A0A0A',
    blackLight: '#141414',
    blackLighter: '#1A1A1A',
  },

  sacred: {
    green: '#0D4D3E',
    greenLight: '#0F5F4D',
    greenDark: '#0A3D31',
  },

  divine: {
    gold: '#D4AF37',
    goldLight: '#E5C158',
    goldDark: '#B8962F',
  },

  // Neutral Palette
  neutral: {
    white: '#F8F6F0', // Warm white - never pure white
    gray100: '#E8E6E0',
    gray200: '#D0CEC8',
    gray300: '#A8A6A0',
    gray400: '#787670',
    gray500: '#585650',
    gray600: '#383630',
    gray700: '#282620',
    gray800: '#1A1810',
  },

  // Semantic Colors
  semantic: {
    success: '#2E7D5A',
    warning: '#D4A437',
    error: '#C94A4A',
    info: '#4A7DC9',
  },

  // Transparency
  overlay: {
    light: 'rgba(248, 246, 240, 0.1)',
    medium: 'rgba(248, 246, 240, 0.2)',
    dark: 'rgba(10, 10, 10, 0.8)',
    black: 'rgba(10, 10, 10, 0.95)',
  },
} as const;

export type ColorToken = typeof colors;
