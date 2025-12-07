/**
 * PulsingIcon Component
 *
 * Animated pulsing icon for processing/loading states.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { Text } from './Text';

interface PulsingIconProps {
  icon?: string;
  size?: number;
  color?: string;
}

export const PulsingIcon: React.FC<PulsingIconProps> = ({
  icon = '☪️',
  size = 80,
  color = colors.divine.gold,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Glow effect */}
      <Animated.View style={[styles.glow, { width: size * 1.5, height: size * 1.5 }, animatedStyle]}>
        <View
          style={[
            styles.glowInner,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: size * 0.75,
              backgroundColor: color,
            },
          ]}
        />
      </Animated.View>

      {/* Icon */}
      <Animated.View style={animatedStyle}>
        <Text style={{ fontSize: size }}>{icon}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowInner: {
    opacity: 0.15,
  },
});
