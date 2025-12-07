/**
 * Tilawa Button Component
 *
 * 3 variants: primary (gold), secondary (green), ghost (transparent)
 * Animated press with haptic feedback.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, componentSpacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { springs } from '@/theme/animations';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springs.snappy);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  }, [disabled, loading, onPress]);

  const variantStyles = getVariantStyles(variant, disabled);
  const sizeStyles = getSizeStyles(size);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles.textColor}
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <Text
          variant={size === 'sm' ? 'labelMedium' : 'labelLarge'}
          color={variantStyles.textColor}
          style={sizeStyles.text}
        >
          {children}
        </Text>
      )}
    </AnimatedPressable>
  );
};

const getVariantStyles = (
  variant: ButtonVariant,
  disabled: boolean
): { container: ViewStyle; textColor: string } => {
  const opacity = disabled ? 0.5 : 1;

  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: colors.divine.gold,
          opacity,
        },
        textColor: colors.sanctuary.black,
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: colors.sacred.green,
          opacity,
        },
        textColor: colors.neutral.white,
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.neutral.gray500,
          opacity,
        },
        textColor: colors.neutral.white,
      };
  }
};

const getSizeStyles = (
  size: ButtonSize
): { container: ViewStyle; text: TextStyle } => {
  switch (size) {
    case 'sm':
      return {
        container: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.sm,
        },
        text: {},
      };
    case 'md':
      return {
        container: {
          paddingHorizontal: componentSpacing.buttonPaddingHorizontal,
          paddingVertical: componentSpacing.buttonPaddingVertical,
          borderRadius: radius.md,
        },
        text: {},
      };
    case 'lg':
      return {
        container: {
          paddingHorizontal: spacing['2xl'],
          paddingVertical: spacing.lg,
          borderRadius: radius.lg,
        },
        text: {},
      };
  }
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
});
