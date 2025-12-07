/**
 * Tilawa Main Navigator
 *
 * Bottom tab navigator for main app flow.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StudioScreen } from '@/screens/main/StudioScreen';
import { LibraryScreen } from '@/screens/main/LibraryScreen';
import { ProfileScreen } from '@/screens/main/ProfileScreen';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { MainTabParamList } from '@/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple icon components (replace with proper icons later)
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({
  name,
  focused,
}) => {
  const icons: Record<string, string> = {
    Studio: '🎙️',
    Library: '📚',
    Profile: '👤',
  };

  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.iconWrapper,
          focused && styles.iconWrapperFocused,
        ]}
      >
        <View style={styles.icon}>
          {/* Using emoji as placeholder - replace with proper icons */}
          <View style={styles.emojiIcon}>
            <View style={{ opacity: focused ? 1 : 0.6 }}>
              {/* Placeholder for icon */}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.divine.gold,
        tabBarInactiveTintColor: colors.neutral.gray500,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Studio"
        component={StudioScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Studio" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Library" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.sanctuary.blackLight,
    borderTopColor: colors.neutral.gray700,
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
    paddingBottom: 25,
  },
  tabBarLabel: {
    ...typography.labelSmall,
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperFocused: {
    backgroundColor: colors.overlay.light,
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiIcon: {
    width: 20,
    height: 20,
  },
});
