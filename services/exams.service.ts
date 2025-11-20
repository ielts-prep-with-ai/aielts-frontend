import { ApiService } from './api.service';
import {
  ExamSetSummary,
  ExamSetDetail,
  StartTestRequest,
  StartTestResponse,
  SimulationUploadURLsRequest,
  SimulationUploadURLsResponse,
  ConfirmSimulationRequest,
  Skill,
} from './types';

/**
 * Exams Service - Handles all exam/test-related API calls
 */
class ExamsServiceClass {
  /**
   * Get available exam sets for a specific skill
   * GET /examsets?skill={skill}
   */
  async listExamSets(skill: Skill): Promise<ExamSetSummary[]> {
    console.log(`[ExamsService] Fetching exam sets for skill: ${skill}...`);

    try {
      const examSets = await ApiService.get<ExamSetSummary[]>(`/examsets?skill=${skill}`);
      console.log(`[ExamsService] Successfully fetched ${examSets.length} exam sets`);
      return examSets;
    } catch (error) {
      console.error('[ExamsService] Failed to fetch exam sets:', error);
      throw error;
    }
  }

  /**
   * Get complete exam set with all question IDs
   * GET /examsets/{exam_set_id}
   */
  async getExamSet(examSetId: number): Promise<ExamSetDetail> {
    console.log(`[ExamsService] Fetching exam set ${examSetId}...`);

    try {
      const examSet = await ApiService.get<ExamSetDetail>(`/examsets/${examSetId}`);
      console.log(`[ExamsService] Successfully fetched exam set ${examSetId}`);
      return examSet;
    } catch (error) {
      console.error(`[ExamsService] Failed to fetch exam set ${examSetId}:`, error);
      throw error;
    }
  }

  /**
   * Start a practice or simulation test
   * POST /start_test
   */
  async startTest(request: StartTestRequest): Promise<StartTestResponse> {
    console.log('[ExamsService] Starting test session...');
    console.log('[ExamsService] Request:', request);

    try {
      const response = await ApiService.post<StartTestResponse>('/start_test', request);
      console.log('[ExamsService] Test session started successfully');
      console.log('[ExamsService] Session ID:', response.test_session_id);
      return response;
    } catch (error) {
      console.error('[ExamsService] Failed to start test session:', error);
      throw error;
    }
  }

  /**
   * Generate presigned URLs for uploading audio files in simulation mode
   * POST /get_simulation_upload_urls
   */
  async getSimulationUploadUrls(
    request: SimulationUploadURLsRequest
  ): Promise<SimulationUploadURLsResponse> {
    console.log('[ExamsService] Requesting simulation upload URLs...');
    console.log('[ExamsService] Session ID:', request.test_session_id);

    try {
      const response = await ApiService.post<SimulationUploadURLsResponse>(
        '/get_simulation_upload_urls',
        request
      );
      console.log('[ExamsService] Successfully generated upload URLs');
      return response;
    } catch (error) {
      console.error('[ExamsService] Failed to get simulation upload URLs:', error);
      throw error;
    }
  }

  /**
   * Upload audio file directly to R2 using presigned URL
   * PUT to presigned URL (not through API service)
   */
  async uploadAudioToR2(presignedUrl: string, audioBlob: Blob): Promise<void> {
    console.log('[ExamsService] Uploading audio to R2...');

    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: audioBlob,
        headers: {
          'Content-Type': 'audio/wav',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to upload audio: ${response.status} ${response.statusText}`);
      }

      console.log('[ExamsService] Audio uploaded successfully to R2');
    } catch (error) {
      console.error('[ExamsService] Failed to upload audio to R2:', error);
      throw error;
    }
  }

  /**
   * Confirm that all audio files have been uploaded for a simulation test
   * POST /confirm_simulation_submission
   */
  async confirmSimulationSubmission(request: ConfirmSimulationRequest): Promise<{ message: string }> {
    console.log('[ExamsService] Confirming simulation submission...');
    console.log('[ExamsService] Session ID:', request.test_session_id);

    try {
      const response = await ApiService.post<{ message: string }>(
        '/confirm_simulation_submission',
        request
      );
      console.log('[ExamsService] Simulation submission confirmed');
      return response;
    } catch (error) {
      console.error('[ExamsService] Failed to confirm simulation submission:', error);
      throw error;
    }
  }
}

export const ExamsService = new ExamsServiceClass();
