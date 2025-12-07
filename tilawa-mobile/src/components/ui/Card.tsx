/**
 * Tilawa Card Component
 *
 * Elevated surface with standard padding and radius.
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, componentSpacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const variantStyle = getVariantStyle(variant);
  const paddingStyle = getPaddingStyle(padding);

  return (
    <View style={[styles.base, variantStyle, paddingStyle, style]}>
      {children}
    </View>
  );
};

const getVariantStyle = (variant: CardProps['variant']): ViewStyle => {
  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: colors.sanctuary.blackLight,
        ...shadows.md,
      };
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.neutral.gray600,
      };
    case 'default':
    default:
      return {
        backgroundColor: colors.sanctuary.blackLight,
      };
  }
};

const getPaddingStyle = (padding: CardProps['padding']): ViewStyle => {
  switch (padding) {
    case 'none':
      return { padding: 0 };
    case 'sm':
      return { padding: spacing.sm };
    case 'lg':
      return { padding: spacing.xl };
    case 'md':
    default:
      return { padding: componentSpacing.cardPadding };
  }
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
