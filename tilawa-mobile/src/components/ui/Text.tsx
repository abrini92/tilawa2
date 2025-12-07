/**
 * Tilawa Text Component
 *
 * Variant-based typography supporting Arabic + Latin.
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography, TypographyVariant } from '@/theme/typography';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'auto';
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'bodyMedium',
  color = colors.neutral.white,
  align = 'auto',
  style,
  children,
  ...props
}) => {
  const variantStyle = typography[variant];

  return (
    <RNText
      style={[
        styles.base,
        variantStyle,
        { color, textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    // Base styles applied to all text
  },
});
