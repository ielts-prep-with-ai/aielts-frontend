import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';

export default function TestSetupScreen() {
  const router = useRouter();
  const { testId, mode, parts, timeLimit } = useLocalSearchParams();

  const [headphoneChecked, setHeadphoneChecked] = useState(false);
  const [microphoneChecked, setMicrophoneChecked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
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
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayHeadphone = () => {
    // TODO: Implement headphone audio playback
    setHeadphoneChecked(true);
  };

  const handleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingTime(0);
    } else {
      setIsRecording(false);
      setMicrophoneChecked(true);
    }
  };

  const handlePlayRecording = () => {
    // TODO: Implement recording playback
    setAudioPlaying(!audioPlaying);
  };

  const handleGoNow = () => {
    // Navigate to actual test
    console.log('Starting test with params:', { testId, mode, parts, timeLimit });
    router.push({
      pathname: '/mock-test/test-question',
      params: {
        testId,
        mode,
        parts,
        timeLimit,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>AI Mock Test</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.pageTitle}>IELTS SPEAKING TEST</Text>

        {/* Step 1: Headphone Check */}
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <View style={[styles.checkbox, headphoneChecked && styles.checkboxChecked]}>
              {headphoneChecked && <IconSymbol name="checkmark" size={16} color="#4CAF50" />}
            </View>
            <View style={styles.verticalLine} />
          </View>

          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>1. Headphone check</Text>
            <Text style={styles.stepDescription}>
              Make sure your headphone's audio is good enough before taking the test. Please click on the icon 🔊 to check the sound quality.
            </Text>

            {/* Audio Player */}
            <View style={styles.audioPlayer}>
              <Pressable style={styles.playButton} onPress={handlePlayHeadphone}>
                <IconSymbol name={audioPlaying ? "pause.fill" : "play.fill"} size={20} color="#000" />
              </Pressable>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
              <Text style={styles.timeText}>00:08</Text>
            </View>
          </View>
        </View>

        {/* Step 2: Microphone Check */}
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <View style={[styles.checkbox, microphoneChecked && styles.checkboxChecked]}>
              {microphoneChecked && <IconSymbol name="checkmark" size={16} color="#4CAF50" />}
            </View>
            <View style={styles.verticalLine} />
          </View>

          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>2. Microphone check</Text>
            <Text style={styles.stepDescription}>
              Make sure your microphone works well before taking the test. Please click on the icon Record 🔴 and read out loud the below text then click on icon 🔊 to listen again.
            </Text>

            {/* Recording Controls */}
            <View style={styles.recordingPlayer}>
              <Pressable
                style={[styles.recButton, isRecording && styles.recButtonActive]}
                onPress={handleRecord}
              >
                <View style={styles.recDot} />
                <Text style={styles.recText}>REC</Text>
              </Pressable>

              {recordingTime > 0 && (
                <>
                  <Pressable style={styles.playButton} onPress={handlePlayRecording}>
                    <IconSymbol name="play.fill" size={20} color="#000" />
                  </Pressable>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, styles.progressFillRed]} />
                  </View>
                </>
              )}
              <Text style={styles.timeText}>{formatTime(recordingTime)}</Text>
            </View>
          </View>
        </View>

        {/* Step 3: Waiting Room */}
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <View style={styles.checkbox} />
          </View>

          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>3. Waiting room</Text>
            <Text style={styles.stepDescription}>
              The examiner has entered the meeting. You are being connected...
            </Text>
          </View>
        </View>

        {/* Ready Button */}
        <Pressable
          style={[styles.readyButton, (!headphoneChecked || !microphoneChecked) && styles.readyButtonDisabled]}
          onPress={handleGoNow}
          disabled={!headphoneChecked || !microphoneChecked}
        >
          <Text style={styles.readyButtonText}>I'M READY. GO NOW!</Text>
        </Pressable>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepHeader: {
    alignItems: 'center',
    marginRight: 16,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#4CAF50',
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  recordingPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  recButtonActive: {
    backgroundColor: '#FFE5E5',
  },
  recDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
  },
  recText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#FFE5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '30%',
    height: '100%',
    backgroundColor: '#FFB0B0',
  },
  progressFillRed: {
    backgroundColor: '#FF6B6B',
  },
  timeText: {
    fontSize: 13,
    color: '#666',
    minWidth: 40,
    textAlign: 'right',
  },
  readyButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  readyButtonDisabled: {
    opacity: 0.5,
  },
  readyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
