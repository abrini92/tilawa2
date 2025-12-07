/**
 * Studio Stack Navigator
 *
 * Handles the recording flow: Studio → Recording → Processing → Result
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StudioScreen } from '@/screens/main/StudioScreen';
import { RecordingScreen } from '@/screens/main/RecordingScreen';
import { ProcessingScreen } from '@/screens/main/ProcessingScreen';
import { ResultScreen } from '@/screens/main/ResultScreen';
import type { StudioStackParamList } from '@/types';

const Stack = createNativeStackNavigator<StudioStackParamList>();

export const StudioNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="StudioHome" component={StudioScreen} />
      <Stack.Screen
        name="Recording"
        component={RecordingScreen}
        options={{
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Processing"
        component={ProcessingScreen}
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};
