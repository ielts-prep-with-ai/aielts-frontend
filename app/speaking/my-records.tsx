import { StyleSheet, ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { AnswersService } from '@/services';

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

export default function RecordsScreen() {
  const router = useRouter();
  const { questionId, topicName } = useLocalSearchParams();
  const [expandedRecords, setExpandedRecords] = useState<number[]>([]);
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, [questionId]);

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await AnswersService.getUserAnswers(Number(questionId));
      // Transform API response to PracticeRecord format - adjust fields based on your actual API response
      const transformed: PracticeRecord[] = (data || []).map((item: any) => ({
        id: item.id,
        date: new Date(item.created_at).toLocaleDateString(),
        time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: item.duration || '0:00',
        rating: item.overall_score || item.score || 0,
        maxRating: 9,
        feedback: item.fluency_score ? {
          fluency: { score: item.fluency_score || 0, description: item.fluency_feedback || '' },
          vocabulary: { score: item.vocabulary_score || 0, description: item.vocabulary_feedback || '' },
          grammar: { score: item.grammar_score || 0, description: item.grammar_feedback || '' },
          pronunciation: { score: item.pronunciation_score || 0, description: item.pronunciation_feedback || '' },
          overall: item.overall_feedback || '',
        } : undefined,
      }));
      setRecords(transformed);
    } catch (err) {
      console.error('Failed to load records:', err);
      setError('Failed to load records');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecordExpand = (id: number) => {
    setExpandedRecords((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const topicTitle = typeof topicName === 'string' ? decodeURIComponent(topicName) : 'Practice';

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Your Records</Text>
            <Text style={styles.headerSubtitle}>{topicTitle}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3BB9F0" />
          <Text style={styles.loadingText}>Loading records...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Your Records</Text>
            <Text style={styles.headerSubtitle}>{topicTitle}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadRecords}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Your Records</Text>
          <Text style={styles.headerSubtitle}>{topicTitle}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="waveform" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No recordings yet</Text>
            <Text style={styles.emptyText}>Start practicing to see your recordings here</Text>
            <Pressable style={styles.startButton} onPress={() => router.back()}>
              <Text style={styles.startButtonText}>Start Practice</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.recordsSection}>
            <Text style={styles.recordsTitle}>{records.length} {records.length === 1 ? 'Recording' : 'Recordings'}</Text>
            <Text style={styles.recordsSubtitle}>Track your IELTS speaking practice progress</Text>

            {records.map((record) => (
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

                  <View style={[styles.ratingBadge, record.rating < 7 ? styles.ratingBadgeYellow : styles.ratingBadgeBlue]}>
                    <IconSymbol name="star.fill" size={14} color="#fff" />
                    <Text style={styles.ratingText}>{record.rating}/{record.maxRating}</Text>
                  </View>

                  {record.feedback && (
                    <Pressable style={styles.expandButton} onPress={() => toggleRecordExpand(record.id)}>
                      <IconSymbol name={expandedRecords.includes(record.id) ? "chevron.up" : "chevron.down"} size={20} color="#666" />
                    </Pressable>
                  )}
                </View>

                {expandedRecords.includes(record.id) && record.feedback && (
                  <View style={styles.recordExpandedContent}>
                    <View style={styles.feedbackItem}>
                      <View style={styles.feedbackHeader}>
                        <Text style={styles.feedbackTitle}>Fluency</Text>
                        <View style={[styles.feedbackScoreBadge, record.feedback.fluency.score >= 8 ? styles.feedbackScoreBadgeGreen : styles.feedbackScoreBadgeBlue]}>
                          <Text style={styles.feedbackScoreText}>{record.feedback.fluency.score}/9</Text>
                        </View>
                      </View>
                      <Text style={styles.feedbackDescription}>{record.feedback.fluency.description}</Text>
                    </View>

                    <View style={styles.feedbackItem}>
                      <View style={styles.feedbackHeader}>
                        <Text style={styles.feedbackTitle}>Vocabulary</Text>
                        <View style={[styles.feedbackScoreBadge, record.feedback.vocabulary.score >= 8 ? styles.feedbackScoreBadgeGreen : styles.feedbackScoreBadgeBlue]}>
                          <Text style={styles.feedbackScoreText}>{record.feedback.vocabulary.score}/9</Text>
                        </View>
                      </View>
                      <Text style={styles.feedbackDescription}>{record.feedback.vocabulary.description}</Text>
                    </View>

                    <View style={styles.feedbackItem}>
                      <View style={styles.feedbackHeader}>
                        <Text style={styles.feedbackTitle}>Grammar</Text>
                        <View style={[styles.feedbackScoreBadge, record.feedback.grammar.score >= 8 ? styles.feedbackScoreBadgeGreen : styles.feedbackScoreBadgeBlue]}>
                          <Text style={styles.feedbackScoreText}>{record.feedback.grammar.score}/9</Text>
                        </View>
                      </View>
                      <Text style={styles.feedbackDescription}>{record.feedback.grammar.description}</Text>
                    </View>

                    <View style={styles.feedbackItem}>
                      <View style={styles.feedbackHeader}>
                        <Text style={styles.feedbackTitle}>Pronunciation</Text>
                        <View style={[styles.feedbackScoreBadge, record.feedback.pronunciation.score >= 8 ? styles.feedbackScoreBadgeGreen : styles.feedbackScoreBadgeBlue]}>
                          <Text style={styles.feedbackScoreText}>{record.feedback.pronunciation.score}/9</Text>
                        </View>
                      </View>
                      <Text style={styles.feedbackDescription}>{record.feedback.pronunciation.description}</Text>
                    </View>

                    <View style={styles.overallFeedbackBox}>
                      <Text style={styles.overallFeedbackTitle}>Overall Feedback</Text>
                      <Text style={styles.overallFeedbackText}>{record.feedback.overall}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  backButton: { marginRight: 12, padding: 4 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  headerSubtitle: { fontSize: 14, color: '#666' },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
  errorText: { fontSize: 16, color: '#FF6B6B', marginTop: 16, marginBottom: 24, textAlign: 'center' },
  retryButton: { backgroundColor: '#3BB9F0', borderRadius: 25, paddingHorizontal: 32, paddingVertical: 12 },
  retryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center' },
  startButton: { marginTop: 20, backgroundColor: '#3BB9F0', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  recordsSection: { gap: 16 },
  recordsTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  recordsSubtitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  recordItem: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  recordMainInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  recordInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recordInfoText: { fontSize: 14, color: '#666', fontWeight: '500' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  ratingBadgeBlue: { backgroundColor: '#3BB9F0' },
  ratingBadgeYellow: { backgroundColor: '#FFB800' },
  ratingText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  expandButton: { padding: 4 },
  recordExpandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  feedbackItem: { marginBottom: 16 },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  feedbackTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  feedbackScoreBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  feedbackScoreBadgeBlue: { backgroundColor: '#3BB9F0' },
  feedbackScoreBadgeGreen: { backgroundColor: '#4CAF50' },
  feedbackScoreText: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
  feedbackDescription: { fontSize: 14, color: '#666', lineHeight: 20 },
  overallFeedbackBox: { backgroundColor: '#E8F6FC', borderWidth: 1, borderColor: '#3BB9F0', borderRadius: 12, padding: 16, marginTop: 8 },
  overallFeedbackTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  overallFeedbackText: { fontSize: 14, color: '#3BB9F0', lineHeight: 20 },
});