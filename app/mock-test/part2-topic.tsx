import { StyleSheet, ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { QuestionsService } from '@/services/questions.service';
import { QuestionDetail } from '@/services/types';

interface ParsedTopic {
  title: string;
  points: string[];
}

export default function Part2TopicScreen() {
  const router = useRouter();
  const { testId, mode, parts, timeLimit, questionId } = useLocalSearchParams<{
    testId: string;
    mode: string;
    parts: string;
    timeLimit: string;
    questionId: string;
  }>();

  const [isThinking, setIsThinking] = useState(false);
  const [thinkingTime, setThinkingTime] = useState(60);
  const [topic, setTopic] = useState<ParsedTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch and parse Part 2 question from API
  useEffect(() => {
    const fetchQuestion = async () => {
      if (!questionId) {
        setError('No question ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const question = await QuestionsService.getQuestion(Number(questionId));

        // Parse the question text to extract topic and bullet points
        const parsedTopic = parseQuestionText(question.question_text);
        setTopic(parsedTopic);
        setError(null);
      } catch (err: any) {
        console.error('[Part2Topic] Error fetching question:', err);
        setError(err?.message || 'Failed to load question');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  // Parse Part 2 question text into title and bullet points
  const parseQuestionText = (text: string): ParsedTopic => {
    // Expected format: "Describe... You should say: point1, point2, point3"
    // Or with newlines/bullets
    const parts = text.split(/you should say:|You should say:/i);

    if (parts.length < 2) {
      // Fallback if format doesn't match
      return {
        title: text,
        points: []
      };
    }

    const title = parts[0].trim();
    const pointsText = parts[1].trim();

    // Split by common separators (bullets, newlines, numbered lists, commas)
    const points = pointsText
      .split(/[•\n\d+\.\-,]/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return { title, points };
  };

  useEffect(() => {
    if (isThinking && thinkingTime > 0) {
      timerRef.current = setInterval(() => {
        setThinkingTime((prev) => {
          if (prev <= 1) {
            // Time's up, navigate to test question
            clearInterval(timerRef.current!);
            navigateToQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isThinking]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartThinking = () => {
    setIsThinking(true);
  };

  const navigateToQuestion = () => {
    router.push({
      pathname: '/mock-test/test-question',
      params: {
        testId,
        mode,
        parts,
        timeLimit,
        startFromPart: '2',
      },
    });
  };

  const handleNextQuestion = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    navigateToQuestion();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Mock Test</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3BB9F0" />
          <Text style={styles.loadingText}>Loading Part 2 topic...</Text>
        </View>
      </View>
    );
  }

  if (error || !topic) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>AI Mock Test</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Failed to load topic'}</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
          <Text style={styles.partNumber}>Part 2</Text>
          <Text style={styles.partSubtitle}>Topic</Text>
        </View>

        {/* Topic Card */}
        <View style={styles.topicCard}>
          {/* Empty space for visual design */}
        </View>

        {/* Question Section */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>{topic.title}</Text>
          {topic.points.length > 0 && (
            <>
              <Text style={styles.questionSubtitle}>You should say:</Text>

              {/* Bullet Points */}
              <View style={styles.bulletPointsContainer}>
                {topic.points.map((point, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{point}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Recording Section */}
        <View style={styles.recordingSection}>
          {/* Recording Line Left */}
          <View style={styles.recordingLine} />

          {/* Microphone Button */}
          <View style={styles.micButton}>
            <IconSymbol name="mic.fill" size={32} color="#FF6B6B" />
          </View>

          {/* Recording Line Right */}
          <View style={styles.recordingLine} />
        </View>

        {/* Timer */}
        <Text style={styles.timer}>{formatTime(thinkingTime)}</Text>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          {!isThinking ? (
            <Pressable style={styles.thinkButton} onPress={handleStartThinking}>
              <Text style={styles.thinkButtonText}>Time to think: 60s</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.thinkButton, styles.thinkButtonActive]}
              disabled={true}
            >
              <Text style={styles.thinkButtonText}>Thinking... {thinkingTime}s</Text>
            </Pressable>
          )}

          <Pressable style={styles.nextButton} onPress={handleNextQuestion}>
            <Text style={styles.nextButtonText}>Next question</Text>
          </Pressable>
        </View>

        {/* Part Navigation */}
        <View style={styles.partNavigation}>
          <View style={styles.partTab}>
            <Text style={styles.partTabText}>Part 1</Text>
          </View>

          <View style={[styles.partTab, styles.partTabActive]}>
            <Text style={[styles.partTabText, styles.partTabTextActive]}>Part 2</Text>
          </View>

          <View style={styles.partTab}>
            <Text style={styles.partTabText}>Part 3</Text>
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3BB9F0',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
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
    marginBottom: 4,
  },
  partSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  topicCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    height: 200,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  questionSection: {
    marginBottom: 24,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  questionSubtitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  bulletPointsContainer: {
    marginLeft: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: '#000',
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    flex: 1,
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
  timer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  thinkButton: {
    flex: 1,
    backgroundColor: '#FFB3BA',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  thinkButtonActive: {
    backgroundColor: '#FF9BA3',
  },
  thinkButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  partNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
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
