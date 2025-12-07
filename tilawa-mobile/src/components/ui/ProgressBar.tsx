/**
 * ProgressBar Component
 *
 * Animated progress bar for processing screen.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
}) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View style={[styles.fill, { height }, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.neutral.gray700,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.divine.gold,
    borderRadius: radius.full,
  },
});
