
import { StyleSheet, ScrollView, View, Text, Pressable, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { QuestionsService, QuestionDetail, AnswersService } from '@/services';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, AudioQuality, IOSOutputFormat } from 'expo-audio';
import type { RecordingOptions } from 'expo-audio';
import { AuthService } from '@/services/auth.service';

/**
 * Custom recording preset optimized for backend OGG format requirement
 *
 * Platform-specific formats:
 * - Web: Records in OGG with Opus codec ✅ (no conversion needed)
 * - Android: Records in WebM ⚠️ (backend converts WebM → OGG)
 * - iOS: Records in M4A/AAC ⚠️ (backend converts M4A → OGG)
 *
 * Backend must handle conversion:
 * 1. Accept multipart/form-data with 'audio' field
 * 2. Detect source format from file extension or metadata
 * 3. Convert M4A and WebM files to OGG using FFmpeg or similar
 * 4. Process OGG files directly
 *
 * Example FFmpeg commands for backend:
 * - M4A to OGG: ffmpeg -i input.m4a -c:a libvorbis output.ogg
 * - WebM to OGG: ffmpeg -i input.webm -c:a libvorbis output.ogg
 */
const RECORDING_OPTIONS: RecordingOptions = {
  extension: '.webm', // WebM for Android/Web, will be .m4a on iOS
  sampleRate: 48000, // Optimal for Opus codec
  numberOfChannels: 1, // Mono for voice (smaller file size)
  bitRate: 128000,
  isMeteringEnabled: true,
  android: {
    extension: '.webm',
    outputFormat: 'webm', // WebM container (similar to OGG)
    audioEncoder: 'aac', // Android supports AAC encoder with WebM
    sampleRate: 48000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: IOSOutputFormat.MPEG4AAC, // iOS doesn't support OGG, using AAC
    audioQuality: AudioQuality.HIGH,
    sampleRate: 48000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/ogg;codecs=opus', // OGG with Opus codec for web
    bitsPerSecond: 128000,
  },
};

interface PracticeRecord {
  id: number;
  date: string;
  time: string;
  duration: string;
  rating: number;
  maxRating: number; 
  feedback?: {
    fluency: { score: number; description: string };
    vocabulary: { score: number; description: string };
    grammar: { score: number; description: string };
    pronunciation: { score: number; description: string };
    overall: string;
  };
}

export default function SpeakingPracticeScreen() {
  const router = useRouter();
  const { questionId, topic } = useLocalSearchParams();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const [expandedRecords, setExpandedRecords] = useState<number[]>([]);

  // Audio recording - using custom preset for OGG/WebM format
  const audioRecorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 100);
  const [time, setTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecordingSession, setIsRecordingSession] = useState(false); // Track if in recording mode
  const [isPausedManual, setIsPausedManual] = useState(false); // Track pause state manually

  // Audio playback - create player with the recording URI
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const audioPlayer = useAudioPlayer(audioSource);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  // Question state
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock practice records - replace with API call
  const practiceRecords: PracticeRecord[] = [
    {
      id: 1,
      date: '2024-09-24',
      time: '14:30',
      duration: '2:15',
      rating: 7.5,
      maxRating: 9,
      feedback: {
        fluency: {
          score: 7.5,
          description: 'Good flow of speech with some natural pauses. Try to reduce hesitations and use more linking words to connect your ideas smoothly.'
        },
        vocabulary: {
          score: 9,
          description: 'Excellent range of vocabulary with appropriate word choice. You demonstrated good use of less common vocabulary items.'
        },
        grammar: {
          score: 7.5,
          description: 'Generally accurate with good variety of sentence structures. Minor errors in complex sentences that don\'t impede communication.'
        },
        pronunciation: {
          score: 9,
          description: 'Clear pronunciation with good stress and intonation patterns. Very easy to understand throughout.'
        },
        overall: 'Strong performance overall. Focus on improving fluency by practicing with more complex topics and reducing hesitation markers.'
      }
    },
    { id: 2, date: '2024-09-24', time: '14:30', duration: '2:15', rating: 6.5, maxRating: 9 },
    { id: 3, date: '2024-09-24', time: '14:30', duration: '2:15', rating: 7.5, maxRating: 9 },
    { id: 4, date: '2024-09-24', time: '14:30', duration: '2:15', rating: 7.5, maxRating: 9 },
    { id: 5, date: '2024-09-24', time: '14:30', duration: '2:15', rating: 7.5, maxRating: 9 },
    { id: 6, date: '2024-09-24', time: '14:30', duration: '2:15', rating: 7.5, maxRating: 9 },
    { id: 7, date: '2024-09-24', time: '14:30', duration: '2:15', rating: 7.5, maxRating: 9 },
    { id: 8, date: '2024-09-24', time: '14:30', duration: '2:15', rating: 7.5, maxRating: 9 },
    { id: 9, date: '2024-09-24', time: '14:30', duration: '2:15', rating: 7.5, maxRating: 9 },
    { id: 10, date: '2024-09-24', time: '14:30', duration: '2:15', rating: 7.5, maxRating: 9 },
  ];

  // Use topic name from question data if available, otherwise fall back to param
  const topicTitle = question?.topic_name || 'Practice Questions';

  // Fetch question data when component mounts
  useEffect(() => {
    const fetchQuestion = async () => {
      if (!questionId) {
        setError('No question ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('[SpeakingPractice] Fetching question with ID:', questionId);
        const questionData = await QuestionsService.getQuestion(Number(questionId));
        console.log('[SpeakingPractice] Question data received:', questionData);
        setQuestion(questionData);
      } catch (err: any) {
        console.error('[SpeakingPractice] Failed to fetch question:', err);
        const errorMessage = err?.message || 'Failed to load question';

        // Check if it's a "not found" error
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          setError('This question does not exist or has been removed.');
        } else {
          setError('Failed to load question. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  useEffect(() => {
    if (isRecordingSession && !isPausedManual) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecordingSession, isPausedManual]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderState.isRecording) {
        audioRecorder.stop().then(() => {
          setAudioModeAsync({ allowsRecording: false });
        }).catch(console.error);
      }
    };
  }, []);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordToggle = async () => {
    if (!isRecordingSession && !recordingUri) {
      // Start recording
      try {
        // Request permissions
        const { granted } = await requestRecordingPermissionsAsync();

        if (!granted) {
          Alert.alert('Permission Required', 'Please grant microphone permission to record audio.');
          return;
        }

        // Configure audio mode for recording (iOS requires playsInSilentMode: true when recording)
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        // Prepare and start recording
        await audioRecorder.prepareToRecordAsync();
        await audioRecorder.record();
        setIsRecordingSession(true);
        console.log('[Recording] Started recording');
      } catch (error) {
        console.error('[Recording] Failed to start recording:', error);
        Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      }
    } else if (isRecordingSession) {
      // Stop recording (Done button)
      try {
        await audioRecorder.stop();

        // Get the URI from the recorder
        const uri = audioRecorder.uri;
        console.log('[Recording] Stopped recording, URI:', uri);

        // Log file format for debugging
        const fileExtension = uri?.split('.').pop();
        console.log('[Recording] File format:', fileExtension);
        console.log('[Recording] Platform: iOS produces .m4a, Android produces .webm, Web produces .ogg');

        if (!uri) {
          console.error('[Recording] No URI found after stopping');
          Alert.alert('Error', 'Failed to get recording file.');
          setIsRecordingSession(false);
          return;
        }

        setRecordingUri(uri);
        setIsRecordingSession(false);

        // Reset audio mode after recording
        await setAudioModeAsync({
          allowsRecording: false,
        });

        // Load the recording into the audio player
        setAudioSource(uri);
        console.log('[Playback] Loaded recording into player:', uri);
      } catch (error) {
        console.error('[Recording] Failed to stop recording:', error);
        Alert.alert('Error', 'Failed to stop recording.');
        setIsRecordingSession(false);
      }
    }
  };

  const handlePause = async () => {
    if (!isRecordingSession) {
      console.log('[Recording] Cannot pause - not in recording session');
      return;
    }

    try {
      console.log('[Recording] Current pause state:', isPausedManual);
      console.log('[Recording] RecorderState:', recorderState);

      if (isPausedManual) {
        console.log('[Recording] Resuming recording...');
        await audioRecorder.record();
        setIsPausedManual(false);
        console.log('[Recording] Resumed successfully');
      } else {
        console.log('[Recording] Pausing recording...');
        await audioRecorder.pause();
        setIsPausedManual(true);
        console.log('[Recording] Paused successfully');
      }
    } catch (error) {
      console.error('[Recording] Failed to pause/resume:', error);
      Alert.alert('Error', 'Failed to pause/resume recording.');
    }
  };

  const handleReset = async () => {
    try {
      // Stop playback if playing - only if audio source is loaded
      if (audioSource && playerStatus.playing) {
        try {
          audioPlayer.pause();
        } catch (pauseError) {
          console.warn('[Recording] Failed to pause player, continuing reset:', pauseError);
        }
      }

      // Clear the audio player source
      setAudioSource(null);

      // Stop recording if in progress
      if (isRecordingSession) {
        try {
          await audioRecorder.stop();
        } catch (stopError) {
          console.warn('[Recording] Failed to stop recorder, continuing reset:', stopError);
        }

        // Reset audio mode after stopping
        try {
          await setAudioModeAsync({
            allowsRecording: false,
          });
        } catch (audioModeError) {
          console.warn('[Recording] Failed to reset audio mode:', audioModeError);
        }
      }

      // Reset all state
      setTime(0);
      setRecordingUri(null);
      setIsRecordingSession(false);
      setIsPausedManual(false);
      console.log('[Recording] Reset complete');
    } catch (error) {
      console.error('[Recording] Failed to reset:', error);
      // Force reset state even if errors occurred
      setTime(0);
      setRecordingUri(null);
      setIsRecordingSession(false);
      setIsPausedManual(false);
      setAudioSource(null);
    }
  };

  const handlePlayPause = async () => {
    if (!recordingUri || !audioSource) return;

    try {
      if (playerStatus.playing) {
        audioPlayer.pause();
      } else {
        if (playerStatus.didJustFinish) {
          audioPlayer.seekTo(0);
        }
        audioPlayer.play();
      }
    } catch (error) {
      console.error('[Playback] Failed to play/pause:', error);
      Alert.alert('Playback Error', 'Failed to play recording. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      if (!recordingUri) {
        Alert.alert('No Recording', 'Please record your answer first.');
        return;
      }

      if (!questionId) {
        Alert.alert('Error', 'Question ID is missing.');
        return;
      }

      // Stop playback before submitting - only if audio source is loaded
      if (audioSource && playerStatus.playing) {
        try {
          audioPlayer.pause();
        } catch (pauseError) {
          console.warn('[AUDIO UPLOAD] Failed to pause player, continuing upload:', pauseError);
        }
      }

      // Get file extension and determine MIME type
      const fileExtension = recordingUri.split('.').pop()?.toLowerCase();
      let mimeType = 'audio/mpeg'; // default
      let formatInfo = {
        extension: fileExtension,
        platform: Platform.OS,
        needsConversion: false,
      };

      // Determine MIME type based on file extension
      switch (fileExtension) {
        case 'ogg':
          mimeType = 'audio/ogg';
          formatInfo.needsConversion = false;
          break;
        case 'webm':
          mimeType = 'audio/webm';
          formatInfo.needsConversion = true; // Backend should convert WebM to OGG
          break;
        case 'm4a':
          mimeType = 'audio/mp4';
          formatInfo.needsConversion = true; // Backend should convert M4A to OGG
          break;
        default:
          mimeType = 'audio/mpeg';
          formatInfo.needsConversion = true;
      }

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[AUDIO UPLOAD] Preparing to upload audio file');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[AUDIO UPLOAD] Question ID:', questionId);
      console.log('[AUDIO UPLOAD] File URI:', recordingUri);
      console.log('[AUDIO UPLOAD] MIME Type:', mimeType);
      console.log('[AUDIO UPLOAD] File Extension:', fileExtension);
      console.log('[AUDIO UPLOAD] Platform:', Platform.OS);
      console.log('[AUDIO UPLOAD] Duration:', time, 'seconds');
      console.log('═══════════════════════════════════════════════════════════');

      // Get access token
      const token = await AuthService.getToken();
      if (!token) {
        Alert.alert('Error', 'Please login to submit your answer.');
        return;
      }

      console.log('[AUDIO UPLOAD] Access token retrieved');
      console.log('[AUDIO UPLOAD] Token length:', token.length);

      // Create FormData for file upload
      const formData = new FormData();

      // Add the audio file with the correct field name 'audio_file'
      formData.append('audio_file', {
        uri: recordingUri,
        type: mimeType,
        name: `recording_${Date.now()}.${fileExtension}`,
      } as any);

      console.log('[AUDIO UPLOAD] FormData prepared with audio_file field');
      console.log('[AUDIO UPLOAD] Sending request to backend...');

      // Send to backend API
      const API_BASE_URL = 'https://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1';
      const response = await fetch(`${API_BASE_URL}/questions/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let the browser/React Native set it with boundary
        },
        body: formData,
      });

      console.log('[AUDIO UPLOAD] Response status:', response.status);
      console.log('[AUDIO UPLOAD] Response status text:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[AUDIO UPLOAD] ❌ UPLOAD FAILED');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[AUDIO UPLOAD] Status:', response.status);
        console.error('[AUDIO UPLOAD] Error response:', errorText);
        console.error('═══════════════════════════════════════════════════════════');

        let errorMessage = `Failed to submit answer: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }

        Alert.alert('Upload Failed', errorMessage);
        return;
      }

      const result = await response.json();

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[AUDIO UPLOAD] ✅ UPLOAD SUCCESSFUL');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[AUDIO UPLOAD] BACKEND RESPONSE:');
      console.log(JSON.stringify(result, null, 2));
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[AUDIO UPLOAD] User Answer ID:', result.user_answer_id);
      console.log('[AUDIO UPLOAD] Status:', result.status);
      console.log('[AUDIO UPLOAD] Message:', result.message);
      console.log('═══════════════════════════════════════════════════════════');

      Alert.alert(
        'Success!',
        `Your answer has been submitted successfully!\n\nAnswer ID: ${result.user_answer_id}\n\nAI evaluation will be processed shortly.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset the recording
              handleReset();
            }
          }
        ]
      );

    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[AUDIO UPLOAD] ❌ CRITICAL ERROR');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[AUDIO UPLOAD] Error:', error);
      if (error instanceof Error) {
        console.error('[AUDIO UPLOAD] Error message:', error.message);
        console.error('[AUDIO UPLOAD] Error stack:', error.stack);
      }
      console.error('═══════════════════════════════════════════════════════════');

      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to submit recording. Please try again.'
      );
    }
  };

  const toggleRecordExpand = (id: number) => {
    setExpandedRecords((prev) =>
      prev.includes(id) ? prev.filter((recordId) => recordId !== id) : [...prev, id]
    );
  };

  const handleStartPractice = () => {
    setShowRecording(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{topicTitle}</Text>
            <Text style={styles.headerSubtitle}>Practice questions</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3BB9F0" />
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !question) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{topicTitle}</Text>
            <Text style={styles.headerSubtitle}>Practice questions</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error || 'Question not found'}</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (showRecording) {
    return (
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => setShowRecording(false)}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{topicTitle}</Text>
            <Text style={styles.headerSubtitle}>Practice questions</Text>
          </View>
          <Pressable style={styles.infoButton} onPress={() => setShowInstructions(true)}>
            <IconSymbol name="info.circle" size={28} color="#3BB9F0" />
          </Pressable>
        </View>

        {/* Instructions Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showInstructions}
          onRequestClose={() => setShowInstructions(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowInstructions(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Speaking Instructions</Text>
              <View style={styles.instructionsList}>
                <Text style={styles.instructionItem}>• Think about your answer for a few seconds</Text>
                <Text style={styles.instructionItem}>• Speak clearly and naturally</Text>
                <Text style={styles.instructionItem}>• Aim for 1-2 minutes response</Text>
                <Text style={styles.instructionItem}>• Use examples and details to support your answer</Text>
                <Text style={styles.instructionItem}>• Don't worry about perfect grammar - focus on fluency</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setShowInstructions(false)}>
                <Text style={styles.closeButtonText}>Got it</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Question Card */}
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.partBadge}>
                <Text style={styles.partBadgeText}>Part {question.part}</Text>
              </View>
              <Pressable style={styles.audioButton}>
                <IconSymbol name="speaker.wave.2.fill" size={20} color="#3BB9F0" />
              </Pressable>
            </View>
            <Text style={styles.questionText}>{question.question_text}</Text>
          </View>

          {/* Recording Section */}
          <View style={styles.recordingCard}>

            {/* STATE 1: Before Recording - Show mic button */}
            {!isRecordingSession && !recordingUri && (
              <View style={styles.initialState}>
                <Text style={styles.instructionText}>Tap the microphone to start recording</Text>
                <Pressable
                  style={styles.bigMicButton}
                  onPress={handleRecordToggle}
                >
                  <IconSymbol name="mic.fill" size={64} color="#fff" />
                </Pressable>
                <Text style={styles.hintText}>Hold and speak clearly</Text>
              </View>
            )}

            {/* STATE 2: While Recording - Show timer, waveform, cancel & stop */}
            {isRecordingSession && !recordingUri && (
              <View style={styles.recordingState}>
                <View style={styles.recordingHeader}>
                  <View style={styles.recordingIndicator}>
                    <View style={[styles.redDot, isPausedManual && styles.pausedDot]} />
                    <Text style={[styles.recordingText, isPausedManual && styles.pausedTextHeader]}>
                      {isPausedManual ? 'Paused' : 'Recording...'}
                    </Text>
                  </View>
                  <Text style={styles.recordingTimer}>{formatTime(time)}</Text>
                </View>

                {/* Waveform visualization */}
                <View style={styles.recordingWaveform}>
                  {isPausedManual ? (
                    <View style={styles.pausedIndicator}>
                      <IconSymbol name="pause.fill" size={32} color="#999" />
                      <Text style={styles.pausedText}>Paused - Tap resume to continue</Text>
                    </View>
                  ) : (
                    <View style={styles.waveformBars}>
                      {[...Array(30)].map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.waveformBar,
                            styles.recordingWaveformBarActive,
                            { height: `${Math.random() * 60 + 40}%` }
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>

                {/* Recording controls */}
                <View style={styles.recordingControls}>
                  <Pressable style={styles.cancelButton} onPress={handleReset}>
                    <IconSymbol name="xmark.circle.fill" size={32} color="#FF6B6B" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={styles.pauseRecordButton}
                    onPress={handlePause}
                  >
                    <IconSymbol
                      name={isPausedManual ? 'play.circle.fill' : 'pause.circle.fill'}
                      size={40}
                      color="#3BB9F0"
                    />
                  </Pressable>

                  <Pressable
                    style={styles.stopButton}
                    onPress={handleRecordToggle}
                  >
                    <IconSymbol name="stop.circle.fill" size={32} color="#4CAF50" />
                    <Text style={styles.stopButtonText}>Done</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* STATE 3: After Recording - Show audio player */}
            {recordingUri && !isRecordingSession && (
              <View style={styles.playbackState}>
                <View style={styles.audioMessageContainer}>
                  <Pressable
                    style={[styles.playPauseButton, playerStatus.playing && styles.playPauseButtonPlaying]}
                    onPress={handlePlayPause}
                  >
                    <IconSymbol
                      name={playerStatus.playing ? "pause.fill" : "play.fill"}
                      size={28}
                      color="#fff"
                    />
                  </Pressable>

                  <View style={styles.audioInfo}>
                    <View style={styles.playbackWaveform}>
                      <View style={styles.waveformBars}>
                        {[...Array(40)].map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.playbackWaveformBar,
                              playerStatus.playing && i % 3 === 0 && styles.playbackWaveformBarActive,
                              { height: `${Math.random() * 50 + 30}%` }
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.audioDuration}>
                      {playerStatus.playing
                        ? `${Math.floor(playerStatus.currentTime)}s / ${Math.floor(playerStatus.duration || 0)}s`
                        : `${Math.floor(playerStatus.duration || 0)}s`}
                    </Text>
                  </View>

                  <Pressable style={styles.deleteButton} onPress={handleReset}>
                    <IconSymbol name="trash.fill" size={22} color="#FF6B6B" />
                  </Pressable>
                </View>

                <Pressable style={styles.sendButton} onPress={handleSave}>
                  <Text style={styles.sendButtonText}>Submit to AI Analysis</Text>
                  <IconSymbol name="arrow.right.circle.fill" size={24} color="#fff" />
                </Pressable>
              </View>
            )}

          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{topicTitle}</Text>
          <Text style={styles.headerSubtitle}>Practice questions</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.partBadge}>
              <Text style={styles.partBadgeText}>Part {question.part}</Text>
            </View>
            <Pressable style={styles.audioButton}>
              <IconSymbol name="speaker.wave.2.fill" size={20} color="#3BB9F0" />
            </Pressable>
          </View>
          <Text style={styles.questionText}>{question.question_text}</Text>
        </View>

        {/* Start Practice Button */}
        <Pressable style={styles.startPracticeButton} onPress={handleStartPractice}>
          <IconSymbol name="mic.fill" size={24} color="#fff" />
          <Text style={styles.startPracticeText}>Start New Practice</Text>
        </Pressable>

        {/* Your Records Section */}
        <View style={styles.recordsSection}>
          <Text style={styles.recordsTitle}>Your Records</Text>
          <Text style={styles.recordsSubtitle}>Track your IELTS speaking practice progress</Text>

          {practiceRecords.map((record, index) => (
            <View key={record.id} style={styles.recordItem}>
              <View style={styles.recordMainInfo}>
                <View style={styles.recordInfoItem}>
                  <IconSymbol name="calendar" size={18} color="#666" />
                  <Text style={styles.recordInfoText}>{record.date}</Text>
                </View>

                <View style={styles.recordInfoItem}>
                  <IconSymbol name="clock" size={18} color="#666" />
                  <Text style={styles.recordInfoText}>{record.time}</Text>
                </View>

                <View style={styles.recordInfoItem}>
                  <IconSymbol name="play.fill" size={18} color="#666" />
                  <Text style={styles.recordInfoText}>{record.duration}</Text>
                </View>

                <View style={[
                  styles.ratingBadge,
                  record.rating < 7 ? styles.ratingBadgeYellow : styles.ratingBadgeBlue
                ]}>
                  <IconSymbol name="star.fill" size={14} color="#fff" />
                  <Text style={styles.ratingText}>{record.rating}/{record.maxRating}</Text>
                </View>

                <Pressable
                  style={styles.expandButton}
                  onPress={() => toggleRecordExpand(record.id)}
                >
                  <IconSymbol
                    name={expandedRecords.includes(record.id) ? "chevron.up" : "chevron.down"}
                    size={20}
                    color="#666"
                  />
                </Pressable>
              </View>

              {expandedRecords.includes(record.id) && record.feedback && (
                <View style={styles.recordExpandedContent}>
                  {/* Fluency */}
                  <View style={styles.feedbackItem}>
                    <View style={styles.feedbackHeader}>
                      <Text style={styles.feedbackTitle}>Fluency</Text>
                      <View style={[
                        styles.feedbackScoreBadge,
                        record.feedback.fluency.score >= 8 ? styles.feedbackScoreBadgeGreen : styles.feedbackScoreBadgeBlue
                      ]}>
                        <Text style={styles.feedbackScoreText}>{record.feedback.fluency.score}/9</Text>
                      </View>
                    </View>
                    <Text style={styles.feedbackDescription}>{record.feedback.fluency.description}</Text>
                  </View>

                  {/* Vocabulary */}
                  <View style={styles.feedbackItem}>
                    <View style={styles.feedbackHeader}>
                      <Text style={styles.feedbackTitle}>Vocabulary</Text>
                      <View style={[
                        styles.feedbackScoreBadge,
                        record.feedback.vocabulary.score >= 8 ? styles.feedbackScoreBadgeGreen : styles.feedbackScoreBadgeBlue
                      ]}>
                        <Text style={styles.feedbackScoreText}>{record.feedback.vocabulary.score}/9</Text>
                      </View>
                    </View>
                    <Text style={styles.feedbackDescription}>{record.feedback.vocabulary.description}</Text>
                  </View>

                  {/* Grammar */}
                  <View style={styles.feedbackItem}>
                    <View style={styles.feedbackHeader}>
                      <Text style={styles.feedbackTitle}>Grammar</Text>
                      <View style={[
                        styles.feedbackScoreBadge,
                        record.feedback.grammar.score >= 8 ? styles.feedbackScoreBadgeGreen : styles.feedbackScoreBadgeBlue
                      ]}>
                        <Text style={styles.feedbackScoreText}>{record.feedback.grammar.score}/9</Text>
                      </View>
                    </View>
                    <Text style={styles.feedbackDescription}>{record.feedback.grammar.description}</Text>
                  </View>

                  {/* Pronunciation */}
                  <View style={styles.feedbackItem}>
                    <View style={styles.feedbackHeader}>
                      <Text style={styles.feedbackTitle}>Pronunciation</Text>
                      <View style={[
                        styles.feedbackScoreBadge,
                        record.feedback.pronunciation.score >= 8 ? styles.feedbackScoreBadgeGreen : styles.feedbackScoreBadgeBlue
                      ]}>
                        <Text style={styles.feedbackScoreText}>{record.feedback.pronunciation.score}/9</Text>
                      </View>
                    </View>
                    <Text style={styles.feedbackDescription}>{record.feedback.pronunciation.description}</Text>
                  </View>

                  {/* Overall Feedback */}
                  <View style={styles.overallFeedbackBox}>
                    <Text style={styles.overallFeedbackTitle}>Overall Feedback</Text>
                    <Text style={styles.overallFeedbackText}>{record.feedback.overall}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  infoButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#3BB9F0',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  partBadge: {
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  partBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F6FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  hintText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructionsList: {
    gap: 8,
    marginBottom: 4,
  },
  instructionItem: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  recordingCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    minHeight: 300,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },

  // STATE 1: Initial/Before Recording
  initialState: {
    alignItems: 'center',
    gap: 24,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  bigMicButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // STATE 2: While Recording
  recordingState: {
    gap: 24,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
  },
  pausedDot: {
    backgroundColor: '#FF9800',
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  pausedTextHeader: {
    color: '#FF9800',
  },
  recordingTimer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
  },
  recordingWaveform: {
    height: 100,
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  recordingWaveformBarActive: {
    backgroundColor: '#FF6B6B',
  },
  pausedIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  pausedText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButton: {
    alignItems: 'center',
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  pauseRecordButton: {
    padding: 8,
  },
  stopButton: {
    alignItems: 'center',
    gap: 6,
  },
  stopButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  // STATE 3: Playback/After Recording
  playbackState: {
    gap: 20,
  },
  audioMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  playPauseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3BB9F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3BB9F0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  playPauseButtonPlaying: {
    backgroundColor: '#2196F3',
  },
  audioInfo: {
    flex: 1,
    gap: 8,
  },
  playbackWaveform: {
    height: 40,
    justifyContent: 'center',
  },
  playbackWaveformBar: {
    width: 3,
    backgroundColor: '#B3D9F2',
    borderRadius: 2,
  },
  playbackWaveformBarActive: {
    backgroundColor: '#3BB9F0',
  },
  audioDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Common waveform styles
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  recordsSection: {
    marginTop: 20,
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  recordsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  recordItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  recordMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  recordInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordInfoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  ratingBadgeBlue: {
    backgroundColor: '#3BB9F0',
  },
  ratingBadgeYellow: {
    backgroundColor: '#FFB800',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  expandButton: {
    padding: 4,
  },
  recordExpandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  expandedText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  feedbackItem: {
    marginBottom: 16,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  feedbackScoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  feedbackScoreBadgeBlue: {
    backgroundColor: '#3BB9F0',
  },
  feedbackScoreBadgeGreen: {
    backgroundColor: '#4CAF50',
  },
  feedbackScoreText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  overallFeedbackBox: {
    backgroundColor: '#E8F6FC',
    borderWidth: 1,
    borderColor: '#3BB9F0',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  overallFeedbackTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  overallFeedbackText: {
    fontSize: 14,
    color: '#3BB9F0',
    lineHeight: 20,
  },
  startPracticeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  startPracticeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3BB9F0',
    borderRadius: 25,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
