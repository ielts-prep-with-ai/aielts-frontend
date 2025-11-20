import { ApiService } from './api.service';
import { TopicOverview } from './types';

/**
 * Topics Service - Handles all topic-related API calls
 */
class TopicsServiceClass {
  /**
   * Get all speaking topics with their tags and question counts
   * GET /topics
   */
  async listTopics(): Promise<TopicOverview[]> {
    console.log('[TopicsService] Fetching all topics...');

    try {
      const topics = await ApiService.get<TopicOverview[]>('/topics');
      console.log(`[TopicsService] Successfully fetched ${topics.length} topics`);
      return topics;
    } catch (error) {
      console.error('[TopicsService] Failed to fetch topics:', error);
      throw error;
    }
  }
}

export const TopicsService = new TopicsServiceClass();
