import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator, Animated, Pressable } from 'react-native';
import { Header } from '@/components/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { ErrorView } from '@/components/ui/error-view';
import { AnswersService } from '@/services/answers.service';
import { UserAnswerWithEvaluation, CriteriaFeedback } from '@/services/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Audio } from 'expo-av';

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

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Animation values for processing screen
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const step1Anim = useRef(new Animated.Value(0)).current;
  const step2Anim = useRef(new Animated.Value(0)).current;
  const step3Anim = useRef(new Animated.Value(0)).current;
  const step4Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (questionId) {
      loadAnswer();
    }

    // Cleanup polling and audio on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [answerId, questionId]);

  // Animate processing screen
  useEffect(() => {
    const isProcessing = answerData && !answerData.overall_score;

    if (isProcessing) {
      // Reset animations
      pulseAnim.setValue(1);
      fadeAnim.setValue(0);
      step1Anim.setValue(0);
      step2Anim.setValue(0);
      step3Anim.setValue(0);
      step4Anim.setValue(0);

      // Start pulse animation for icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Fade in content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Stagger step animations
      Animated.stagger(400, [
        Animated.spring(step1Anim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(step2Anim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(step3Anim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(step4Anim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [answerData]);

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

  const handlePlayPauseAudio = async () => {
    if (!answerData?.presigned_url) return;

    try {
      // If audio is already loaded, toggle play/pause
      if (audioLoaded && soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          // If audio finished, restart from beginning
          if (audioPosition >= audioDuration && audioDuration > 0) {
            await soundRef.current.setPositionAsync(0);
            setAudioPosition(0);
          }
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      // Load and play audio for the first time
      console.log('[FeedbackScreen] Loading audio:', answerData.presigned_url);

      // Unload any previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: answerData.presigned_url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setAudioLoaded(true);
      setIsPlaying(true);
    } catch (err) {
      console.error('[FeedbackScreen] Error playing audio:', err);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setAudioPosition(status.positionMillis || 0);
      setAudioDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      // Reset when finished
      if (status.didJustFinish) {
        setIsPlaying(false);
        setAudioPosition(0);
      }
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        <Animated.View style={[styles.processingContent, { opacity: fadeAnim }]}>
          {/* Animated Icon */}
          <Animated.View style={[styles.processingIconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <IconSymbol name="waveform" size={80} color="#3BB9F0" />
          </Animated.View>

          {/* Title */}
          <Text style={styles.processingTitle}>Analyzing Your Response</Text>

          {/* Subtitle */}
          <Text style={styles.processingDescription}>
            Our AI is carefully evaluating your speaking performance across multiple criteria
          </Text>

          {/* Progress Steps */}
          <View style={styles.progressSteps}>
            <Animated.View style={[styles.progressStep, { opacity: step1Anim, transform: [{ translateX: step1Anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
              <View style={styles.progressStepIconActive}>
                <IconSymbol name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.progressStepTextActive}>Recording Uploaded</Text>
            </Animated.View>

            <Animated.View style={[styles.progressStep, { opacity: step2Anim, transform: [{ translateX: step2Anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
              <View style={styles.progressStepIconActive}>
                <IconSymbol name="waveform" size={16} color="#fff" />
              </View>
              <Text style={styles.progressStepTextActive}>Transcribing Audio</Text>
            </Animated.View>

            <Animated.View style={[styles.progressStep, { opacity: step3Anim, transform: [{ translateX: step3Anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
              <View style={styles.progressStepIconLoading}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
              <Text style={styles.progressStepTextLoading}>Analyzing Feedback</Text>
            </Animated.View>

            <Animated.View style={[styles.progressStep, { opacity: step4Anim, transform: [{ translateX: step4Anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
              <View style={styles.progressStepIconPending}>
                <IconSymbol name="star.fill" size={16} color="#999" />
              </View>
              <Text style={styles.progressStepTextPending}>Generating Score</Text>
            </Animated.View>
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
        </Animated.View>
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
        <Header title="AI Feedback" subtitle={`Answer #${answerId}`} showHome={true} />

        {/* Question */}
        <Card style={styles.questionCard}>
          <Text style={styles.questionLabel}>Question:</Text>
          <Text style={styles.questionText}>{answerData.question_text}</Text>
        </Card>

        {/* Your Answer - Transcription and Audio */}
        {answerData.answer_text && (
          <Card style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <IconSymbol name="text.bubble.fill" size={20} color="#3BB9F0" />
              <Text style={styles.answerHeaderTitle}>Your Answer</Text>
            </View>

            {/* Transcription */}
            <View style={styles.transcriptionSection}>
              <Text style={styles.transcriptionLabel}>Transcription:</Text>
              <Text style={styles.transcriptionText}>{answerData.answer_text}</Text>
            </View>

            {/* Audio Player */}
            {answerData.presigned_url && (
              <View style={styles.audioPlayerSection}>
                <View style={styles.audioPlayerHeader}>
                  <IconSymbol name="waveform" size={18} color="#3BB9F0" />
                  <Text style={styles.audioPlayerLabel}>Audio Recording</Text>
                </View>

                <Pressable
                  style={styles.audioPlayButton}
                  onPress={handlePlayPauseAudio}
                >
                  <IconSymbol
                    name={isPlaying ? "pause.circle.fill" : "play.circle.fill"}
                    size={28}
                    color="#fff"
                  />
                  <Text style={styles.audioPlayButtonText}>
                    {isPlaying ? 'Pause Recording' : 'Play Recording'}
                  </Text>
                </Pressable>

                {/* Progress Bar */}
                {audioLoaded && audioDuration > 0 && (
                  <View style={styles.audioProgressSection}>
                    <View style={styles.audioProgressBar}>
                      <View
                        style={[
                          styles.audioProgressFill,
                          { width: `${(audioPosition / audioDuration) * 100}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.audioTimeText}>
                      {formatTime(audioPosition)} / {formatTime(audioDuration)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        )}

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
  // Answer Card Styles
  answerCard: {
    marginBottom: 20,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  answerHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  transcriptionSection: {
    marginBottom: 16,
  },
  transcriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  transcriptionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  audioPlayerSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  audioPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  audioPlayerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  audioPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#3BB9F0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  audioPlayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  audioProgressSection: {
    gap: 8,
  },
  audioProgressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  audioProgressFill: {
    height: '100%',
    backgroundColor: '#3BB9F0',
    borderRadius: 3,
  },
  audioTimeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
    flex: 1,
    flexShrink: 1,
    marginRight: 12,
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
  // Processing Screen Styles
  processingContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  processingIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  processingDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  progressSteps: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressStepIconActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3BB9F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepIconLoading: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3BB9F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepIconPending: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepTextActive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  progressStepTextLoading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3BB9F0',
    flex: 1,
  },
  progressStepTextPending: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    flex: 1,
  },
  processingInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E6F4FE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  processingInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  processingActions: {
    width: '100%',
  },
});
