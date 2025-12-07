/**
 * useRecording Hook
 *
 * Custom hook for audio recording with expo-av.
 * Handles permissions, recording state, and metering for waveform.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Alert, Linking } from 'react-native';

export type RecordingState = 'idle' | 'recording' | 'stopped';

interface UseRecordingReturn {
  state: RecordingState;
  duration: number;
  metering: number;
  uri: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetRecording: () => void;
  playRecording: () => Promise<void>;
  pausePlayback: () => Promise<void>;
  isPlaying: boolean;
  playbackPosition: number;
  playbackDuration: number;
}

export const useRecording = (): UseRecordingReturn => {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [metering, setMetering] = useState(-160);
  const [uri, setUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
      }
      recordingRef.current?.stopAndUnloadAsync();
      soundRef.current?.unloadAsync();
    };
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { granted } = await Audio.requestPermissionsAsync();

    if (!granted) {
      Alert.alert(
        'Microphone Access Required',
        'Tilawa needs microphone access to record your recitation.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    return true;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Create and prepare recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      // Set up metering updates for waveform
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          setMetering(status.metering);
        }
      });

      // Start recording
      await recording.startAsync();
      recordingRef.current = recording;

      // Start duration timer
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 100);

      // Haptic feedback every 5 seconds
      hapticIntervalRef.current = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 5000);

      setState('recording');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  }, [requestPermissions]);

  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return;

      // Clear intervals
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
        hapticIntervalRef.current = null;
      }

      // Stop and get URI
      await recordingRef.current.stopAndUnloadAsync();
      const recordingUri = recordingRef.current.getURI();

      // Reset audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      setUri(recordingUri);
      setState('stopped');
      setMetering(-160);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Load sound for playback
      if (recordingUri) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: false },
          (status) => {
            if (status.isLoaded) {
              setPlaybackPosition(status.positionMillis / 1000);
              setPlaybackDuration((status.durationMillis || 0) / 1000);
              setIsPlaying(status.isPlaying);
            }
          }
        );
        soundRef.current = sound;
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording.');
    }
  }, []);

  const resetRecording = useCallback(() => {
    soundRef.current?.unloadAsync();
    soundRef.current = null;
    recordingRef.current = null;
    setUri(null);
    setDuration(0);
    setMetering(-160);
    setPlaybackPosition(0);
    setPlaybackDuration(0);
    setIsPlaying(false);
    setState('idle');
  }, []);

  const playRecording = useCallback(async () => {
    try {
      if (!soundRef.current) return;
      await soundRef.current.playAsync();
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  }, []);

  const pausePlayback = useCallback(async () => {
    try {
      if (!soundRef.current) return;
      await soundRef.current.pauseAsync();
    } catch (error) {
      console.error('Failed to pause playback:', error);
    }
  }, []);

  return {
    state,
    duration,
    metering,
    uri,
    startRecording,
    stopRecording,
    resetRecording,
    playRecording,
    pausePlayback,
    isPlaying,
    playbackPosition,
    playbackDuration,
  };
};
