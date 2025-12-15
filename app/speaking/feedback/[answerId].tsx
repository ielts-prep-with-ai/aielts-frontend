import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Header } from '@/components/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { ErrorView } from '@/components/ui/error-view';
import { AnswersService } from '@/services/answers.service';
import { UserAnswerWithEvaluation, CriteriaFeedback } from '@/services/types';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CriteriaCardProps {
  title: string;
  feedback: CriteriaFeedback;
}

function CriteriaCard({ title, feedback }: CriteriaCardProps) {
  return (
    <Card style={styles.criteriaCard}>
      <View style={styles.criteriaHeader}>
        <Text style={styles.criteriaTitle}>{title}</Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>{feedback.score}</Text>
        </View>
      </View>

      {feedback.feedback && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="text.bubble.fill" size={20} color="#3BB9F0" />
            <Text style={[styles.sectionTitle, { color: '#3BB9F0' }]}>Feedback</Text>
          </View>
          <Text style={styles.feedbackText}>{feedback.feedback}</Text>
        </View>
      )}
    </Card>
  );
}

export default function FeedbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const answerIdParam = params.answerId as string;
  const questionIdParam = params.questionId as string;

  const answerId = parseInt(answerIdParam);
  const questionId = parseInt(questionIdParam);

  const [answerData, setAnswerData] = useState<UserAnswerWithEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (questionId) {
      loadAnswer();
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [answerId, questionId]);

  const loadAnswer = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[FeedbackScreen] Loading answer:', answerId, 'for question:', questionId);

      // Fetch all answers for this question and find the specific answer
      const answers = await AnswersService.getUserAnswers(questionId);
      const answer = answers.find(a => a.id === answerId);

      if (!answer) {
        throw new Error('Answer not found');
      }

      console.log('[FeedbackScreen] Answer loaded successfully');
      setAnswerData(answer);

      // If feedback is not ready yet, start polling
      if (!answer.overall_score) {
        startPolling();
      }
    } catch (err) {
      console.error('[FeedbackScreen] Failed to load answer:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      return; // Already polling
    }

    console.log('[FeedbackScreen] Starting polling for feedback...');
    setPolling(true);

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log('[FeedbackScreen] Polling for feedback updates...');
        const answers = await AnswersService.getUserAnswers(questionId);
        const answer = answers.find(a => a.id === answerId);

        if (answer) {
          setAnswerData(answer);

          // Stop polling if feedback is ready
          if (answer.overall_score) {
            console.log('[FeedbackScreen] Feedback received, stopping polling');
            stopPolling();
          }
        }
      } catch (err) {
        console.error('[FeedbackScreen] Polling error:', err);
        // Continue polling even on error
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setPolling(false);
      console.log('[FeedbackScreen] Polling stopped');
    }
  };

  if (loading) {
    return <LoadingView message="Loading feedback..." />;
  }

  if (error || !answerData) {
    return (
      <View style={styles.container}>
        <Header title="Feedback" />
        <ErrorView message={error || 'Feedback not found'} onRetry={loadAnswer} />
      </View>
    );
  }

  const isProcessing = !answerData.overall_score;

  // If processing, show full-screen professional loading UI
  if (isProcessing) {
    return (
      <View style={styles.processingContainer}>
        <View style={styles.processingContent}>
          {/* Animated Icon */}
          <View style={styles.processingIconContainer}>
            <IconSymbol name="waveform" size={80} color="#3BB9F0" />
          </View>

          {/* Title */}
          <Text style={styles.processingTitle}>Analyzing Your Response</Text>

          {/* Subtitle */}
          <Text style={styles.processingDescription}>
            Our AI is carefully evaluating your speaking performance across multiple criteria
          </Text>

          {/* Progress Steps */}
          <View style={styles.progressSteps}>
            <View style={styles.progressStep}>
              <View style={styles.progressStepIconActive}>
                <IconSymbol name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.progressStepTextActive}>Recording Uploaded</Text>
            </View>

            <View style={styles.progressStep}>
              <View style={styles.progressStepIconActive}>
                <IconSymbol name="waveform" size={16} color="#fff" />
              </View>
              <Text style={styles.progressStepTextActive}>Transcribing Audio</Text>
            </View>

            <View style={styles.progressStep}>
              <View style={styles.progressStepIconLoading}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
              <Text style={styles.progressStepTextLoading}>Analyzing Feedback</Text>
            </View>

            <View style={styles.progressStep}>
              <View style={styles.progressStepIconPending}>
                <IconSymbol name="star.fill" size={16} color="#999" />
              </View>
              <Text style={styles.progressStepTextPending}>Generating Score</Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.processingInfoBox}>
            <IconSymbol name="info.circle" size={20} color="#3BB9F0" />
            <Text style={styles.processingInfoText}>
              This usually takes 30-60 seconds. You can wait here or come back later.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.processingActions}>
            <Button
              title="Practice Another Question"
              onPress={() => router.back()}
              variant="outline"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Header title="AI Feedback" subtitle={`Answer #${answerId}`} />

        {/* Question */}
        <Card style={styles.questionCard}>
          <Text style={styles.questionLabel}>Question:</Text>
          <Text style={styles.questionText}>{answerData.question_text}</Text>
        </Card>

        {/* Overall Score */}
        {answerData.overall_score !== null && (
          <Card highlighted style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Overall Band Score</Text>
            <Text style={styles.scoreLarge}>{answerData.overall_score}</Text>
            {answerData.overall_feedback && (
              <Text style={styles.overallFeedback}>{answerData.overall_feedback}</Text>
            )}
          </Card>
        )}

        {/* Detailed Feedback */}
        {answerData.feedback_details && (
          <View style={styles.criteriaContainer}>
            {answerData.feedback_details.fluency && (
              <CriteriaCard title="Fluency & Coherence" feedback={answerData.feedback_details.fluency} />
            )}
            {answerData.feedback_details.lexical_resource && (
              <CriteriaCard title="Lexical Resource" feedback={answerData.feedback_details.lexical_resource} />
            )}
            {answerData.feedback_details.grammar_range_accuracy && (
              <CriteriaCard title="Grammatical Range & Accuracy" feedback={answerData.feedback_details.grammar_range_accuracy} />
            )}
            {answerData.feedback_details.pronunciation && (
              <CriteriaCard title="Pronunciation" feedback={answerData.feedback_details.pronunciation} />
            )}
          </View>
        )}

        {/* Actions */}
        {!isProcessing && (
          <View style={styles.actions}>
            <Button
              title="Practice Another"
              onPress={() => router.back()}
              variant="primary"
            />
            <Button
              title="View All Answers"
              onPress={() => router.push('/speaking')}
              variant="outline"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  questionCard: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  processingCard: {
    alignItems: 'center',
    padding: 40,
    marginBottom: 20,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  scoreCard: {
    alignItems: 'center',
    padding: 30,
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
  },
  scoreLarge: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
  },
  overallFeedback: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.9,
  },
  criteriaContainer: {
    gap: 16,
    marginBottom: 20,
  },
  criteriaCard: {},
  criteriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  criteriaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3BB9F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 4,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 28,
    marginBottom: 4,
  },
  actions: {
    gap: 12,
  },
});
