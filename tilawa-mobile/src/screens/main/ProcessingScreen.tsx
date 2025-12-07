/**
 * Processing Screen
 *
 * Shows processing progress while polling for status.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Text, Card } from '@/components/ui';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PulsingIcon } from '@/components/ui/PulsingIcon';
import { colors } from '@/theme/colors';
import { spacing, screenPadding } from '@/theme/spacing';
import { subscribeToRecording, getRecording } from '@/services/recordings';
import type { StudioStackParamList, RecordingStatus } from '@/types';

type ProcessingScreenProps = {
  navigation: NativeStackNavigationProp<StudioStackParamList, 'Processing'>;
  route: RouteProp<StudioStackParamList, 'Processing'>;
};

const STATUS_MESSAGES: Record<RecordingStatus, string> = {
  UPLOADED: 'Queued for processing...',
  PROCESSING: 'Enhancing audio quality...',
  DONE: 'Processing complete!',
  ERROR: 'Processing failed',
};

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  navigation,
  route,
}) => {
  const { recordingId } = route.params;
  const [status, setStatus] = useState<RecordingStatus>('UPLOADED');
  const [progress, setProgress] = useState(0);
  const [startTime] = useState(Date.now());

  // Prevent back navigation during processing
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Processing in Progress',
        'Please wait for processing to complete.',
        [{ text: 'OK' }]
      );
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Realtime subscription (no more polling!)
  useEffect(() => {
    let isMounted = true;

    // Initial fetch
    const fetchInitial = async () => {
      try {
        const recording = await getRecording(recordingId);
        if (isMounted) {
          setStatus(recording.status);
          if (recording.status === 'DONE') {
            setProgress(100);
            navigation.replace('Result', { recordingId: recording.id });
          }
        }
      } catch (error) {
        console.error('Initial fetch error:', error);
      }
    };

    fetchInitial();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToRecording(recordingId, (recording) => {
      if (!isMounted) return;

      setStatus(recording.status);

      if (recording.status === 'DONE') {
        setProgress(100);
        setTimeout(() => {
          if (isMounted) {
            navigation.replace('Result', { recordingId: recording.id });
          }
        }, 500);
      } else if (recording.status === 'ERROR') {
        Alert.alert(
          'Processing Failed',
          'Something went wrong. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    });

    // Progress animation (visual only)
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const estimatedProgress = Math.min((elapsed / 30) * 100, 95);
      setProgress(estimatedProgress);
    }, 500);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(progressInterval);
    };
  }, [recordingId, navigation, startTime]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Pulsing Icon */}
        <PulsingIcon icon="☪️" size={80} />

        {/* Title */}
        <Text
          variant="headlineMedium"
          color={colors.neutral.white}
          align="center"
          style={styles.title}
        >
          Enhancing your recitation
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} />
        </View>

        {/* Status Message */}
        <Text
          variant="bodyMedium"
          color={colors.neutral.gray400}
          align="center"
          style={styles.status}
        >
          {STATUS_MESSAGES[status]}
        </Text>

        {/* Time Estimate */}
        <Card variant="outlined" style={styles.infoCard}>
          <Text variant="bodySmall" color={colors.neutral.gray500} align="center">
            ⏱ Expected: ~30 seconds
          </Text>
          <Text
            variant="labelSmall"
            color={colors.neutral.gray600}
            align="center"
            style={styles.infoSubtext}
          >
            We're using AI to enhance audio quality and detect Qur'anic verses
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sanctuary.black,
  },
  content: {
    flex: 1,
    paddingHorizontal: screenPadding.horizontal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing['3xl'],
    marginBottom: spacing['2xl'],
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  status: {
    marginBottom: spacing['3xl'],
  },
  infoCard: {
    position: 'absolute',
    bottom: spacing['4xl'],
    left: screenPadding.horizontal,
    right: screenPadding.horizontal,
  },
  infoSubtext: {
    marginTop: spacing.xs,
  },
});
