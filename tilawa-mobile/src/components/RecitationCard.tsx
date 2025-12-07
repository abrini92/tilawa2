/**
 * RecitationCard Component
 *
 * Card displaying a recording in the library.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Card } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { getSurahName } from '@/utils/quran';
import { formatTimeAgo, formatDuration } from '@/utils/format';
import type { Recording } from '@/types';

interface RecitationCardProps {
  recording: Recording;
  onPress: () => void;
}

export const RecitationCard: React.FC<RecitationCardProps> = ({
  recording,
  onPress,
}) => {
  const surahName = getSurahName(recording.mainSurah || 1);
  const timeAgo = formatTimeAgo(recording.createdAt);
  const score = recording.analysis?.align?.integrity_score || 0;

  return (
    <Pressable onPress={onPress}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text variant="titleMedium" color={colors.neutral.white}>
              {surahName}
            </Text>
            {recording.isQuran && (
              <View style={styles.badge}>
                <Text variant="labelSmall" color={colors.semantic.success}>
                  ✓ Qur'an
                </Text>
              </View>
            )}
          </View>

          {recording.ayahStart && recording.ayahEnd && (
            <Text variant="bodySmall" color={colors.neutral.gray400}>
              Ayah {recording.ayahStart}
              {recording.ayahEnd !== recording.ayahStart && `-${recording.ayahEnd}`}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text variant="labelSmall" color={colors.neutral.gray500}>
            {timeAgo}
          </Text>

          {score > 0 && (
            <Text variant="labelSmall" color={colors.divine.gold}>
              {score}% integrity
            </Text>
          )}
        </View>

        {recording.status === 'PROCESSING' && (
          <View style={styles.processingBadge}>
            <Text variant="labelSmall" color={colors.semantic.warning}>
              Processing...
            </Text>
          </View>
        )}

        {recording.status === 'ERROR' && (
          <View style={styles.errorBadge}>
            <Text variant="labelSmall" color={colors.semantic.error}>
              Failed
            </Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: colors.semantic.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  processingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.semantic.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  errorBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.semantic.error + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
});
