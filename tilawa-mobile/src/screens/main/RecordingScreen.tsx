/**
 * Recording Screen
 *
 * Full recording flow: idle → recording → stopped (playback) → upload
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text, Button, Card } from '@/components/ui';
import { Waveform } from '@/components/ui/Waveform';
import { colors } from '@/theme/colors';
import { spacing, screenPadding } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { useRecording } from '@/hooks/useRecording';
import { useAuthStore } from '@/store/authStore';
import { uploadRecording } from '@/services/recordings';
import { formatDuration } from '@/utils/format';
import type { StudioStackParamList } from '@/types';

type RecordingScreenProps = {
  navigation: NativeStackNavigationProp<StudioStackParamList, 'Recording'>;
};

export const RecordingScreen: React.FC<RecordingScreenProps> = ({ navigation }) => {
  const {
    state,
    duration,
    metering,
    uri,
    startRecording,
    stopRecording,
    resetRecording,
    playRecording,
    pausePlayback,
    isPlaying,
    playbackPosition,
    playbackDuration,
  } = useRecording();

  const { user } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);

  // Pulsing animation for record button
  const pulseScale = useSharedValue(1);

  const startPulse = useCallback(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      false
    );
  }, [pulseScale]);

  const stopPulse = useCallback(() => {
    pulseScale.value = withTiming(1, { duration: 200 });
  }, [pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleRecordPress = useCallback(async () => {
    if (state === 'idle') {
      startPulse();
      await startRecording();
    } else if (state === 'recording') {
      stopPulse();
      await stopRecording();
    }
  }, [state, startRecording, stopRecording, startPulse, stopPulse]);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pausePlayback();
    } else {
      await playRecording();
    }
  }, [isPlaying, playRecording, pausePlayback]);

  const handleReRecord = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetRecording();
  }, [resetRecording]);

  const handleUpload = useCallback(async () => {
    if (!uri || !user) return;

    setIsUploading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const fileName = `recording_${Date.now()}.m4a`;
      const response = await uploadRecording(user.id, uri, fileName);

      // Navigate to processing screen
      navigation.replace('Processing', { recordingId: response.id });
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 429) {
        Alert.alert('Too Many Uploads', 'Please wait a moment and try again.');
      } else {
        Alert.alert('Upload Failed', 'Please check your connection and try again.');
      }
    } finally {
      setIsUploading(false);
    }
  }, [uri, user, navigation]);

  const handleClose = useCallback(() => {
    if (state === 'recording') {
      Alert.alert(
        'Stop Recording?',
        'Your recording will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: () => {
              stopRecording();
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [state, stopRecording, navigation]);

  // Render based on state
  if (state === 'stopped') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" color={colors.neutral.white}>
            Your Recording
          </Text>
          <Button variant="ghost" size="sm" onPress={handleClose}>
            ✕
          </Button>
        </View>

        <View style={styles.content}>
          {/* Playback Card */}
          <Card variant="elevated" style={styles.playbackCard}>
            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0}%`,
                  },
                ]}
              />
            </View>

            {/* Play button and time */}
            <View style={styles.playbackControls}>
              <Button
                variant="primary"
                size="lg"
                onPress={handlePlayPause}
                style={styles.playButton}
              >
                {isPlaying ? '⏸' : '▶️'}
              </Button>
              <Text variant="bodyLarge" color={colors.neutral.white}>
                {formatDuration(playbackPosition)} / {formatDuration(playbackDuration)}
              </Text>
            </View>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="ghost"
              onPress={handleReRecord}
              fullWidth
              style={styles.actionButton}
            >
              🔄 Re-record
            </Button>

            <Button
              variant="primary"
              onPress={handleUpload}
              loading={isUploading}
              fullWidth
              style={styles.actionButton}
            >
              ✨ Upload & Enhance
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Recording / Idle state
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" color={colors.neutral.white}>
          Recording
        </Text>
        <Button variant="ghost" size="sm" onPress={handleClose}>
          ✕
        </Button>
      </View>

      <View style={styles.content}>
        {/* Waveform */}
        <Card variant="elevated" style={styles.waveformCard}>
          <Waveform metering={metering} isRecording={state === 'recording'} />
        </Card>

        {/* Timer */}
        <Text variant="displayMedium" color={colors.divine.gold} style={styles.timer}>
          {formatDuration(duration)}
        </Text>

        {/* Record Button */}
        <Animated.View style={pulseStyle}>
          <Button
            variant={state === 'recording' ? 'secondary' : 'primary'}
            size="lg"
            onPress={handleRecordPress}
            style={StyleSheet.flatten([styles.recordButton, state === 'recording' && styles.recordButtonActive])}
          >
            {state === 'recording' ? '⏹ Stop' : '⏺ Start Recording'}
          </Button>
        </Animated.View>

        {/* Tip */}
        {state === 'idle' && (
          <Card variant="outlined" style={styles.tipCard}>
            <Text variant="bodySmall" color={colors.neutral.gray400}>
              💡 Tip: Find a quiet environment and speak clearly
            </Text>
          </Card>
        )}

        {state === 'recording' && (
          <Text variant="bodySmall" color={colors.semantic.error} style={styles.recordingHint}>
            Recording in progress...
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sanctuary.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenPadding.horizontal,
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: screenPadding.horizontal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformCard: {
    width: '100%',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing['2xl'],
  },
  timer: {
    marginBottom: spacing['3xl'],
  },
  recordButton: {
    minWidth: 200,
    marginBottom: spacing['2xl'],
  },
  recordButtonActive: {
    backgroundColor: colors.semantic.error,
  },
  tipCard: {
    position: 'absolute',
    bottom: spacing['4xl'],
    left: screenPadding.horizontal,
    right: screenPadding.horizontal,
  },
  recordingHint: {
    position: 'absolute',
    bottom: spacing['4xl'],
  },
  playbackCard: {
    width: '100%',
    marginBottom: spacing['2xl'],
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.neutral.gray700,
    borderRadius: radius.full,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.divine.gold,
    borderRadius: radius.full,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
});
