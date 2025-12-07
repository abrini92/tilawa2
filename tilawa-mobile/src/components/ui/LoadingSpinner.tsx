/**
 * Tilawa Loading Spinner Component
 *
 * Full-screen overlay with animated spinner.
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { colors } from '@/theme/colors';
import { Text } from './Text';

interface LoadingSpinnerProps {
  visible: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible,
  message,
}) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.divine.gold} />
          {message && (
            <Text
              variant="bodyMedium"
              color={colors.neutral.white}
              style={styles.message}
            >
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    padding: 24,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
  },
});
