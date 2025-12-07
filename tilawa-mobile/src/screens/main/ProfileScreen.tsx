/**
 * Tilawa Profile Screen
 *
 * User profile and settings.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, screenPadding } from '@/theme/spacing';
import { useAuthStore } from '@/store/authStore';

export const ProfileScreen: React.FC = () => {
  const { user, logout, isLoading } = useAuthStore();

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  }, [logout]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineLarge" color={colors.neutral.white}>
            Profile
          </Text>
        </View>

        {/* User info card */}
        <Card variant="elevated" style={styles.userCard}>
          <View style={styles.avatar}>
            <Text variant="displaySmall" color={colors.divine.gold}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text
            variant="titleLarge"
            color={colors.neutral.white}
            style={styles.userName}
          >
            {user?.name || 'User'}
          </Text>
          <Text variant="bodyMedium" color={colors.neutral.gray400}>
            {user?.email || 'No email'}
          </Text>
        </Card>

        {/* Stats placeholder */}
        <Card variant="outlined" style={styles.statsCard}>
          <Text variant="titleSmall" color={colors.neutral.white}>
            Statistics
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" color={colors.divine.gold}>
                0
              </Text>
              <Text variant="labelSmall" color={colors.neutral.gray400}>
                Recordings
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" color={colors.divine.gold}>
                0
              </Text>
              <Text variant="labelSmall" color={colors.neutral.gray400}>
                Hours
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" color={colors.divine.gold}>
                0
              </Text>
              <Text variant="labelSmall" color={colors.neutral.gray400}>
                Surahs
              </Text>
            </View>
          </View>
        </Card>

        {/* Logout button */}
        <View style={styles.footer}>
          <Button
            variant="ghost"
            onPress={handleLogout}
            loading={isLoading}
            fullWidth
          >
            Sign Out
          </Button>
        </View>
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
  userCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.sanctuary.blackLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  userName: {
    marginBottom: spacing.xs,
  },
  statsCard: {
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  footer: {
    marginTop: 'auto',
  },
});
