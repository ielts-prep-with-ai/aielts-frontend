import { IconSymbol } from '@/components/ui/icon-symbol';
import { ApiService } from '@/services/api.service';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface StartTestResponse {
  test_session_id: string;
  part1: number[];
  part2: number[];
  part3: number[];
  start_time: string;
  end_time: string;
  time_limit: string;
}

type Step = 'headphone' | 'microphone' | 'waiting';

export default function MicrophoneTestScreen() {
  const router = useRouter();
  const { testId, testConfig } = useLocalSearchParams<{ testId: string; testConfig: string }>();
  
  const config = testConfig ? JSON.parse(testConfig) : null;
  const isSimulation = config?.mode === 'simulation';

  const [currentStep, setCurrentStep] = useState<Step>('headphone');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [waitingCountdown, setWaitingCountdown] = useState(5);
  const [showReadyButton, setShowReadyButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  // Waiting room countdown for simulation mode
  useEffect(() => {
    if (currentStep === 'waiting' && isSimulation) {
      const timer = setInterval(() => {
        setWaitingCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowReadyButton(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep, isSimulation]);

  const handlePlayAudio = async () => {
    setIsPlayingAudio(true);
    setAudioProgress(0);
    
    const text = "Hello, I am your AI examiner. Do you hear me clearly?";
    
    // Animate progress bar over 5 seconds
    const duration = 5000;
    const interval = 100;
    let elapsed = 0;
    
    const progressInterval = setInterval(() => {
      elapsed += interval;
      setAudioProgress(elapsed / duration);
      if (elapsed >= duration) {
        clearInterval(progressInterval);
      }
    }, interval);

    Speech.speak(text, {
      language: 'en-US',
      rate: 0.9,
      pitch: 1.0,
      onDone: () => {
        clearInterval(progressInterval);
        setIsPlayingAudio(false);
        setAudioProgress(1);
        setCurrentStep('microphone');
      },
      onError: () => {
        clearInterval(progressInterval);
        setIsPlayingAudio(false);
        setCurrentStep('microphone');
      },
    });
  };

  const handleStartRecording = async () => {
    try {
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission is required');
        return;
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setIsRecording(true);
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;

      // Auto-stop after 5 seconds
      setTimeout(async () => {
        await handleStopRecording();
      }, 5000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      const status = await recordingRef.current.getStatusAsync();
      if (status.canRecord) {
        await recordingRef.current.stopAndUnloadAsync();
      }
      const uri = recordingRef.current.getURI();
      setRecordingUri(uri);
      recordingRef.current = null;
      setIsRecording(false);
      setHasRecorded(true);
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (err) {
      console.error('Error stopping recording:', err);
      setIsRecording(false);
    }
  };

  const handlePlayRecording = async () => {
    if (!recordingUri) return;

    setIsPlayingRecording(true);
    
    try {
      // Unload previous sound if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingRecording(false);
            if (isSimulation) {
              setCurrentStep('waiting');
            }
          }
        }
      );
      soundRef.current = sound;
    } catch (err) {
      console.error('Error playing recording:', err);
      setIsPlayingRecording(false);
    }
  };

  const startTestAndNavigate = async () => {
    if (!config) {
      setError('Test configuration not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[MicTest] Starting test:', config);
      const response = await ApiService.post<any>('/start_test', config);
      console.log('[MicTest] Test started - Full response:', response);

      // Handle both part1/part2/part3 and part_1/part_2/part_3 formats
      const part1 = response.part1 || response.part_1 || [];
      const part2 = response.part2 || response.part_2 || [];
      const part3 = response.part3 || response.part_3 || [];

      console.log('[MicTest] Parsed parts:', { part1, part2, part3 });

      router.push({
        pathname: '/mock-test/test-question',
        params: {
          testId,
          mode: config.mode,
          testSessionId: response.test_session_id,
          part1: JSON.stringify(part1),
          part2: JSON.stringify(part2),
          part3: JSON.stringify(part3),
          startTime: response.start_time,
          endTime: response.end_time,
          timeLimit: response.time_limit,
        },
      });
    } catch (err: any) {
      console.error('[MicTest] Error starting test:', err);
      setError(err?.message || 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Only available in practice mode
    startTestAndNavigate();
  };

  const handleReady = () => {
    startTestAndNavigate();
  };

  const renderStepIndicator = (step: Step, number: number, label: string) => {
    const isActive = currentStep === step;
    const isPast = (step === 'headphone' && currentStep !== 'headphone') ||
                   (step === 'microphone' && currentStep === 'waiting');
    
    return (
      <View style={styles.stepIndicator}>
        <View style={[styles.stepCircle, isActive && styles.stepCircleActive, isPast && styles.stepCirclePast]}>
          <IconSymbol 
            name={step === 'headphone' ? 'headphones' : step === 'microphone' ? 'mic.fill' : 'clock.fill'} 
            size={20} 
            color={isActive || isPast ? '#8B1E3F' : '#999'} 
          />
        </View>
        <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{number}. {label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>IELTS SPEAKING TEST</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Step 1: Headphone Check */}
        <View style={[styles.stepCard, currentStep !== 'headphone' && styles.stepCardInactive]}>
          {renderStepIndicator('headphone', 1, 'Headphone check')}
          <Text style={styles.stepDescription}>
            Make sure your headphone's audio is good enough before taking the test. Please click on the icon ▶ to check the sound quality.
          </Text>
          <View style={styles.audioPlayer}>
            <Pressable 
              style={styles.playButton} 
              onPress={handlePlayAudio}
              disabled={currentStep !== 'headphone' || isPlayingAudio}
            >
              <IconSymbol name={isPlayingAudio ? 'pause.fill' : 'play.fill'} size={24} color="#fff" />
            </Pressable>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${audioProgress * 100}%` }]} />
            </View>
            <Text style={styles.duration}>00:08</Text>
          </View>
        </View>

        {/* Step 2: Microphone Check */}
        <View style={[styles.stepCard, currentStep !== 'microphone' && styles.stepCardInactive]}>
          {renderStepIndicator('microphone', 2, 'Microphone check')}
          <Text style={styles.stepDescription}>
            Make sure your microphone works well before taking the test. Please click on the icon Record 🔴 and read out loud the below text then click on icon ▶ to listen again.
          </Text>
          <Text style={styles.readOutLabel}>Please read out loud:</Text>
          <Text style={styles.readOutText}>"I love English. My English is great and I practice it everyday!"</Text>
          
          <View style={styles.recorderContainer}>
            <Pressable 
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={isRecording ? handleStopRecording : handleStartRecording}
              disabled={currentStep !== 'microphone'}
            >
              <View style={[styles.recordDot, isRecording && styles.recordDotPulsing]} />
              <Text style={styles.recordText}>
                {isRecording ? 'Stop' : 'REC'}
              </Text>
            </Pressable>
            
            {hasRecorded && (
              <Pressable 
                style={styles.playRecordingButton}
                onPress={handlePlayRecording}
                disabled={isPlayingRecording || isRecording}
              >
                <IconSymbol name={isPlayingRecording ? 'pause.fill' : 'play.fill'} size={20} color="#8B1E3F" />
                <Text style={styles.playRecordingText}>
                  {isPlayingRecording ? 'Playing...' : 'Listen'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Ready button for practice mode */}
          {!isSimulation && hasRecorded && !isPlayingRecording && (
            <Pressable 
              style={[styles.readyButton, loading && styles.readyButtonDisabled]}
              onPress={handleReady}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.readyButtonText}>I'm Ready</Text>}
            </Pressable>
          )}
        </View>

        {/* Step 3: Waiting Room (Simulation only) */}
        {isSimulation && (
          <View style={[styles.stepCard, currentStep !== 'waiting' && styles.stepCardInactive]}>
            {renderStepIndicator('waiting', 3, 'Waiting room')}
            <Text style={styles.stepDescription}>
              You are in the waiting room now. The examiner will enter the meeting soon. Please wait for a while.
            </Text>
            
            {currentStep === 'waiting' && (
              <View style={styles.waitingContent}>
                {!showReadyButton ? (
                  <View style={styles.countdownContainer}>
                    <ActivityIndicator size="large" color="#8B1E3F" />
                    <Text style={styles.countdownText}>Please wait... {waitingCountdown}s</Text>
                  </View>
                ) : (
                  <Pressable 
                    style={[styles.readyButton, loading && styles.readyButtonDisabled]}
                    onPress={handleReady}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.readyButtonText}>I'm Ready</Text>}
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}

        {/* Skip button for practice mode only */}
        {!isSimulation && (
          <Pressable 
            style={[styles.skipButton, loading && styles.skipButtonDisabled]}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Skip & Start Test</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff',
  },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a3a5c' },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 100 },
  errorContainer: { backgroundColor: '#FFE8E8', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#D32F2F', fontSize: 14, textAlign: 'center' },
  stepCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: '#8B1E3F',
  },
  stepCardInactive: { opacity: 0.5, borderLeftColor: '#ccc' },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  stepCircleActive: { backgroundColor: '#FFE5E5' },
  stepCirclePast: { backgroundColor: '#E8F5E9' },
  stepLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  stepLabelActive: { color: '#8B1E3F' },
  stepDescription: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },
  audioPlayer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a3a5c',
    justifyContent: 'center', alignItems: 'center',
  },
  progressBar: { flex: 1, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#8B1E3F', borderRadius: 2 },
  duration: { fontSize: 12, color: '#666' },
  readOutLabel: { fontSize: 14, color: '#666', marginTop: 8 },
  readOutText: { fontSize: 15, fontStyle: 'italic', color: '#333', marginVertical: 12 },
  recorderContainer: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  recordButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd',
  },
  recordButtonActive: { borderColor: '#FF6B6B', backgroundColor: '#FFF5F5' },
  recordDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF6B6B' },
  recordDotPulsing: { backgroundColor: '#FF0000' },
  recordText: { fontSize: 14, color: '#FF6B6B', fontWeight: '600' },
  playRecordingButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playRecordingText: { fontSize: 14, color: '#8B1E3F' },
  waitingContent: { alignItems: 'center', paddingVertical: 20 },
  countdownContainer: { alignItems: 'center', gap: 12 },
  countdownText: { fontSize: 16, color: '#666' },
  readyButton: {
    backgroundColor: '#4CAF50', borderRadius: 25, paddingVertical: 14,
    paddingHorizontal: 32, alignItems: 'center', marginTop: 16,
  },
  readyButtonDisabled: { opacity: 0.7 },
  readyButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  skipButton: {
    backgroundColor: '#FF8C00', borderRadius: 25, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  skipButtonDisabled: { opacity: 0.7 },
  skipButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});