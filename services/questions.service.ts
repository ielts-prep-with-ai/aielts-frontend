import { ApiService } from './api.service';
import { QuestionWithDetails, QuestionDetail, ListQuestionsRequest } from './types';

/**
 * Questions Service - Handles all question-related API calls
 */
class QuestionsServiceClass {
  /**
   * Get paginated questions for a specific topic tag
   * GET /questions?topic_id={topic_id}&part={part}&sort_by={field}&page_index={page}&page_size={size}
   */
  async listQuestions(params: ListQuestionsRequest): Promise<QuestionWithDetails[]> {
    console.log('[QuestionsService] Fetching questions with params:', params);

    try {
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('topic_id', params.topic_id.toString());

      if (params.part !== undefined) {
        queryParams.append('part', params.part.toString());
      }
      if (params.sort_by) {
        queryParams.append('sort_by', params.sort_by);
      }
      if (params.page_index !== undefined) {
        queryParams.append('page_index', params.page_index.toString());
      }
      if (params.page_size !== undefined) {
        queryParams.append('page_size', params.page_size.toString());
      }

      const questions = await ApiService.get<QuestionWithDetails[]>(
        `/questions?${queryParams.toString()}`
      );

      console.log(`[QuestionsService] Successfully fetched ${questions.length} questions`);
      return questions;
    } catch (error) {
      console.error('[QuestionsService] Failed to fetch questions:', error);
      throw error;
    }
  }

  /**
   * Get a single question with topic and tag information
   * GET /questions/{question_id}
   */
  async getQuestion(questionId: number): Promise<QuestionDetail> {
    console.log(`[QuestionsService] Fetching question ${questionId}...`);

    try {
      const question = await ApiService.get<QuestionDetail>(`/questions/${questionId}`);
      console.log(`[QuestionsService] Successfully fetched question ${questionId}`);
      return question;
    } catch (error) {
      console.error(`[QuestionsService] Failed to fetch question ${questionId}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple questions by IDs in a single batch request
   * POST /questions/batch
   */
  async getBatchQuestions(questionIds: number[]): Promise<QuestionDetail[]> {
    console.log(`[QuestionsService] Fetching ${questionIds.length} questions in batch...`);

    try {
      const questions = await ApiService.post<QuestionDetail[]>('/questions/batch', {
        question_ids: questionIds
      });
      console.log(`[QuestionsService] Successfully fetched ${questions.length} questions in batch`);
      return questions;
    } catch (error) {
      console.error('[QuestionsService] Failed to fetch batch questions:', error);
      throw error;
    }
  }
}

export const QuestionsService = new QuestionsServiceClass();
