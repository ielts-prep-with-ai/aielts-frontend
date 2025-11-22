import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TestQuestionScreen() {
  const router = useRouter();
  const { testId, mode, testSessionId, part1, part2, part3, startTime, endTime, timeLimit, startFromPart } = useLocalSearchParams();

  const initialPart = startFromPart ? parseInt(startFromPart as string) : 1;
  const [currentPart, setCurrentPart] = useState(initialPart);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lottieRef = useRef<LottieView>(null);

  // Parse question IDs from params
  const part1Questions = part1 ? JSON.parse(part1 as string) : [];
  const part2Questions = part2 ? JSON.parse(part2 as string) : [];
  const part3Questions = part3 ? JSON.parse(part3 as string) : [];

  // Mock questions data (replace with actual data from API)
  const questions = {
    part1: [
      "What's your full name?",
      "Where are you from?",
      "Do you work or study?",
      "What do you do in your free time?",
    ],
    part2: [
      "Describe a place you like to visit. You should say:\n- Where it is\n- How often you go there\n- What you do there\n- And explain why you like this place",
    ],
    part3: [
      "How has technology changed the way people travel?",
      "What are the benefits of traveling to different countries?",
      "Do you think tourism has a positive or negative impact on local communities?",
    ],
  };

  const getCurrentQuestions = () => {
    if (currentPart === 1) return questions.part1;
    if (currentPart === 2) return questions.part2;
    return questions.part3;
  };

  const currentQuestions = getCurrentQuestions();
  const currentQuestionText = currentQuestions[currentQuestion];

  // Control Lottie animation based on speaking state
  useEffect(() => {
    if (lottieRef.current) {
      if (isSpeaking) {
        lottieRef.current.play();
      } else {
        lottieRef.current.pause();
        lottieRef.current.reset();
      }
    }
  }, [isSpeaking]);

  // Auto-speak question when it changes
  useEffect(() => {
    speakQuestion(currentQuestionText);
    return () => {
      Speech.stop();
    };
  }, [currentQuestion, currentPart]);

  const speakQuestion = async (text: string) => {
    setIsSpeaking(true);
    
    // Clean up text for speech (remove bullet points formatting)
    const cleanText = text.replace(/\n-/g, '. ').replace(/\n/g, ' ');
    
    Speech.speak(cleanText, {
      voice: 'com.apple.ttsbundle.Daniel-compact',
      language: 'en-US',
      pitch: 1.0,
      rate: 0.5,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecord = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }
    setIsRecording(!isRecording);
    if (!isRecording) setRecordingTime(0);
  };

  const handleReplayQuestion = () => {
    if (isRecording) {
      setIsRecording(false);
    }
    speakQuestion(currentQuestionText);
  };

  const handleNextQuestion = () => {
    Speech.stop();
    setIsSpeaking(false);
    
    if (currentQuestion < currentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setIsRecording(false);
      setRecordingTime(0);
    } else if (currentPart < 3) {
      if (currentPart === 1) {
        router.push({
          pathname: '/mock-test/part2-topic',
          params: { testId, mode, testSessionId, part1, part2, part3, startTime, endTime, timeLimit },
        });
      } else {
        setCurrentPart(currentPart + 1);
        setCurrentQuestion(0);
        setIsRecording(false);
        setRecordingTime(0);
      }
    } else {
      router.push({
        pathname: '/mock-test/test-complete',
        params: { testId, testSessionId },
      });
    }
  };

  const getPartTitle = () => {
    if (currentPart === 1) return 'Introduction and interview';
    if (currentPart === 2) return 'Individual long turn';
    return 'Two-way discussion';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>AI Mock Test</Text>
        <View style={styles.timerBadge}>
          <Text style={styles.timerBadgeText}>{formatTime(recordingTime)}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Part Info */}
        <View style={styles.partInfo}>
          <Text style={styles.partNumber}>Part {currentPart}</Text>
          <Text style={styles.partTitle}>{getPartTitle()}</Text>
        </View>

        {/* Question Text */}
        <View style={styles.questionBubble}>
          <Text style={styles.questionText}>{currentQuestionText}</Text>
          <Pressable style={styles.replayButton} onPress={handleReplayQuestion}>
            <IconSymbol name="speaker.wave.2.fill" size={18} color="#3BB9F0" />
          </Pressable>
        </View>

        {/* AI Examiner Avatar */}
        <View style={styles.examinerSection}>
          <View style={styles.lottieContainer}>
            <LottieView
              ref={lottieRef}
              source={require('@/assets/animations/ai-examiner.json')}
              style={styles.lottieAvatar}
              loop={true}
              autoPlay={false}
            />
          </View>
          <Text style={styles.examinerLabel}>
            {isSpeaking ? 'AI Examiner is speaking...' : 'AI Examiner'}
          </Text>
        </View>

        {/* Recording Controls */}
        <View style={styles.recordingSection}>
          <View style={[styles.recordingLine, isRecording && styles.recordingLineActive]} />
          <Pressable
            style={[styles.micButton, isRecording && styles.micButtonActive]}
            onPress={handleRecord}
          >
            <IconSymbol name={isRecording ? "stop.fill" : "mic.fill"} size={32} color={isRecording ? "#fff" : "#FF6B6B"} />
          </Pressable>
          <View style={[styles.recordingLine, isRecording && styles.recordingLineActive]} />
        </View>

        <Text style={styles.recordingLabel}>
          {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
        </Text>

        {/* Next Button */}
        <Pressable style={styles.nextButton} onPress={handleNextQuestion}>
          <Text style={styles.nextButtonText}>Next question</Text>
        </Pressable>

        {/* Part Navigation */}
        <View style={styles.partNavigation}>
          {[1, 2, 3].map((part) => (
            <Pressable
              key={part}
              style={[styles.partTab, currentPart === part && styles.partTabActive]}
              onPress={() => {
                Speech.stop();
                setCurrentPart(part);
                setCurrentQuestion(0);
                setIsRecording(false);
                setRecordingTime(0);
              }}
            >
              <Text style={[styles.partTabText, currentPart === part && styles.partTabTextActive]}>
                Part {part}
              </Text>
            </Pressable>
          ))}
        </View>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', flex: 1 },
  timerBadge: { backgroundColor: '#FF6B6B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  timerBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 120, alignItems: 'center' },
  partInfo: { alignItems: 'center', marginBottom: 20 },
  partNumber: { fontSize: 28, fontWeight: 'bold', color: '#1a3a5c' },
  partTitle: { fontSize: 14, color: '#666', marginTop: 4 },
  questionBubble: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%',
    marginBottom: 24, flexDirection: 'row', alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  questionText: { flex: 1, fontSize: 16, color: '#333', lineHeight: 24 },
  replayButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F6FC',
    justifyContent: 'center', alignItems: 'center', marginLeft: 12,
  },
  examinerSection: { alignItems: 'center', marginBottom: 32 },
  lottieContainer: {
    width: 150, height: 150, borderRadius: 75, backgroundColor: '#E8F6FC',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: '#3BB9F0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
    overflow: 'hidden',
  },
  lottieAvatar: { width: 140, height: 140 },
  examinerLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  recordingSection: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    marginBottom: 8, gap: 16,
  },
  recordingLine: { flex: 1, height: 3, backgroundColor: '#FFD0D0', borderRadius: 2 },
  recordingLineActive: { backgroundColor: '#FF6B6B' },
  micButton: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFE5E5',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  micButtonActive: { backgroundColor: '#FF6B6B' },
  recordingLabel: { fontSize: 14, color: '#666', marginBottom: 24 },
  nextButton: {
    backgroundColor: '#FF8C00', borderRadius: 25, paddingVertical: 14,
    paddingHorizontal: 40, marginBottom: 32,
  },
  nextButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  partNavigation: { flexDirection: 'row', gap: 12 },
  partTab: {
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#fff',
  },
  partTabActive: { borderColor: '#FF8C00', backgroundColor: '#FFF5E6' },
  partTabText: { fontSize: 14, fontWeight: '600', color: '#999' },
  partTabTextActive: { color: '#FF8C00' },
});