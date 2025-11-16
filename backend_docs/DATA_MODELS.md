# Data Models & Schemas

Complete reference for all request and response data structures.

## Table of Contents

- [TypeScript Interfaces](#typescript-interfaces)
- [Authentication Models](#authentication-models)
- [Topic & Question Models](#topic--question-models)
- [Practice & Test Models](#practice--test-models)
- [Evaluation & Feedback Models](#evaluation--feedback-models)
- [Vocabulary Models](#vocabulary-models)
- [Common Types](#common-types)

---

## TypeScript Interfaces

All models are provided as TypeScript interfaces for type safety. You can use these directly in TypeScript projects or as reference for JavaScript.

---

## Authentication Models

### UserAuthData

Complete authentication response after OAuth login.

```typescript
interface UserAuthData {
  session_id: string;              // UUID of the session
  user_id: string;                 // Google OAuth user ID
  user_name: string;               // User's display name
  avatar_url: string;              // Profile picture URL from Google
  access_token: string;            // JWT access token
  refresh_token: string;           // JWT refresh token
  access_token_expires_at: string; // ISO 8601 timestamp
  refresh_token_expires_at: string;// ISO 8601 timestamp
}
```

**Example:**
```json
{
  "session_id": "a3f21e45-8b9c-4d2f-9e1a-3b4c5d6e7f8a",
  "user_id": "108234567890123456789",
  "user_name": "John Doe",
  "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocI...",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_token_expires_at": "2025-11-12T15:30:00Z",
  "refresh_token_expires_at": "2025-11-19T15:00:00Z"
}
```

---

### TokenRenewRequest

Request to refresh access token.

```typescript
interface TokenRenewRequest {
  refresh_token: string; // JWT refresh token
}
```

**Example:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### TokenRenewResponse

Response after successful token renewal.

```typescript
interface TokenRenewResponse {
  access_token: string;            // New JWT access token
  access_token_expires_at: string; // ISO 8601 timestamp
}
```

**Example:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_token_expires_at": "2025-11-12T16:00:00Z"
}
```

---

## Topic & Question Models

### TopicTag

Individual tag within a topic.

```typescript
interface TopicTag {
  id: number;              // Topic tag ID
  tag: string;             // Tag name (e.g., "smartphones")
  popularity_score: number;// Popularity score (0-100)
}
```

**Example:**
```json
{
  "id": 5,
  "tag": "smartphones",
  "popularity_score": 85
}
```

---

### TopicOverview

Complete topic with tags and metadata.

```typescript
interface TopicOverview {
  id: number;              // Topic ID
  skill: string;           // "speaking", "listening", "reading", "writing"
  topic_name: string;      // Topic name (e.g., "Technology")
  tags: TopicTag[];        // Array of topic tags
  question_count: number;  // Total questions for this topic
}
```

**Example:**
```json
{
  "id": 1,
  "skill": "speaking",
  "topic_name": "Technology",
  "tags": [
    {
      "id": 5,
      "tag": "smartphones",
      "popularity_score": 85
    },
    {
      "id": 6,
      "tag": "social media",
      "popularity_score": 90
    }
  ],
  "question_count": 45
}
```

---

### QuestionWithDetails

Question with topic and tag information.

```typescript
interface QuestionWithDetails {
  id: number;              // Question ID
  part: number;            // IELTS part (1, 2, or 3)
  question_text: string;   // The actual question
  topic_id: number;        // Parent topic ID
  topic_name: string;      // Topic name
  tag_id: number;          // Topic tag ID
  tag_name: string;        // Tag name
  popularity_score: number;// Popularity score
  ai_generated: boolean;   // Was this question AI-generated?
}
```

**Example:**
```json
{
  "id": 101,
  "part": 1,
  "question_text": "Do you use a smartphone?",
  "topic_id": 1,
  "topic_name": "Technology",
  "tag_id": 5,
  "tag_name": "smartphones",
  "popularity_score": 85,
  "ai_generated": false
}
```

---

### ListQuestionsRequest

Query parameters for listing questions.

```typescript
interface ListQuestionsRequest {
  topic_id: number;      // Topic tag ID (required)
  part?: number;         // IELTS part filter (1, 2, or 3)
  sort_by?: string;      // Sort field (e.g., "popularity_score")
  page_index?: number;   // Page number (default: 1)
  page_size?: number;    // Items per page (default: 10, max: 100)
}
```

**URL Example:**
```
GET /questions?topic_id=5&part=1&sort_by=popularity_score&page_index=1&page_size=20
```

---

### QuestionDetail

Single question with full details.

```typescript
interface QuestionDetail {
  question_id: number;   // Question ID
  part: number;          // IELTS part
  question_text: string; // The question
  topic_tag_id: number;  // Topic tag ID
  topic_id: number;      // Parent topic ID
  topic_name: string;    // Topic name
  tag_name: string;      // Tag name
}
```

**Example:**
```json
{
  "question_id": 101,
  "part": 1,
  "question_text": "Do you use a smartphone?",
  "topic_tag_id": 5,
  "topic_id": 1,
  "topic_name": "Technology",
  "tag_name": "smartphones"
}
```

---

## Practice & Test Models

### ExamSetSummary

Brief exam set information.

```typescript
interface ExamSetSummary {
  id: number;     // Exam set ID
  title: string;  // Exam set title
  skill: string;  // "speaking", "listening", etc.
}
```

**Example:**
```json
{
  "id": 1,
  "title": "Speaking Test Set #1",
  "skill": "speaking"
}
```

---

### ExamSetDetail

Complete exam set with all question IDs.

```typescript
interface ExamSetDetail {
  id: number;          // Exam set ID
  title: string;       // Exam set title
  skill: string;       // Skill type
  part1_ids: number[]; // Array of Part 1 question IDs
  part2_ids: number[]; // Array of Part 2 question IDs
  part3_ids: number[]; // Array of Part 3 question IDs
  is_active: boolean;  // Is this exam set active?
}
```

**Example:**
```json
{
  "id": 1,
  "title": "Speaking Test Set #1",
  "skill": "speaking",
  "part1_ids": [1, 2, 3, 4],
  "part2_ids": [5, 6],
  "part3_ids": [7, 8, 9],
  "is_active": true
}
```

---

### StartTestRequest

Request to start a practice or simulation test.

```typescript
interface StartTestRequest {
  mode: "practice" | "simulation"; // Test mode
  exam_set_id: number;             // Exam set to use
  skill: string;                   // "speaking", etc.
  part_1: boolean;                 // Include Part 1?
  part_2: boolean;                 // Include Part 2?
  part_3: boolean;                 // Include Part 3?
  time_limit?: "0min" | "12min" | "14min"; // Optional time limit
}
```

**Example:**
```json
{
  "mode": "practice",
  "exam_set_id": 1,
  "skill": "speaking",
  "part_1": true,
  "part_2": true,
  "part_3": true,
  "time_limit": "12min"
}
```

---

### StartTestResponse

Response after starting a test session.

```typescript
interface StartTestResponse {
  test_session_id: string; // UUID of test session
  part_1: number[];        // Part 1 question IDs
  part_2: number[];        // Part 2 question IDs
  part_3: number[];        // Part 3 question IDs
  start_time: string;      // ISO 8601 timestamp
  end_time: string;        // ISO 8601 timestamp
  time_limit: string;      // Time limit (e.g., "12min")
}
```

**Example:**
```json
{
  "test_session_id": "b4e3f2c1-9d8e-4a5b-8c7d-6e5f4a3b2c1d",
  "part_1": [1, 2, 3, 4],
  "part_2": [5, 6],
  "part_3": [7, 8, 9],
  "start_time": "2025-11-12T10:00:00Z",
  "end_time": "2025-11-12T10:12:00Z",
  "time_limit": "12min"
}
```

---

### SimulationUploadURLsRequest

Request for presigned upload URLs in simulation mode.

```typescript
interface SimulationUploadURLsRequest {
  test_session_id: string;  // UUID of test session
  questions: {
    part_1?: number[];      // Part 1 question IDs
    part_2?: number[];      // Part 2 question IDs
    part_3?: number[];      // Part 3 question IDs
  };
}
```

**Example:**
```json
{
  "test_session_id": "b4e3f2c1-9d8e-4a5b-8c7d-6e5f4a3b2c1d",
  "questions": {
    "part_1": [1, 2, 3],
    "part_2": [4, 5],
    "part_3": [6, 7]
  }
}
```

---

### SimulationUploadURLsResponse

Presigned URLs for audio upload.

```typescript
interface SimulationUploadURLsResponse {
  upload_urls: {
    part_1?: Record<string, string>; // Question ID → Upload URL
    part_2?: Record<string, string>;
    part_3?: Record<string, string>;
  };
}
```

**Example:**
```json
{
  "upload_urls": {
    "part_1": {
      "1": "https://r2.cloudflare.com/bucket/presigned-url-1?signature=...",
      "2": "https://r2.cloudflare.com/bucket/presigned-url-2?signature=...",
      "3": "https://r2.cloudflare.com/bucket/presigned-url-3?signature=..."
    },
    "part_2": {
      "4": "https://r2.cloudflare.com/bucket/presigned-url-4?signature=...",
      "5": "https://r2.cloudflare.com/bucket/presigned-url-5?signature=..."
    }
  }
}
```

---

### ConfirmSimulationRequest

Confirm simulation submission after uploading all audio files.

```typescript
interface ConfirmSimulationRequest {
  test_session_id: string; // UUID of test session
  answers: {
    part_1?: Record<string, string>; // Question ID → Audio URL
    part_2?: Record<string, string>;
    part_3?: Record<string, string>;
  };
}
```

**Example:**
```json
{
  "test_session_id": "b4e3f2c1-9d8e-4a5b-8c7d-6e5f4a3b2c1d",
  "answers": {
    "part_1": {
      "1": "https://r2.cloudflare.com/bucket/user123/speaking/session456/audio1.wav",
      "2": "https://r2.cloudflare.com/bucket/user123/speaking/session456/audio2.wav"
    },
    "part_2": {
      "4": "https://r2.cloudflare.com/bucket/user123/speaking/session456/audio4.wav"
    }
  }
}
```

---

## Evaluation & Feedback Models

### SubmitAnswerResponse

Response after submitting a practice answer.

```typescript
interface SubmitAnswerResponse {
  user_answer_id: number;  // User answer ID
  question_id: number;     // Question ID
  audio_url: string;       // Presigned download URL for audio
  status: "processing";    // Processing status
}
```

**Example:**
```json
{
  "user_answer_id": 1234,
  "question_id": 101,
  "audio_url": "https://r2.cloudflare.com/bucket/presigned-download-url",
  "status": "processing"
}
```

---

### CriteriaFeedback

Feedback for a specific evaluation criterion.

```typescript
interface CriteriaFeedback {
  score: number;           // Score for this criterion (e.g., 7.0)
  strengths: string[];     // List of strengths
  weaknesses: string[];    // List of weaknesses
  suggestions: string[];   // Improvement suggestions
}
```

**Example:**
```json
{
  "score": 7.5,
  "strengths": [
    "Natural flow of speech",
    "Good use of linking words"
  ],
  "weaknesses": [
    "Some hesitation noted"
  ],
  "suggestions": [
    "Practice speaking without pauses",
    "Record yourself and listen back"
  ]
}
```

---

### FeedbackDetails

Complete feedback breakdown by criteria.

```typescript
interface FeedbackDetails {
  fluency?: CriteriaFeedback;           // Fluency & Coherence
  vocabulary?: CriteriaFeedback;        // Lexical Resource
  grammar?: CriteriaFeedback;           // Grammatical Range & Accuracy
  pronunciation?: CriteriaFeedback;     // Pronunciation
  // Additional criteria may vary by skill and part
}
```

**Example:**
```json
{
  "fluency": {
    "score": 7.0,
    "strengths": ["Natural flow", "Appropriate pace"],
    "weaknesses": ["Occasional hesitation"],
    "suggestions": ["Practice with a timer"]
  },
  "vocabulary": {
    "score": 8.0,
    "strengths": ["Wide range of vocabulary", "Precise word choice"],
    "weaknesses": [],
    "suggestions": ["Continue reading diverse materials"]
  },
  "grammar": {
    "score": 7.5,
    "strengths": ["Complex structures used correctly"],
    "weaknesses": ["Minor article errors"],
    "suggestions": ["Review article usage"]
  },
  "pronunciation": {
    "score": 7.5,
    "strengths": ["Clear articulation", "Good intonation"],
    "weaknesses": ["Some word stress issues"],
    "suggestions": ["Practice word stress patterns"]
  }
}
```

---

### UserAnswerWithEvaluation

Complete user answer with AI evaluation.

```typescript
interface UserAnswerWithEvaluation {
  id: number;                    // User answer ID
  question_id: number;           // Question ID
  part: number;                  // IELTS part
  question_text: string;         // The question
  answer_text: string;           // Transcribed text
  presigned_url: string;         // Audio download URL (presigned)
  submitted_at: string;          // ISO 8601 timestamp
  overall_score: number | null;  // Overall score (e.g., 7.5) or null if not evaluated
  overall_feedback: string | null; // General feedback text
  feedback_details: FeedbackDetails | null; // Detailed feedback by criteria
}
```

**Example:**
```json
{
  "id": 1234,
  "question_id": 101,
  "part": 1,
  "question_text": "Do you use a smartphone?",
  "answer_text": "Yes, I use a smartphone every day. It's very convenient for staying in touch with friends and family...",
  "presigned_url": "https://r2.cloudflare.com/bucket/presigned-download-url?signature=...",
  "submitted_at": "2025-11-12T10:30:00Z",
  "overall_score": 7.5,
  "overall_feedback": "Good response with clear ideas and natural delivery. Vocabulary is appropriate and pronunciation is generally clear.",
  "feedback_details": {
    "fluency": {
      "score": 7.0,
      "strengths": ["Natural flow"],
      "weaknesses": ["Some hesitation"],
      "suggestions": ["Practice more"]
    },
    "vocabulary": {
      "score": 8.0,
      "strengths": ["Good range"],
      "weaknesses": [],
      "suggestions": ["Keep it up"]
    }
  }
}
```

---

### WebSocketFeedbackMessage

Real-time feedback message via WebSocket.

```typescript
interface WebSocketFeedbackMessage {
  user_answer_id: number;           // User answer ID
  status: "completed" | "failed";   // Processing status
  overall_score?: number;           // Overall score
  overall_feedback?: string;        // General feedback
  feedback_details?: FeedbackDetails; // Detailed feedback
  error?: string;                   // Error message if failed
}
```

**Example:**
```json
{
  "user_answer_id": 1234,
  "status": "completed",
  "overall_score": 7.5,
  "overall_feedback": "Good response...",
  "feedback_details": { ... }
}
```

---

## Vocabulary Models

### SavedWord

User's saved vocabulary word.

```typescript
interface SavedWord {
  word: string;       // The saved word
  created_at: string; // ISO 8601 timestamp
}
```

**Example:**
```json
{
  "word": "sophisticated",
  "created_at": "2025-11-10T10:00:00Z"
}
```

---

### SaveWordRequest

Request to save a word.

```typescript
interface SaveWordRequest {
  word: string; // Word to save
}
```

**Example:**
```json
{
  "word": "eloquent"
}
```

---

### DictionaryDefinition

Word definition from dictionary API.

```typescript
interface DictionaryDefinition {
  word: string;                    // The word
  phonetic?: string;               // Phonetic pronunciation
  phonetics?: PhoneticItem[];      // Phonetic variations
  meanings: Meaning[];             // Word meanings
  license?: License;               // License info
  sourceUrls?: string[];           // Source URLs
}

interface PhoneticItem {
  text: string;      // Phonetic text
  audio?: string;    // Audio pronunciation URL
}

interface Meaning {
  partOfSpeech: string;         // "noun", "verb", "adjective", etc.
  definitions: DefinitionItem[];
  synonyms?: string[];
  antonyms?: string[];
}

interface DefinitionItem {
  definition: string;  // The definition
  example?: string;    // Usage example
  synonyms?: string[];
  antonyms?: string[];
}

interface License {
  name: string;
  url: string;
}
```

**Example:**
```json
{
  "word": "sophisticated",
  "phonetic": "/səˈfɪstɪkeɪtɪd/",
  "phonetics": [
    {
      "text": "/səˈfɪstɪkeɪtɪd/",
      "audio": "https://api.dictionaryapi.dev/media/pronunciations/en/sophisticated-us.mp3"
    }
  ],
  "meanings": [
    {
      "partOfSpeech": "adjective",
      "definitions": [
        {
          "definition": "Having or showing a great deal of worldly experience and knowledge of fashion and culture",
          "example": "A sophisticated lifestyle"
        }
      ],
      "synonyms": ["worldly", "refined", "cultured"],
      "antonyms": ["naive", "unsophisticated"]
    }
  ]
}
```

---

## Common Types

### Skill

```typescript
type Skill = "speaking" | "listening" | "reading" | "writing";
```

---

### IELTSPart

```typescript
type IELTSPart = 1 | 2 | 3;
```

---

### TestMode

```typescript
type TestMode = "practice" | "simulation";
```

---

### TimeLimit

```typescript
type TimeLimit = "0min" | "12min" | "14min";
```

---

### ProcessingStatus

```typescript
type ProcessingStatus = "processing" | "completed" | "failed";
```

---

## Complete TypeScript Definitions File

You can copy this entire file for use in your TypeScript project:

```typescript
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
```

---

## Validation Rules

### Field Constraints

| Field | Type | Min | Max | Pattern |
|-------|------|-----|-----|---------|
| username | string | 1 | 30 | - |
| word | string | 1 | 255 | Alphanumeric |
| page_index | number | 1 | - | Integer |
| page_size | number | 1 | 100 | Integer |
| part | number | 1 | 3 | 1, 2, or 3 |
| overall_score | number | 0 | 9 | Decimal (1 place) |

---

## Null vs Undefined

- **null**: Field exists but has no value (e.g., evaluation not yet completed)
- **undefined/omitted**: Field not applicable or not requested

**Example:**
```json
{
  "overall_score": null,  // Not yet evaluated
  "overall_feedback": null
}
```

---

## Date Format

All dates use ISO 8601 format:

```
2025-11-12T10:30:00Z
```

**JavaScript parsing:**
```javascript
const date = new Date("2025-11-12T10:30:00Z");
```

---

## Array vs Object

### Arrays
Used for ordered lists:
- `part1_ids: number[]`
- `tags: TopicTag[]`

### Objects (Records)
Used for key-value mappings:
- `upload_urls: Record<string, string>`
- `answers: Record<string, string>`

---

This completes the data models reference. For API endpoint usage, see [API_ENDPOINTS.md](./API_ENDPOINTS.md).
