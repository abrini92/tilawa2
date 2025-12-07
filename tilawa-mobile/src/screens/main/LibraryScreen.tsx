/**
 * Tilawa Library Screen
 *
 * User's recitation library.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, screenPadding } from '@/theme/spacing';

export const LibraryScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineLarge" color={colors.neutral.white}>
            Library
          </Text>
          <Text variant="bodyMedium" color={colors.neutral.gray400}>
            Your recitations
          </Text>
        </View>

        {/* Empty state */}
        <Card variant="outlined" style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Text
              variant="displaySmall"
              color={colors.neutral.gray600}
              style={styles.emptyIcon}
            >
              📚
            </Text>
            <Text
              variant="titleMedium"
              color={colors.neutral.gray400}
              align="center"
            >
              No recordings yet
            </Text>
            <Text
              variant="bodySmall"
              color={colors.neutral.gray500}
              align="center"
              style={styles.emptyText}
            >
              Your recitations will appear here after you record them in the
              Studio.
            </Text>
          </View>
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
    paddingVertical: screenPadding.vertical,
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  emptyCard: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyText: {
    marginTop: spacing.sm,
    maxWidth: 250,
  },
});
