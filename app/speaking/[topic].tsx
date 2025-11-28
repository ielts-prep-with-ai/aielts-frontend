import { IconSymbol } from '@/components/ui/icon-symbol';
import { ApiService } from '@/services/api.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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

interface DropdownProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
}

const Dropdown = ({ label, value, options, onSelect }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={styles.dropdown}>
      <Pressable 
        style={styles.dropdownButton} 
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.dropdownButtonText} numberOfLines={1}>
          {selectedOption?.label || 'Select'}
        </Text>
        <IconSymbol name="chevron.down" size={16} color="#fff" />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownMenuTitle}>{label}</Text>
            {options.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.dropdownMenuItem,
                  option.value === value && styles.dropdownMenuItemActive
                ]}
                onPress={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownMenuItemText,
                  option.value === value && styles.dropdownMenuItemTextActive
                ]}>
                  {option.label}
                </Text>
                {option.value === value && (
                  <IconSymbol name="checkmark" size={18} color="#00B8FF" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default function TopicQuestionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const topicId = params.topic || params.id;
  
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPart, setFilterPart] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('most');
  const [searchQuery, setSearchQuery] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [speakingQuestionId, setSpeakingQuestionId] = useState<number | null>(null);

  const topicNameMap: Record<string, string> = {
    '1': 'Education',
    '2': 'Technology',
    '3': 'Travel & Tourism',
    '4': 'Environment',
    '5': 'Health & Fitness',
    '6': 'Work & Career',
    '7': 'Personal Information',
  };

  const topicTitle = topicNameMap[topicId as string] || 'Practice Questions';

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
        sort_by: sortBy === 'most' ? 'popularity' : 'part',
      });

      const response = await ApiService.get<any>(`/questions?${params.toString()}`);

      let questionData: Question[] = [];

      if (Array.isArray(response)) {
        questionData = response;
      } else if (response.data && Array.isArray(response.data)) {
        questionData = response.data;
      } else if (response.questions && Array.isArray(response.questions)) {
        questionData = response.questions;
      }

      console.log('[TopicQuestions] Fetched questions:', questionData.length);

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

  useEffect(() => {
    if (topicId && pageIndex > 1) {
      fetchQuestions(true);
    }
  }, [pageIndex]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Filter questions
  const filteredQuestions = Array.isArray(questions) ? questions.filter((q) => {
    // Type filter
    if (filterType === 'ai' && !q.ai_generated) return false;
    if (filterType === 'official' && q.ai_generated) return false;
    
    // Part filter
    if (filterPart !== 'all' && q.part.toString() !== filterPart) return false;
    
    // Search filter
    if (searchQuery && !q.question_text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  }) : [];

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPageIndex(prev => prev + 1);
    }
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      handleLoadMore();
    }
  };

  const handleSpeakQuestion = async (questionId: number, questionText: string) => {
    try {
      if (speakingQuestionId === questionId) {
        await Speech.stop();
        setSpeakingQuestionId(null);
        return;
      }

      await Speech.stop();
      setSpeakingQuestionId(questionId);

      Speech.speak(questionText, {
        language: 'en-GB',
        pitch: 1.05,
        rate: 0.85,
        onDone: () => setSpeakingQuestionId(null),
        onStopped: () => setSpeakingQuestionId(null),
        onError: () => setSpeakingQuestionId(null),
      });
    } catch (error) {
      console.error('[TTS] Error speaking question:', error);
      setSpeakingQuestionId(null);
    }
  };

  const typeOptions = [
    { label: 'All', value: 'all' },
    { label: 'AI Generated', value: 'ai' },
    { label: 'Official', value: 'official' }
  ];

  const partOptions = [
    { label: 'All', value: 'all' },
    { label: 'Part 1', value: '1' },
    { label: 'Part 2', value: '2' },
    { label: 'Part 3', value: '3' }
  ];

  const sortOptions = [
    { label: 'Most Popular', value: 'most' },
    { label: 'Least Popular', value: 'least' }
  ];

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

      {/* Search Section */}
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
      </View>

      {/* Filter and Sort Controls */}
      <View style={styles.filterSection}>
        <Pressable 
          style={[styles.filterButton, filterType === 'all' && filterPart === 'all' && styles.filterButtonActive]}
          onPress={() => {
            setFilterType('all');
            setFilterPart('all');
          }}
        >
          <Text style={[styles.filterButtonText, filterType === 'all' && filterPart === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </Pressable>

        <Dropdown
          label="Type"
          value={filterType}
          options={typeOptions}
          onSelect={setFilterType}
        />

        <Dropdown
          label="Part"
          value={filterPart}
          options={partOptions}
          onSelect={setFilterPart}
        />

        <Dropdown
          label="Popularity"
          value={sortBy}
          options={sortOptions}
          onSelect={setSortBy}
        />
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
            
            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#00B8FF" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            )}
            
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
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
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 40,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#00B8FF',
    borderColor: '#00B8FF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  dropdown: {
    flex: 1,
    minWidth: 90,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#00B8FF',
    height: 40,
  },
  dropdownButtonText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    marginRight: 4,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 200,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownMenuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownMenuItemActive: {
    backgroundColor: '#E6F7FF',
  },
  dropdownMenuItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  dropdownMenuItemTextActive: {
    color: '#00B8FF',
    fontWeight: '600',
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