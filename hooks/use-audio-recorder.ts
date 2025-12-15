/**
 * Custom hook for audio recording
 */
import { useState } from 'react';
import { Audio } from 'expo-av';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recording: Audio.Recording | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    recording: null,
  });

  const startRecording = async () => {
    try {
      console.log('[AudioRecorder] Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      console.log('[AudioRecorder] Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('[AudioRecorder] Starting recording...');
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setState((prev) => ({
            ...prev,
            duration: status.durationMillis,
          }));
        }
      });

      await recording.startAsync();

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        recording,
      });

      console.log('[AudioRecorder] Recording started');
    } catch (error) {
      console.error('[AudioRecorder] Failed to start recording:', error);
      throw error;
    }
  };

  const pauseRecording = async () => {
    if (!state.recording) return;

    try {
      await state.recording.pauseAsync();
      setState((prev) => ({ ...prev, isPaused: true }));
      console.log('[AudioRecorder] Recording paused');
    } catch (error) {
      console.error('[AudioRecorder] Failed to pause recording:', error);
      throw error;
    }
  };

  const resumeRecording = async () => {
    if (!state.recording) return;

    try {
      await state.recording.startAsync();
      setState((prev) => ({ ...prev, isPaused: false }));
      console.log('[AudioRecorder] Recording resumed');
    } catch (error) {
      console.error('[AudioRecorder] Failed to resume recording:', error);
      throw error;
    }
  };

  const stopRecording = async (): Promise<Blob> => {
    if (!state.recording) {
      throw new Error('No recording in progress');
    }

    try {
      console.log('[AudioRecorder] Stopping recording...');
      await state.recording.stopAndUnloadAsync();
      const uri = state.recording.getURI();

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      console.log('[AudioRecorder] Recording saved to:', uri);

      // Convert to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      console.log('[AudioRecorder] Audio converted to blob:', blob.size, 'bytes');

      setState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        recording: null,
      });

      return blob;
    } catch (error) {
      console.error('[AudioRecorder] Failed to stop recording:', error);
      throw error;
    }
  };

  const cancelRecording = async () => {
    if (!state.recording) return;

    try {
      await state.recording.stopAndUnloadAsync();
      setState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        recording: null,
      });
      console.log('[AudioRecorder] Recording cancelled');
    } catch (error) {
      console.error('[AudioRecorder] Failed to cancel recording:', error);
      throw error;
    }
  };

  const reset = async () => {
    try {
      if (state.recording) {
        await state.recording.stopAndUnloadAsync();
      }
      setState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        recording: null,
      });
      console.log('[AudioRecorder] State reset');
    } catch (error) {
      console.error('[AudioRecorder] Failed to reset:', error);
    }
  };

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    reset,
  };
}
