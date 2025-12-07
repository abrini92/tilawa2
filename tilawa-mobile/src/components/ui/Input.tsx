/**
 * Tilawa Input Component
 *
 * Text input for auth forms with consistent styling.
 */

import React, { useState, useCallback } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, componentSpacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { springs } from '@/theme/animations';
import { Text } from './Text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true);
      focusAnim.value = withSpring(1, springs.snappy);
      onFocus?.(e);
    },
    [focusAnim, onFocus]
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false);
      focusAnim.value = withSpring(0, springs.snappy);
      onBlur?.(e);
    },
    [focusAnim, onBlur]
  );

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [colors.neutral.gray600, colors.divine.gold]
    );
    return { borderColor };
  });

  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          variant="labelMedium"
          color={colors.neutral.gray300}
          style={styles.label}
        >
          {label}
        </Text>
      )}
      <AnimatedView
        style={[
          styles.inputContainer,
          animatedBorderStyle,
          hasError && styles.inputError,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.neutral.gray500}
          selectionColor={colors.divine.gold}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </AnimatedView>
      {hasError && (
        <Text
          variant="labelSmall"
          color={colors.semantic.error}
          style={styles.errorText}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.sanctuary.blackLight,
  },
  input: {
    ...typography.bodyMedium,
    color: colors.neutral.white,
    paddingHorizontal: componentSpacing.inputPadding,
    paddingVertical: componentSpacing.inputPadding,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.semantic.error,
  },
  errorText: {
    marginTop: spacing.xs,
  },
});
