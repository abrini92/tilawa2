/**
 * Tilawa Theme - Central Export
 *
 * "Nocturnal Sanctuary" design system.
 */

export { colors, type ColorToken } from './colors';
export { typography, type TypographyVariant } from './typography';
export { spacing, screenPadding, componentSpacing, type SpacingToken } from './spacing';
export { shadows, type ShadowToken } from './shadows';
export { radius, type RadiusToken } from './radius';
export {
  springs,
  timing,
  easings,
  animationPresets,
  type SpringConfig,
  type TimingConfig,
} from './animations';

// Unified theme object for convenience
export const theme = {
  colors: require('./colors').colors,
  typography: require('./typography').typography,
  spacing: require('./spacing').spacing,
  shadows: require('./shadows').shadows,
  radius: require('./radius').radius,
  springs: require('./animations').springs,
  timing: require('./animations').timing,
} as const;
