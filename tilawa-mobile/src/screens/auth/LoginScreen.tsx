/**
 * Tilawa Login Screen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, Button, Input, LoadingSpinner } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, screenPadding } from '@/theme/spacing';
import { useAuthStore } from '@/store/authStore';
import type { AuthStackParamList } from '@/types';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login, isLoading } = useAuthStore();

  const validate = useCallback(() => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;

    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Error', 'Failed to login. Please try again.');
    }
  }, [email, password, login, validate]);

  const handleSignupPress = useCallback(() => {
    navigation.navigate('Signup');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text variant="displaySmall" color={colors.divine.gold}>
              تلاوة
            </Text>
            <Text
              variant="headlineMedium"
              color={colors.neutral.white}
              style={styles.title}
            >
              Welcome Back
            </Text>
            <Text variant="bodyMedium" color={colors.neutral.gray400}>
              Sign in to continue your journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.input}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              containerStyle={styles.input}
            />

            <Button
              variant="primary"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            >
              Sign In
            </Button>

            <Button
              variant="ghost"
              onPress={handleSignupPress}
              fullWidth
            >
              Create Account
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingSpinner visible={isLoading} message="Signing in..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sanctuary.black,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: screenPadding.horizontal,
    paddingVertical: screenPadding.vertical,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  title: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.lg,
  },
  loginButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});
