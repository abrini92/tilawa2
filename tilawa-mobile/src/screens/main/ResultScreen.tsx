/**
 * Result Screen
 *
 * Display recording analysis and playback.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Text, Button, Card } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, screenPadding } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { getRecording } from '@/services/recordings';
import { getSurahName } from '@/utils/quran';
import { formatDuration, formatDate } from '@/utils/format';
import type { StudioStackParamList, Recording } from '@/types';

type ResultScreenProps = {
  navigation: NativeStackNavigationProp<StudioStackParamList, 'Result'>;
  route: RouteProp<StudioStackParamList, 'Result'>;
};

export const ResultScreen: React.FC<ResultScreenProps> = ({
  navigation,
  route,
}) => {
  const { recordingId } = route.params;
  const [recording, setRecording] = useState<Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load recording data
  useEffect(() => {
    const loadRecording = async () => {
      try {
        const data = await getRecording(recordingId);
        setRecording(data);
      } catch (error) {
        console.error('Failed to load recording:', error);
        Alert.alert('Error', 'Failed to load recording');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    loadRecording();
  }, [recordingId, navigation]);

  // Load audio for playback
  useEffect(() => {
    if (!recording?.enhancedUrl) return;

    const loadSound = async () => {
      try {
        const { sound: audioSound } = await Audio.Sound.createAsync(
          { uri: recording.enhancedUrl! },
          { shouldPlay: false },
          (status) => {
            if (status.isLoaded) {
              setPosition(status.positionMillis / 1000);
              setDuration((status.durationMillis || 0) / 1000);
              setIsPlaying(status.isPlaying);

              // Reset when finished
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
              }
            }
          }
        );
        setSound(audioSound);
      } catch (error) {
        console.error('Failed to load audio:', error);
      }
    };

    loadSound();

    return () => {
      sound?.unloadAsync();
    };
  }, [recording?.enhancedUrl]);

  const togglePlayback = useCallback(async () => {
    if (!sound) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      // Reset if at end
      if (position >= duration - 0.5) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
    }
  }, [sound, isPlaying, position, duration]);

  const handleShare = useCallback(async () => {
    if (!recording?.enhancedUrl) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Download to cache
      const cacheDir = (FileSystem as { cacheDirectory?: string }).cacheDirectory || '';
      const fileUri = cacheDir + `recitation_${recording.id}.m4a`;
      await (FileSystem as { downloadAsync: (uri: string, fileUri: string) => Promise<unknown> }).downloadAsync(recording.enhancedUrl, fileUri);

      // Share
      await Sharing.shareAsync(fileUri, {
        mimeType: 'audio/m4a',
        dialogTitle: 'Share your recitation',
      });
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('Share Failed', 'Could not share the recording.');
    }
  }, [recording]);

  const handleRecordAnother = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace('Recording', {});
  }, [navigation]);

  const handleGoToLibrary = useCallback(() => {
    navigation.popToTop();
    // Navigate to Library tab would require parent navigator access
  }, [navigation]);

  if (isLoading || !recording) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text variant="bodyMedium" color={colors.neutral.gray400}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const surahName = getSurahName(recording.mainSurah || 1);
  const integrityScore = recording.analysis?.align?.integrity_score || 0;
  const confidence = recording.analysis?.isQuran?.quran_confidence || 0;
  const versesCount = recording.analysis?.align?.verses?.length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Button variant="ghost" size="sm" onPress={() => navigation.goBack()}>
            ← Back
          </Button>
        </View>

        {/* Badge */}
        {recording.isQuran && (
          <View style={styles.badge}>
            <Text variant="labelMedium" color={colors.semantic.success}>
              ✓ Qur'an Detected
            </Text>
          </View>
        )}

        {!recording.isQuran && (
          <View style={[styles.badge, styles.badgeWarning]}>
            <Text variant="labelMedium" color={colors.semantic.warning}>
              ⚠ Not recognized as Qur'an
            </Text>
          </View>
        )}

        {/* Metadata */}
        <Text variant="headlineMedium" color={colors.neutral.white} style={styles.title}>
          {surahName}
        </Text>

        {recording.ayahStart && recording.ayahEnd && (
          <Text variant="bodyMedium" color={colors.neutral.gray400}>
            Ayah {recording.ayahStart}
            {recording.ayahEnd !== recording.ayahStart && `-${recording.ayahEnd}`}
          </Text>
        )}

        <Text variant="bodySmall" color={colors.neutral.gray500} style={styles.date}>
          {formatDate(recording.createdAt)}
        </Text>

        {/* Audio Player */}
        <Card variant="elevated" style={styles.playerCard}>
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressFill,
                { width: `${duration > 0 ? (position / duration) * 100 : 0}%` },
              ]}
            />
          </View>

          {/* Controls */}
          <View style={styles.playerControls}>
            <Button
              variant="primary"
              size="lg"
              onPress={togglePlayback}
              style={styles.playButton}
            >
              {isPlaying ? '⏸' : '▶️'}
            </Button>

            <Text variant="bodyMedium" color={colors.neutral.white}>
              {formatDuration(position)} / {formatDuration(duration)}
            </Text>
          </View>

          <Text variant="labelSmall" color={colors.divine.gold} style={styles.qualityBadge}>
            🎧 Studio Quality
          </Text>
        </Card>

        {/* Analysis */}
        {recording.analysis && (
          <Card variant="outlined" style={styles.analysisCard}>
            <Text variant="titleMedium" color={colors.neutral.white} style={styles.analysisTitle}>
              Analysis
            </Text>

            <View style={styles.analysisRow}>
              <Text variant="bodySmall" color={colors.neutral.gray400}>
                Integrity Score
              </Text>
              <Text variant="bodyMedium" color={colors.divine.gold}>
                {integrityScore}%
              </Text>
            </View>

            <View style={styles.analysisRow}>
              <Text variant="bodySmall" color={colors.neutral.gray400}>
                Confidence
              </Text>
              <Text variant="bodyMedium" color={colors.divine.gold}>
                {Math.round(confidence * 100)}%
              </Text>
            </View>

            <View style={styles.analysisRow}>
              <Text variant="bodySmall" color={colors.neutral.gray400}>
                Verses Detected
              </Text>
              <Text variant="bodyMedium" color={colors.divine.gold}>
                {versesCount}
              </Text>
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={handleGoToLibrary}
            fullWidth
            style={styles.actionButton}
          >
            💾 Save to Library
          </Button>

          <Button
            variant="secondary"
            onPress={handleShare}
            fullWidth
            style={styles.actionButton}
          >
            📤 Share
          </Button>

          <Button
            variant="ghost"
            onPress={handleRecordAnother}
            fullWidth
          >
            Record Another
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sanctuary.black,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: screenPadding.horizontal,
    paddingBottom: spacing['4xl'],
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.semantic.success + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  badgeWarning: {
    backgroundColor: colors.semantic.warning + '20',
  },
  title: {
    marginBottom: spacing.xs,
  },
  date: {
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  playerCard: {
    marginBottom: spacing.xl,
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
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  qualityBadge: {
    textAlign: 'center',
  },
  analysisCard: {
    marginBottom: spacing['2xl'],
  },
  analysisTitle: {
    marginBottom: spacing.lg,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray700,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
});
