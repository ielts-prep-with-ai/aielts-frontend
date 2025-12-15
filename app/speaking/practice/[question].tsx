import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View, Text, Alert } from 'react-native';
import { Header } from '@/components/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { ErrorView } from '@/components/ui/error-view';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { QuestionsService } from '@/services/questions.service';
import { AnswersService } from '@/services/answers.service';
import { QuestionDetail } from '@/services/types';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PracticeQuestionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const questionId = parseInt(params.question as string);

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorder = useAudioRecorder();

  // Track if this is the initial mount
  const isInitialMount = useRef(true);

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  // Reset recording state when coming back from feedback
  useFocusEffect(
    useCallback(() => {
      // Skip reset on initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
        console.log('[PracticeQuestion] Initial mount - skipping reset');
        return;
      }

      console.log('[PracticeQuestion] Returning from feedback - resetting recorder');
      recorder.reset();
      setSubmitting(false);
    }, [])
  );

  const loadQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await QuestionsService.getQuestion(questionId);
      setQuestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      await recorder.startRecording();
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const handleStopAndSubmit = async () => {
    try {
      setSubmitting(true);
      const audioBlob = await recorder.stopRecording();

      // Submit the answer
      await AnswersService.submitAnswer(questionId, audioBlob);

      // Fetch the updated answers list to get the ID of the answer we just submitted
      const answers = await AnswersService.getUserAnswers(questionId);

      // The most recent answer (first in the array) should be the one we just submitted
      const latestAnswer = answers[0];

      if (!latestAnswer) {
        throw new Error('Failed to retrieve submitted answer');
      }

      console.log('[PracticeScreen] Latest answer ID:', latestAnswer.id);
      console.log('[PracticeScreen] Navigating to:', `/speaking/feedback/${latestAnswer.id}?questionId=${questionId}`);

      Alert.alert(
        'Success',
        'Your answer has been submitted! AI feedback will be available shortly.',
        [
          {
            text: 'View Feedback',
            onPress: () => {
              const url = `/speaking/feedback/${latestAnswer.id}?questionId=${questionId}`;
              console.log('[PracticeScreen] Pushing to:', url);
              router.push(url);
            },
          },
          {
            text: 'Practice More',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingView message="Loading question..." />;
  }

  if (error || !question) {
    return (
      <View style={styles.container}>
        <Header title="Practice" />
        <ErrorView message={error || 'Question not found'} onRetry={loadQuestion} />
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
        <Header title="Practice Speaking" subtitle={`Part ${question.part}`} />

        {/* Question Card */}
        <Card style={styles.questionCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Part {question.part}</Text>
          </View>
          <Text style={styles.questionText}>{question.question_text}</Text>
          <View style={styles.topicInfo}>
            <Text style={styles.topicLabel}>Topic: {question.topic_name}</Text>
            {question.tag_name && (
              <Text style={styles.tagLabel}>{question.tag_name}</Text>
            )}
          </View>
        </Card>

        {/* Recording Controls */}
        <Card style={styles.recorderCard}>
          <View style={styles.recorderHeader}>
            <IconSymbol name="mic.fill" size={32} color={recorder.isRecording ? '#EF4444' : '#3BB9F0'} />
            <Text style={styles.recorderTitle}>
              {recorder.isRecording ? 'Recording...' : 'Ready to Record'}
            </Text>
          </View>

          {recorder.isRecording && (
            <View style={styles.durationContainer}>
              <Text style={styles.duration}>{formatDuration(recorder.duration)}</Text>
              <View style={[styles.recordingIndicator, recorder.isPaused && styles.pausedIndicator]} />
            </View>
          )}

          <View style={styles.controls}>
            {!recorder.isRecording ? (
              <Button
                title="Start Recording"
                onPress={handleStartRecording}
                size="large"
                style={styles.button}
              />
            ) : (
              <>
                {!recorder.isPaused ? (
                  <Button
                    title="Pause"
                    onPress={recorder.pauseRecording}
                    variant="secondary"
                    style={styles.button}
                  />
                ) : (
                  <Button
                    title="Resume"
                    onPress={recorder.resumeRecording}
                    style={styles.button}
                  />
                )}
                <Button
                  title="Stop & Submit"
                  onPress={handleStopAndSubmit}
                  loading={submitting}
                  variant="primary"
                  style={styles.button}
                />
                <Button
                  title="Cancel"
                  onPress={recorder.cancelRecording}
                  variant="outline"
                  style={styles.button}
                />
              </>
            )}
          </View>
        </Card>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for answering:</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tip}>• Speak clearly and at a natural pace</Text>
            <Text style={styles.tip}>• Try to speak for at least 30 seconds</Text>
            <Text style={styles.tip}>• Use varied vocabulary and sentence structures</Text>
            <Text style={styles.tip}>• Give specific examples when possible</Text>
          </View>
        </Card>
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
  badge: {
    backgroundColor: '#3BB9F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    lineHeight: 28,
    marginBottom: 16,
  },
  topicInfo: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  topicLabel: {
    fontSize: 14,
    color: '#666',
  },
  tagLabel: {
    fontSize: 14,
    color: '#3BB9F0',
    fontWeight: '500',
  },
  recorderCard: {
    marginBottom: 20,
    alignItems: 'center',
  },
  recorderHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recorderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
  },
  durationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  duration: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#EF4444',
    fontVariant: ['tabular-nums'],
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginTop: 8,
  },
  pausedIndicator: {
    backgroundColor: '#FFA500',
  },
  controls: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
  tipsCard: {
    backgroundColor: '#E8F6FC',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tip: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
