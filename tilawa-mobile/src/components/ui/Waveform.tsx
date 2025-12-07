/**
 * Waveform Component
 *
 * Animated waveform visualization for recording.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { springs } from '@/theme/animations';

interface WaveformProps {
  metering: number; // -160 to 0 dB
  isRecording: boolean;
  barCount?: number;
}

const BAR_WIDTH = 4;
const BAR_GAP = 3;
const MIN_HEIGHT = 4;
const MAX_HEIGHT = 80;

export const Waveform: React.FC<WaveformProps> = ({
  metering,
  isRecording,
  barCount = 35,
}) => {
  // Generate bars with staggered animation
  const bars = Array.from({ length: barCount }, (_, index) => (
    <WaveformBar
      key={index}
      index={index}
      metering={metering}
      isRecording={isRecording}
      totalBars={barCount}
    />
  ));

  return <View style={styles.container}>{bars}</View>;
};

interface WaveformBarProps {
  index: number;
  metering: number;
  isRecording: boolean;
  totalBars: number;
}

const WaveformBar: React.FC<WaveformBarProps> = ({
  index,
  metering,
  isRecording,
  totalBars,
}) => {
  const height = useSharedValue(MIN_HEIGHT);

  useEffect(() => {
    if (isRecording) {
      // Convert metering (-160 to 0) to height
      // Add randomness for visual interest
      const normalizedMetering = (metering + 160) / 160; // 0 to 1
      const randomFactor = 0.5 + Math.random() * 0.5;
      
      // Create wave pattern based on position
      const centerDistance = Math.abs(index - totalBars / 2) / (totalBars / 2);
      const waveFactor = 1 - centerDistance * 0.5;
      
      const targetHeight =
        MIN_HEIGHT +
        normalizedMetering * (MAX_HEIGHT - MIN_HEIGHT) * randomFactor * waveFactor;

      height.value = withSpring(targetHeight, {
        damping: 15,
        stiffness: 300,
      });
    } else {
      height.value = withTiming(MIN_HEIGHT, { duration: 300 });
    }
  }, [metering, isRecording, index, totalBars, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: MAX_HEIGHT,
    paddingHorizontal: 16,
  },
  bar: {
    width: BAR_WIDTH,
    marginHorizontal: BAR_GAP / 2,
    backgroundColor: colors.divine.gold,
    borderRadius: BAR_WIDTH / 2,
  },
});
