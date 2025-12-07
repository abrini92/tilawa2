/**
 * Tilawa Library Screen
 *
 * User's recitation library with recordings list.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Text, Card, Button } from '@/components/ui';
import { RecitationCard } from '@/components/RecitationCard';
import { colors } from '@/theme/colors';
import { spacing, screenPadding } from '@/theme/spacing';
import { useAuthStore } from '@/store/authStore';
import { listRecordings } from '@/services/recordings';
import type { Recording, MainTabParamList } from '@/types';

type LibraryNavigationProp = NativeStackNavigationProp<MainTabParamList, 'Library'>;

export const LibraryScreen: React.FC = () => {
  const navigation = useNavigation<LibraryNavigationProp>();
  const { user } = useAuthStore();

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['recordings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');
      return listRecordings(user.id, { status: 'DONE', limit: 50 });
    },
    enabled: !!user?.id,
  });

  const handleRecordingPress = useCallback((recording: Recording) => {
    // Navigate to result screen - would need to be in a stack navigator
    // For now, just log
    console.log('Recording pressed:', recording.id);
  }, []);

  const handleGoToStudio = useCallback(() => {
    // Navigate to Studio tab
    navigation.navigate('Studio');
  }, [navigation]);

  const renderRecording = useCallback(
    ({ item }: { item: Recording }) => (
      <RecitationCard
        recording={item}
        onPress={() => handleRecordingPress(item)}
      />
    ),
    [handleRecordingPress]
  );

  const renderHeader = useCallback(() => {
    if (!data || data.recordings.length === 0) return null;

    return (
      <Card variant="outlined" style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" color={colors.divine.gold}>
              {data.total}
            </Text>
            <Text variant="labelSmall" color={colors.neutral.gray400}>
              Recordings
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" color={colors.divine.gold}>
              {data.recordings.filter((r) => r.isQuran).length}
            </Text>
            <Text variant="labelSmall" color={colors.neutral.gray400}>
              Qur'an
            </Text>
          </View>
        </View>
      </Card>
    );
  }, [data]);

  const renderEmpty = useCallback(() => (
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
          Your recitations will appear here after you record them in the Studio.
        </Text>
        <Button
          variant="primary"
          onPress={handleGoToStudio}
          style={styles.emptyButton}
        >
          Record Your First
        </Button>
      </View>
    </Card>
  ), [handleGoToStudio]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.divine.gold} />
        </View>
      </SafeAreaView>
    );
  }

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

        {/* Recordings List */}
        <FlatList
          data={data?.recordings || []}
          renderItem={renderRecording}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.divine.gold}
            />
          }
        />
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
  },
  header: {
    paddingVertical: screenPadding.vertical,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: spacing['4xl'],
  },
  statsCard: {
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  emptyCard: {
    marginTop: spacing['2xl'],
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
    marginBottom: spacing.xl,
  },
  emptyButton: {
    minWidth: 180,
  },
});
