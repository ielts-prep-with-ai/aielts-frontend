/**
 * Custom hook for managing topics
 */
import { useState, useEffect } from 'react';
import { TopicsService } from '@/services/topics.service';
import { TopicOverview } from '@/services/types';

export function useTopics() {
  const [topics, setTopics] = useState<TopicOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TopicsService.listTopics();
      setTopics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load topics'));
      console.error('Error loading topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  return {
    topics,
    loading,
    error,
    refresh: loadTopics,
  };
}
