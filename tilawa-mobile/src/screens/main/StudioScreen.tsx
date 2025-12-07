/**
 * Tilawa Studio Screen
 *
 * Main recording hub - the heart of the app.
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Text, Button, Card } from '@/components/ui';
import { SurahPicker, SurahSelectorButton } from '@/components/ui/SurahPicker';
import { colors } from '@/theme/colors';
import { spacing, screenPadding } from '@/theme/spacing';
import type { StudioStackParamList } from '@/types';

type StudioNavigationProp = NativeStackNavigationProp<StudioStackParamList, 'StudioHome'>;

export const StudioScreen: React.FC = () => {
  const navigation = useNavigation<StudioNavigationProp>();
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const handleStartRecording = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('Recording', { expectedSurah: selectedSurah });
  }, [navigation, selectedSurah]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineLarge" color={colors.neutral.white}>
            Studio
          </Text>
          <Text variant="bodyMedium" color={colors.neutral.gray400}>
            Record your recitation
          </Text>
        </View>

        {/* Surah Selector */}
        <SurahSelectorButton
          selectedSurah={selectedSurah}
          onPress={() => setShowPicker(true)}
        />

        {/* Recording Card */}
        <Card variant="elevated" style={styles.recordingCard}>
          <View style={styles.recordingContent}>
            {/* Waveform placeholder */}
            <View style={styles.waveformPlaceholder}>
              <Text variant="bodySmall" color={colors.neutral.gray500}>
                Waveform visualization
              </Text>
            </View>

            {/* Timer */}
            <Text
              variant="displayMedium"
              color={colors.divine.gold}
              style={styles.timer}
            >
              00:00
            </Text>

            {/* Record button */}
            <Button
              variant="primary"
              size="lg"
              onPress={handleStartRecording}
              style={styles.recordButton}
            >
              Start Recording
            </Button>
          </View>
        </Card>

        {/* Quick tips */}
        <Card variant="outlined" style={styles.tipsCard}>
          <Text variant="titleSmall" color={colors.neutral.white}>
            Tips for best quality
          </Text>
          <Text
            variant="bodySmall"
            color={colors.neutral.gray400}
            style={styles.tipText}
          >
            • Find a quiet environment{'\n'}
            • Keep your device 6-12 inches away{'\n'}
            • Speak clearly and at a steady pace
          </Text>
        </Card>
      </View>

      {/* Surah Picker Modal */}
      <SurahPicker
        visible={showPicker}
        selectedSurah={selectedSurah}
        onSelect={setSelectedSurah}
        onClose={() => setShowPicker(false)}
      />
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
    paddingVertical: screenPadding.vertical,
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  recordingCard: {
    marginBottom: spacing.xl,
  },
  recordingContent: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  waveformPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.sanctuary.blackLighter,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  timer: {
    marginBottom: spacing['2xl'],
  },
  recordButton: {
    minWidth: 200,
  },
  tipsCard: {
    marginTop: 'auto',
  },
  tipText: {
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
