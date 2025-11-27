import { IconSymbol } from '@/components/ui/icon-symbol';
import { ApiService } from '@/services/api.service';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Tag {
  id: number;
  tag: string;
  popularity_score: number;
}

interface Topic {
  id: number;
  skill: string;
  topic_name: string;
  tags: Tag[];
  question_count: number;
}

interface TopicCardProps {
  title: string;
  description: string;
  questionsCount: number;
  isHighlighted?: boolean;
  onPress: () => void;
}

const TopicCard = ({ title, description, questionsCount, isHighlighted = false, onPress }: TopicCardProps) => {
  return (
    <Pressable style={[styles.topicCard, isHighlighted && styles.topicCardHighlighted]} onPress={onPress}>
      <View style={styles.topicCardContent}>
        <View style={styles.topicCardLeft}>
          <Text style={[styles.topicTitle, isHighlighted && styles.topicTitleHighlighted]}>
            {title}
          </Text>
          <Text style={[styles.topicDescription, isHighlighted && styles.topicDescriptionHighlighted]}>
            {description}
          </Text>
        </View>
        <View style={styles.topicCardRight}>
          <Text style={[styles.questionsCount, isHighlighted && styles.questionsCountHighlighted]}>
            {questionsCount} questions{'\n'}available
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default function SpeakingScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[SPEAKING] Fetching topics...');
      const data = await ApiService.get<any>('/topics');

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[SPEAKING] RAW RESPONSE FROM BACKEND:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[SPEAKING] Type:', typeof data);
      console.log('[SPEAKING] Is Array?', Array.isArray(data));
      console.log('[SPEAKING] Full Response:', JSON.stringify(data, null, 2));
      console.log('═══════════════════════════════════════════════════════════');

      let topicsArray: Topic[] = [];

      // Handle different response formats
      if (Array.isArray(data)) {
        // Direct array response
        topicsArray = data;
        console.log('[SPEAKING] ✅ Direct array format, count:', data.length);
      } else if (data && typeof data === 'object') {
        // Check common response formats
        if (Array.isArray(data.topics)) {
          topicsArray = data.topics;
          console.log('[SPEAKING] ✅ Found topics in data.topics, count:', data.topics.length);
        } else if (Array.isArray(data.data)) {
          topicsArray = data.data;
          console.log('[SPEAKING] ✅ Found topics in data.data, count:', data.data.length);
        } else if (Array.isArray(data.results)) {
          topicsArray = data.results;
          console.log('[SPEAKING] ✅ Found topics in data.results, count:', data.results.length);
        } else {
          console.error('[SPEAKING] ❌ Unknown response format. Keys:', Object.keys(data));
          setTopics([]);
          setError('Invalid response format from server');
          return;
        }
      } else {
        console.error('[SPEAKING] ❌ Response is not an array or object:', typeof data);
        setTopics([]);
        setError('Invalid response format from server');
        return;
      }

      setTopics(topicsArray);
      console.log('[SPEAKING] ✅ Topics set successfully, count:', topicsArray.length);
    } catch (err) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[SPEAKING] ❌ FAILED TO LOAD TOPICS');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[SPEAKING] Error:', err);
      if (err instanceof Error) {
        console.error('[SPEAKING] Error message:', err.message);
        console.error('[SPEAKING] Error stack:', err.stack);
      }
      console.error('═══════════════════════════════════════════════════════════');
      setError(err instanceof Error ? err.message : 'Failed to load topics');
      setTopics([]); // Ensure topics is always an array
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get topic description from tags
  const getTopicDescription = (tags: Tag[] | null): string => {
    if (!tags || tags.length === 0) {
      return 'No tags available';
    }
    return tags.map(tag => tag.tag).join(', ');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <View>
            <Text style={styles.title}>Speaking Practice</Text>
            <Text style={styles.subtitle}>Choose a topic to practice</Text>
          </View>
        </View>
        <Pressable style={styles.aiIconContainer}>
          <IconSymbol name="brain" size={30} color="#3BB9F0" />
        </Pressable>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3BB9F0" />
          <Text style={styles.loadingText}>Loading topics...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.centerContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadTopics}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Topic Cards */}
      {!loading && !error && topics && Array.isArray(topics) && topics.length > 0 && (
        <View style={styles.topicsContainer}>
          {topics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              title={topic.topic_name}
              description={getTopicDescription(topic.tags)}
              questionsCount={topic.question_count}
              isHighlighted={index === 0}
              onPress={() => router.push(`/speaking/${topic.id}`)}
            />
          ))}
        </View>
      )}

      {/* Empty State */}
      {!loading && !error && topics && Array.isArray(topics) && topics.length === 0 && (
        <View style={styles.centerContainer}>
          <IconSymbol name="tray" size={48} color="#999" />
          <Text style={styles.emptyText}>No topics available</Text>
          <Pressable style={styles.retryButton} onPress={loadTopics}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  aiIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F6FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicsContainer: {
    gap: 16,
  },
  topicCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topicCardHighlighted: {
    backgroundColor: '#3BB9F0',
  },
  topicCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topicCardLeft: {
    flex: 1,
    paddingRight: 16,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  topicTitleHighlighted: {
    color: '#fff',
  },
  topicDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  topicDescriptionHighlighted: {
    color: '#fff',
    opacity: 0.9,
  },
  topicCardRight: {
    alignItems: 'flex-end',
  },
  questionsCount: {
    fontSize: 13,
    color: '#999',
    textAlign: 'right',
  },
  questionsCountHighlighted: {
    color: '#fff',
    opacity: 0.9,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3BB9F0',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});