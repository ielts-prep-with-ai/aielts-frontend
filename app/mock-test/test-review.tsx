import { StyleSheet, ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { QuestionsService } from '@/services/questions.service';
import { QuestionDetail } from '@/services/types';

interface ReviewQuestion {
  questionId: number;
  part: number;
  questionText: string;
  hasRecording: boolean;
}

export default function TestReviewScreen() {
  const router = useRouter();
  const {
    testId,
    mode,
    testSessionId,
    part1,
    part2,
    part3,
    recordings,
    timeLimit
  } = useLocalSearchParams<{
    testId: string;
    mode: string;
    testSessionId: string;
    part1: string;
    part2: string;
    part3: string;
    recordings: string;
    timeLimit: string;
  }>();

  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);

      const part1Ids: number[] = part1 ? JSON.parse(part1) : [];
      const part2Ids: number[] = part2 ? JSON.parse(part2) : [];
      const part3Ids: number[] = part3 ? JSON.parse(part3) : [];
      const recordedQuestionIds: number[] = recordings ? JSON.parse(recordings) : [];

      const allQuestionIds = [...part1Ids, ...part2Ids, ...part3Ids];

      // Load all questions
      const questionPromises = allQuestionIds.map(id => QuestionsService.getQuestion(id));
      const questionDetails = await Promise.all(questionPromises);

      // Map questions to review format
      const reviewQuestions: ReviewQuestion[] = questionDetails.map(q => ({
        questionId: q.question_id,
        part: q.part,
        questionText: q.question_text,
        hasRecording: recordedQuestionIds.includes(q.question_id)
      }));

      setQuestions(reviewQuestions);
      setLoading(false);
    } catch (err: any) {
      console.error('[TestReview] Error loading questions:', err);
      setError(err?.message || 'Failed to load questions');
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleSubmit = () => {
    // Navigate back to test-question with a submit flag
    router.replace({
      pathname: '/mock-test/test-question',
      params: {
        testId,
        mode,
        testSessionId,
        part1,
        part2,
        part3,
        timeLimit,
        autoSubmit: 'true'
      }
    });
  };

  const unansweredCount = questions.filter(q => !q.hasRecording).length;
  const answeredCount = questions.filter(q => q.hasRecording).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Review Test</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3BB9F0" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleGoBack}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>Review Test</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={handleGoBack}>
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
        <Pressable style={styles.backButton} onPress={handleGoBack}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Review Test</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Test Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{answeredCount}</Text>
              <Text style={styles.statLabel}>Answered</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, unansweredCount > 0 && styles.statNumberWarning]}>
                {unansweredCount}
              </Text>
              <Text style={styles.statLabel}>Unanswered</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{questions.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Warning if unanswered */}
        {unansweredCount > 0 && (
          <View style={styles.warningCard}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#FF8C00" />
            <Text style={[styles.warningText, { marginLeft: 12 }]}>
              You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
              You can go back to answer them or submit anyway.
            </Text>
          </View>
        )}

        {/* Questions List */}
        <Text style={styles.sectionTitle}>Questions</Text>

        {[1, 2, 3].filter(part => questions.filter(q => q.part === part).length > 0).map(part => {
          const partQuestions = questions.filter(q => q.part === part);

          return (
            <View key={`part-${part}`} style={styles.partSection}>
              <Text style={styles.partLabel}>Part {part}</Text>
              {partQuestions.map((question, index) => (
                <View key={`question-${question.questionId}`} style={styles.questionItem}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                    <View style={[styles.statusBadge, question.hasRecording && styles.statusBadgeAnswered]}>
                      <IconSymbol
                        name={question.hasRecording ? "checkmark.circle.fill" : "circle"}
                        size={16}
                        color={question.hasRecording ? "#4CAF50" : "#CCC"}
                      />
                      <Text style={[styles.statusText, question.hasRecording && styles.statusTextAnswered, { marginLeft: 6 }]}>
                        {question.hasRecording ? 'Recorded' : 'Not recorded'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.questionPreview} numberOfLines={2}>
                    {question.questionText}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable style={styles.backToTestButton} onPress={handleGoBack}>
            <IconSymbol name="arrow.left" size={20} color="#3BB9F0" />
            <Text style={[styles.backToTestButtonText, { marginLeft: 8 }]}>Back to Test</Text>
          </Pressable>

          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={[styles.submitButtonText, { marginRight: 8 }]}>Submit Test</Text>
            <IconSymbol name="arrow.right" size={20} color="#fff" />
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
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
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3BB9F0',
    marginBottom: 4,
  },
  statNumberWarning: {
    color: '#FF8C00',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  partSection: {
    marginBottom: 24,
  },
  partLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3BB9F0',
    marginBottom: 12,
  },
  questionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3BB9F0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusBadgeAnswered: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  statusTextAnswered: {
    color: '#4CAF50',
  },
  questionPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 32,
  },
  backToTestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 14,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#3BB9F0',
  },
  backToTestButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3BB9F0',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
