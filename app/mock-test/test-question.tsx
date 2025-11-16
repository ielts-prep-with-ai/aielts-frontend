import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';

export default function TestQuestionScreen() {
  const router = useRouter();
  const { testId, mode, parts, timeLimit, startFromPart } = useLocalSearchParams();

  const initialPart = startFromPart ? parseInt(startFromPart as string) : 1;
  const [currentPart, setCurrentPart] = useState(initialPart);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock questions data
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

  const handleRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setRecordingTime(0);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < currentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setIsRecording(false);
      setRecordingTime(0);
    } else if (currentPart < 3) {
      // Moving to next part
      if (currentPart === 1) {
        // Navigate to Part 2 topic screen
        router.push({
          pathname: '/mock-test/part2-topic',
          params: {
            testId,
            mode,
            parts,
            timeLimit,
          },
        });
      } else {
        setCurrentPart(currentPart + 1);
        setCurrentQuestion(0);
        setIsRecording(false);
        setRecordingTime(0);
      }
    } else {
      // Test complete - navigate to completion screen
      console.log('Test completed');
      router.push({
        pathname: '/mock-test/test-complete',
        params: {
          testId,
          testName: 'IELTS Mock Test 2025 February Speaking Practice Test 1',
        },
      });
    }
  };

  const getPartTitle = () => {
    if (currentPart === 1) return 'Introduction and\ninterview';
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
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Part Title */}
        <View style={styles.partTitleContainer}>
          <Text style={styles.partNumber}>Part {currentPart}</Text>
          <Text style={styles.partTitle}>{getPartTitle()}</Text>
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestionText}</Text>
        </View>

        {/* Recording Controls */}
        <View style={styles.recordingSection}>
          {/* Recording Line Left */}
          <View style={[styles.recordingLine, isRecording && styles.recordingLineActive]} />

          {/* Microphone Button */}
          <Pressable
            style={[styles.micButton, isRecording && styles.micButtonActive]}
            onPress={handleRecord}
          >
            <IconSymbol name="mic.fill" size={32} color="#FF6B6B" />
          </Pressable>

          {/* Recording Line Right */}
          <View style={[styles.recordingLine, isRecording && styles.recordingLineActive]} />
        </View>

        {/* Timer */}
        <Text style={styles.timer}>{formatTime(recordingTime)}</Text>

        {/* Next Question Button */}
        <Pressable style={styles.nextButton} onPress={handleNextQuestion}>
          <Text style={styles.nextButtonText}>Next question</Text>
        </Pressable>

        {/* Part Navigation */}
        <View style={styles.partNavigation}>
          <Pressable
            style={[styles.partTab, currentPart === 1 && styles.partTabActive]}
            onPress={() => {
              setCurrentPart(1);
              setCurrentQuestion(0);
              setIsRecording(false);
              setRecordingTime(0);
            }}
          >
            <Text style={[styles.partTabText, currentPart === 1 && styles.partTabTextActive]}>
              Part 1
            </Text>
          </Pressable>

          <Pressable
            style={[styles.partTab, currentPart === 2 && styles.partTabActive]}
            onPress={() => {
              setCurrentPart(2);
              setCurrentQuestion(0);
              setIsRecording(false);
              setRecordingTime(0);
            }}
          >
            <Text style={[styles.partTabText, currentPart === 2 && styles.partTabTextActive]}>
              Part 2
            </Text>
          </Pressable>

          <Pressable
            style={[styles.partTab, currentPart === 3 && styles.partTabActive]}
            onPress={() => {
              setCurrentPart(3);
              setCurrentQuestion(0);
              setIsRecording(false);
              setRecordingTime(0);
            }}
          >
            <Text style={[styles.partTabText, currentPart === 3 && styles.partTabTextActive]}>
              Part 3
            </Text>
          </Pressable>
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
    paddingBottom: 120,
  },
  partTitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  partNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  partTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  recordingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  recordingLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#FFD0D0',
  },
  recordingLineActive: {
    backgroundColor: '#FF6B6B',
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  micButtonActive: {
    backgroundColor: '#FFD0D0',
  },
  timer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  partNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 32,
  },
  partTab: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  partTabActive: {
    borderColor: '#FF8C00',
    backgroundColor: '#FFF5E6',
  },
  partTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  partTabTextActive: {
    color: '#FF8C00',
  },
});
