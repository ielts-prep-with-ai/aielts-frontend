import { IconSymbol } from '@/components/ui/icon-symbol';
import { ApiService } from '@/services/api.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

interface Question {
  id: number;
  ai_generated: boolean;
  part: number;
  question_text: string;
  question_active: boolean;
  question_popularity: number;
  tag_id: number;
  tag_name: string;
}

interface ApiResponse {
  data?: Question[];
  total?: number;
  page_index?: number;
  page_size?: number;
}

export default function TopicQuestionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // If file is named [topic].tsx, the ID comes as 'topic' param
  // If file is named [id].tsx, the ID comes as 'id' param
  const topicId = params.topic || params.id; // Get ID from route path
  const topicName = params.topicName as string; // Get from URL params

  const [activeFilter, setActiveFilter] = useState<'All' | 'AI generated' | 'Official'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popularity' | 'part'>('popularity');
  const [pageIndex, setPageIndex] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [speakingQuestionId, setSpeakingQuestionId] = useState<number | null>(null);


  const topicTitle = topicName || 'Practice Questions';

  // Fetch questions from API
  const fetchQuestions = async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const params = new URLSearchParams({
        topic_id: topicId?.toString() || '1',
        page_index: (append ? pageIndex : 1).toString(),
        page_size: '10',
        sort_by: sortBy,
      });

      const response = await ApiService.get<any>(`/questions?${params.toString()}`);

      // Handle different response structures
      let questionData: Question[] = [];

      if (Array.isArray(response)) {
        questionData = response;
      } else if (response.data && Array.isArray(response.data)) {
        questionData = response.data;
      } else if (response.questions && Array.isArray(response.questions)) {
        questionData = response.questions;
      }

      console.log('[TopicQuestions] Fetched questions:', questionData.length);
      if (questionData.length > 0) {
        console.log('[TopicQuestions] First question ID:', questionData[0].id);
        console.log('[TopicQuestions] Question IDs:', questionData.map(q => q.id));
      }

      // Check if there are more questions to load
      if (questionData.length < 10) {
        setHasMore(false);
      }

      if (append) {
        setQuestions(prev => [...prev, ...questionData]);
      } else {
        setQuestions(questionData);
        setHasMore(true);
      }
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (topicId) {
      setPageIndex(1);
      fetchQuestions(false);
    }
  }, [topicId, sortBy]);

  // Load more when pageIndex changes
  useEffect(() => {
    if (topicId && pageIndex > 1) {
      fetchQuestions(true);
    }
  }, [pageIndex]);

  // Cleanup: Stop speech when component unmounts
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Filter questions based on active filter and search query
  const filteredQuestions = Array.isArray(questions) ? questions.filter((q) => {
    const questionType = q.ai_generated ? 'AI generated' : 'Official';
    const matchesFilter = activeFilter === 'All' || questionType === activeFilter;
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) : [];

  const toggleSortBy = () => {
    setSortBy((prev) => (prev === 'popularity' ? 'part' : 'popularity'));
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPageIndex(prev => prev + 1);
    }
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    // Check if scrolled to bottom
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      handleLoadMore();
    }
  };

  // Handle text-to-speech for question
  const handleSpeakQuestion = async (questionId: number, questionText: string) => {
    try {
      // If this question is already speaking, stop it
      if (speakingQuestionId === questionId) {
        await Speech.stop();
        setSpeakingQuestionId(null);
        return;
      }

      // Stop any ongoing speech
      await Speech.stop();

      // Start speaking the question
      setSpeakingQuestionId(questionId);

      Speech.speak(questionText, {
        language: 'en-GB', // British English - sounds more natural for IELTS
        pitch: 1.05, // Slightly higher pitch for more natural tone
        rate: 0.85, // Slower, more conversational pace
        onDone: () => setSpeakingQuestionId(null),
        onStopped: () => setSpeakingQuestionId(null),
        onError: () => setSpeakingQuestionId(null),
      });
    } catch (error) {
      console.error('[TTS] Error speaking question:', error);
      setSpeakingQuestionId(null);
    }
  };

  if (loading && questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{topicTitle}</Text>
            <Text style={styles.headerSubtitle}>Practice questions</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00B8FF" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
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

      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Filter question"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <IconSymbol name="magnifyingglass" size={20} color="#000" />
        </View>
        <Pressable style={styles.sortButton} onPress={toggleSortBy}>
          <Text style={styles.sortButtonText}>
            sort by {sortBy === 'popularity' ? 'Popularity' : 'Part'}
          </Text>
          <IconSymbol name="chevron.down" size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterPill, activeFilter === 'All' && styles.filterPillActive]}
          onPress={() => setActiveFilter('All')}
        >
          <Text style={[styles.filterPillText, activeFilter === 'All' && styles.filterPillTextActive]}>
            All
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterPill, activeFilter === 'AI generated' && styles.filterPillActive]}
          onPress={() => setActiveFilter('AI generated')}
        >
          <Text style={[styles.filterPillText, activeFilter === 'AI generated' && styles.filterPillTextActive]}>
            AI generated
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterPill, activeFilter === 'Official' && styles.filterPillActive]}
          onPress={() => setActiveFilter('Official')}
        >
          <Text style={[styles.filterPillText, activeFilter === 'Official' && styles.filterPillTextActive]}>
            Official
          </Text>
        </Pressable>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => fetchQuestions(false)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Questions List */}
      <ScrollView 
        style={styles.questionsList} 
        contentContainerStyle={styles.questionsListContent}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {filteredQuestions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No questions match your search' : 'No questions available'}
            </Text>
          </View>
        ) : (
          <>
            {filteredQuestions.map((q) => (
              <View key={q.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionType}>
                    {q.ai_generated ? 'AI generated' : 'Official'}
                  </Text>
                  <View style={styles.partBadge}>
                    <Text style={styles.partBadgeText}>Part {q.part}</Text>
                  </View>
                </View>

                {/* Question text with speaker icon */}
                <View style={styles.questionTextContainer}>
                  <Text style={styles.questionText}>{q.question_text}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.speakerButton,
                      speakingQuestionId === q.id && styles.speakerButtonActive,
                      pressed && { transform: [{ scale: 0.9 }] }
                    ]}
                    onPress={() => handleSpeakQuestion(q.id, q.question_text)}
                  >
                    <IconSymbol
                      name={speakingQuestionId === q.id ? "speaker.wave.3.fill" : "speaker.wave.2.fill"}
                      size={22}
                      color={speakingQuestionId === q.id ? "#00B8FF" : "#666"}
                    />
                  </Pressable>
                </View>

                <Pressable
                  style={styles.startButton}
                  onPress={() => {
                    console.log('[TopicQuestions] Navigating to question ID:', q.id);
                    router.push(`/speaking/practice/${q.id}?topicId=${topicId}`);
                  }}
                >
                  <Text style={styles.startButtonText}>Start Practice</Text>
                </Pressable>
              </View>
            ))}
            
            {/* Loading More Indicator */}
            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#00B8FF" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            )}
            
            {/* End of List Indicator */}
            {!hasMore && filteredQuestions.length > 0 && (
              <View style={styles.endOfListContainer}>
                <Text style={styles.endOfListText}>No more questions</Text>
              </View>
            )}
          </>
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
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B8FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#fff',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  filterPillActive: {
    backgroundColor: '#00B8FF',
    borderColor: '#00B8FF',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  questionsList: {
    flex: 1,
  },
  questionsListContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 10,
  },
  questionType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  partBadge: {
    backgroundColor: '#00B8FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  partBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  questionTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  speakerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  speakerButtonActive: {
    backgroundColor: '#E6F7FF',
    borderWidth: 1,
    borderColor: '#00B8FF',
  },
  startButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
  },
  startButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#C62828',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
  },
  endOfListContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: 14,
    color: '#999',
  },
});