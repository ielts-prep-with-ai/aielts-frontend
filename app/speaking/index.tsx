import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Header } from '@/components/header';
import { TopicCard } from '@/components/topic-card';
import { LoadingView } from '@/components/ui/loading-view';
import { ErrorView } from '@/components/ui/error-view';
import { EmptyState } from '@/components/ui/empty-state';
import { useTopics } from '@/hooks/use-topics';

export default function SpeakingTopicsScreen() {
  const router = useRouter();
  const { topics, loading, error, refresh } = useTopics();

  // Helper function to get topic description from tags
  const getTopicDescription = (tags: any[]) => {
    if (!tags || tags.length === 0) return 'No tags available';
    return tags.map(tag => tag.tag).join(', ');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Speaking Practice" subtitle="Choose a topic to practice" />

        {loading && <LoadingView message="Loading topics..." />}

        {error && !loading && <ErrorView message={error.message} onRetry={refresh} />}

        {!loading && !error && topics.length === 0 && (
          <EmptyState
            message="No topics available"
            icon="tray"
            actionTitle="Refresh"
            onAction={refresh}
          />
        )}

        {!loading && !error && topics.length > 0 && (
          <View style={styles.topicsContainer}>
            {topics.map((topic, index) => (
              <TopicCard
                key={topic.id}
                title={topic.topic_name}
                description={getTopicDescription(topic.tags)}
                questionsCount={topic.question_count}
                highlighted={index === 0}
                onPress={() => router.push(`/speaking/${topic.id}`)}
              />
            ))}
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
  topicsContainer: {
    gap: 16,
  },
});
