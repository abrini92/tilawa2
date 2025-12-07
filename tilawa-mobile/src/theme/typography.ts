/**
 * Tilawa Typography System
 *
 * Arabic: Uthmanic Hafs (Qur'an standard)
 * Latin: SF Pro (iOS) / System default
 * Only 4 weights: Regular, Medium, Semibold, Bold
 */

import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

// Font weights mapping
const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Base text styles
const baseText: TextStyle = {
  fontFamily,
  letterSpacing: 0.2,
};

// Arabic text base (higher line height for breathing)
const baseArabic: TextStyle = {
  ...baseText,
  lineHeight: undefined, // Will be calculated per size
  writingDirection: 'rtl',
  textAlign: 'right',
};

export const typography = {
  // Display - Hero text
  displayLarge: {
    ...baseText,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: fontWeights.bold,
  } as TextStyle,

  displayMedium: {
    ...baseText,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: fontWeights.bold,
  } as TextStyle,

  displaySmall: {
    ...baseText,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: fontWeights.bold,
  } as TextStyle,

  // Headline
  headlineLarge: {
    ...baseText,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: fontWeights.semibold,
  } as TextStyle,

  headlineMedium: {
    ...baseText,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: fontWeights.semibold,
  } as TextStyle,

  headlineSmall: {
    ...baseText,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: fontWeights.semibold,
  } as TextStyle,

  // Title
  titleLarge: {
    ...baseText,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: fontWeights.medium,
  } as TextStyle,

  titleMedium: {
    ...baseText,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.medium,
  } as TextStyle,

  titleSmall: {
    ...baseText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
  } as TextStyle,

  // Body
  bodyLarge: {
    ...baseText,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  bodyMedium: {
    ...baseText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  bodySmall: {
    ...baseText,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  // Label
  labelLarge: {
    ...baseText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
  } as TextStyle,

  labelMedium: {
    ...baseText,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
  } as TextStyle,

  labelSmall: {
    ...baseText,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
  } as TextStyle,

  // Arabic Qur'anic text (line-height 1.8 for breathing)
  arabicLarge: {
    ...baseArabic,
    fontSize: 32,
    lineHeight: 32 * 1.8,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  arabicMedium: {
    ...baseArabic,
    fontSize: 24,
    lineHeight: 24 * 1.8,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  arabicSmall: {
    ...baseArabic,
    fontSize: 18,
    lineHeight: 18 * 1.8,
    fontWeight: fontWeights.regular,
  } as TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
