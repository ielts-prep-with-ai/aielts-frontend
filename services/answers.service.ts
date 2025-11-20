import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { SubmitAnswerResponse, UserAnswerWithEvaluation } from './types';

const API_BASE_URL = 'https://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1';

/**
 * Answers Service - Handles all user answer-related API calls
 */
class AnswersServiceClass {
  /**
   * Submit an audio answer for a question in practice mode
   * POST /questions/{question_id}/answers
   *
   * Note: This endpoint requires multipart/form-data, so we don't use ApiService
   */
  async submitAnswer(questionId: number, audioBlob: Blob): Promise<SubmitAnswerResponse> {
    console.log(`[AnswersService] Submitting answer for question ${questionId}...`);

    try {
      // Get access token
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.wav');

      // Make request with multipart/form-data
      const response = await fetch(`${API_BASE_URL}/questions/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let the browser set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to submit answer: ${response.status} ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }

        console.error('[AnswersService] Failed to submit answer:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[AnswersService] Answer submitted successfully');
      console.log('[AnswersService] User answer ID:', result.user_answer_id);
      return result;
    } catch (error) {
      console.error('[AnswersService] Failed to submit answer:', error);
      throw error;
    }
  }

  /**
   * Get all user answers with AI evaluations for specific questions
   * GET /user_answers?question_id={id}
   */
  async getUserAnswers(questionId: number): Promise<UserAnswerWithEvaluation[]> {
    console.log(`[AnswersService] Fetching user answers for question ${questionId}...`);

    try {
      const answers = await ApiService.get<UserAnswerWithEvaluation[]>(
        `/user_answers?question_id=${questionId}`
      );
      console.log(`[AnswersService] Successfully fetched ${answers.length} answers`);
      return answers;
    } catch (error) {
      console.error('[AnswersService] Failed to fetch user answers:', error);
      throw error;
    }
  }
}

export const AnswersService = new AnswersServiceClass();
