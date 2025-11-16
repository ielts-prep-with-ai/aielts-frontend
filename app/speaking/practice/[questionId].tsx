import { StyleSheet, ScrollView, View, Text, Pressable, Modal } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';

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
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const [expandedRecords, setExpandedRecords] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock question data - replace with API call
  const question = {
    part: 2,
    text: "Tell me about your hometown. What do you like most about living there?",
  };

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

  const topicTitle = topic === 'education' ? 'Education' :
                     topic === 'technology' ? 'Technology' :
                     topic === 'travel' ? 'Travel & Tourism' :
                     topic === 'environment' ? 'Environment' :
                     topic === 'health' ? 'Health & Fitness' :
                     topic === 'work' ? 'Work & Career' :
                     'Personal Information';

  useEffect(() => {
    if (isRecording && !isPaused) {
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
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleRestart = () => {
    setIsRecording(false);
    setIsPaused(false);
    setTime(0);
  };

  const handleSubmit = () => {
    // TODO: Submit to AI Analysis
    console.log('Submitting to AI Analysis...');
  };

  const toggleRecordExpand = (id: number) => {
    setExpandedRecords((prev) =>
      prev.includes(id) ? prev.filter((recordId) => recordId !== id) : [...prev, id]
    );
  };

  const handleStartPractice = () => {
    setShowRecording(true);
  };

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
            <Text style={styles.questionText}>{question.text}</Text>
          </View>

          {/* Recording Section */}
          <View style={styles.recordingCard}>
            <Text style={styles.recordingStatus}>
              {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Record your answer'}
            </Text>
            <Text style={styles.timer}>{formatTime(time)}</Text>

            {/* Control Buttons */}
            <View style={styles.controls}>
              <Pressable
                style={[styles.controlButton, styles.recordButton, isRecording && styles.recordButtonActive]}
                onPress={handleRecord}
              >
                <IconSymbol name="mic.fill" size={32} color={isRecording ? '#fff' : '#FF6B6B'} />
              </Pressable>

              <Pressable
                style={[styles.controlButton, styles.pauseButton]}
                onPress={handlePause}
                disabled={!isRecording}
              >
                <IconSymbol name={isPaused ? 'play.fill' : 'pause.fill'} size={32} color="#000" />
              </Pressable>

              <Pressable
                style={[styles.controlButton, styles.restartButton]}
                onPress={handleRestart}
              >
                <IconSymbol name="arrow.clockwise" size={28} color="#666" />
              </Pressable>
            </View>

            {/* Submit Button */}
            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <IconSymbol name="sparkles" size={20} color="#3BB9F0" />
              <Text style={styles.submitButtonText}>Submit to AI Analysis</Text>
            </Pressable>
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
          <Text style={styles.questionText}>{question.text}</Text>
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
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  recordingStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordButton: {
    backgroundColor: '#FFE5E5',
  },
  recordButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  pauseButton: {
    backgroundColor: '#E8F6FC',
  },
  restartButton: {
    backgroundColor: '#F5F5F5',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F6FC',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3BB9F0',
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
});
