// types.ts - Complete type definitions for AI IELTS Backend

// ========== Common Types ==========

export type Skill = "speaking" | "listening" | "reading" | "writing";
export type IELTSPart = 1 | 2 | 3;
export type TestMode = "practice" | "simulation";
export type TimeLimit = "0min" | "12min" | "14min";
export type ProcessingStatus = "processing" | "completed" | "failed";

// ========== Authentication ==========

export interface UserAuthData {
  session_id: string;
  user_id: string;
  user_name: string;
  avatar_url: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
}

export interface TokenRenewRequest {
  refresh_token: string;
}

export interface TokenRenewResponse {
  access_token: string;
  access_token_expires_at: string;
}

// ========== Topics & Questions ==========

export interface TopicTag {
  id: number;
  tag: string;
  popularity_score: number;
}

export interface TopicOverview {
  id: number;
  skill: string;
  topic_name: string;
  tags: TopicTag[];
  question_count: number;
}

export interface QuestionWithDetails {
  id: number;
  part: number;
  question_text: string;
  topic_id: number;
  topic_name: string;
  tag_id: number;
  tag_name: string;
  popularity_score: number;
  ai_generated: boolean;
}

export interface QuestionDetail {
  question_id: number;
  part: number;
  question_text: string;
  topic_tag_id: number;
  topic_id: number;
  topic_name: string;
  tag_name: string;
}

export interface ListQuestionsRequest {
  topic_id: number;
  part?: number;
  sort_by?: string;
  page_index?: number;
  page_size?: number;
}

// ========== Practice & Tests ==========

export interface ExamSetSummary {
  id: number;
  title: string;
  skill: string;
}

export interface ExamSetDetail {
  id: number;
  title: string;
  skill: string;
  part1_ids: number[];
  part2_ids: number[];
  part3_ids: number[];
  is_active: boolean;
}

export interface StartTestRequest {
  mode: TestMode;
  exam_set_id: number;
  skill: string;
  part_1: boolean;
  part_2: boolean;
  part_3: boolean;
  time_limit?: TimeLimit;
}

export interface StartTestResponse {
  test_session_id: string;
  part_1: number[];
  part_2: number[];
  part_3: number[];
  start_time: string;
  end_time: string;
  time_limit: string;
}

export interface SimulationUploadURLsRequest {
  test_session_id: string;
  questions: {
    part_1?: number[];
    part_2?: number[];
    part_3?: number[];
  };
}

export interface SimulationUploadURLsResponse {
  upload_urls: {
    part_1?: Record<string, string>;
    part_2?: Record<string, string>;
    part_3?: Record<string, string>;
  };
}

export interface ConfirmSimulationRequest {
  test_session_id: string;
  answers: {
    part_1?: Record<string, string>;
    part_2?: Record<string, string>;
    part_3?: Record<string, string>;
  };
}

// ========== Evaluations & Feedback ==========

export interface SubmitAnswerResponse {
  user_answer_id: number;
  question_id: number;
  audio_url: string;
  status: ProcessingStatus;
}

export interface CriteriaFeedback {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface FeedbackDetails {
  fluency?: CriteriaFeedback;
  vocabulary?: CriteriaFeedback;
  grammar?: CriteriaFeedback;
  pronunciation?: CriteriaFeedback;
  [key: string]: CriteriaFeedback | undefined;
}

export interface UserAnswerWithEvaluation {
  id: number;
  question_id: number;
  part: number;
  question_text: string;
  answer_text: string;
  presigned_url: string;
  submitted_at: string;
  overall_score: number | null;
  overall_feedback: string | null;
  feedback_details: FeedbackDetails | null;
}

export interface WebSocketFeedbackMessage {
  user_answer_id: number;
  status: "completed" | "failed";
  overall_score?: number;
  overall_feedback?: string;
  feedback_details?: FeedbackDetails;
  error?: string;
}

// ========== Vocabulary ==========

export interface SavedWord {
  word: string;
  created_at: string;
}

export interface SaveWordRequest {
  word: string;
}

export interface DictionaryDefinition {
  word: string;
  phonetic?: string;
  phonetics?: PhoneticItem[];
  meanings: Meaning[];
  license?: License;
  sourceUrls?: string[];
}

export interface PhoneticItem {
  text: string;
  audio?: string;
}

export interface Meaning {
  partOfSpeech: string;
  definitions: DefinitionItem[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface DefinitionItem {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface License {
  name: string;
  url: string;
}
