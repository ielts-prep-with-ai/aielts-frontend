# Services Documentation

This directory contains all the API services for the AI IELTS application. All services are implemented according to the backend API documentation in `backend_docs/`.

## Table of Contents

- [Overview](#overview)
- [Service List](#service-list)
- [Usage Examples](#usage-examples)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)

---

## Overview

All services follow a consistent pattern:
- **Automatic authentication**: Most endpoints automatically include the access token
- **Token refresh**: Automatic token refresh on 401 errors
- **Type safety**: Full TypeScript support with interfaces
- **Error handling**: Consistent error logging and propagation

---

## Service List

### Core Services

#### ApiService
Base service that handles all HTTP requests with automatic token management.

**Features:**
- Automatic token attachment
- Token refresh on 401 errors
- Request/response interceptors
- Error handling

**Methods:**
- `get<T>(endpoint, options?)`
- `post<T>(endpoint, data?, options?)`
- `put<T>(endpoint, data?, options?)`
- `patch<T>(endpoint, data?, options?)`
- `delete<T>(endpoint, options?)`

#### AuthService
Handles user authentication and session management.

**Methods:**
- `loginWithOAuth(provider)` - Start OAuth login flow
- `handleCallback(url)` - Process OAuth callback
- `getToken()` - Get current access token
- `getRefreshToken()` - Get refresh token
- `getUserData()` - Get stored user data
- `isAuthenticated()` - Check authentication status
- `logout()` - Logout and clear session
- `refreshAccessToken()` - Refresh access token

---

### Feature Services

#### TopicsService
Manages speaking topics and tags.

**Methods:**
- `listTopics()` - Get all topics with tags and question counts

**Example:**
```typescript
import { TopicsService } from '@/services';

const topics = await TopicsService.listTopics();
console.log(topics[0].topic_name); // "Technology"
```

---

#### QuestionsService
Manages questions for practice and tests.

**Methods:**
- `listQuestions(params)` - Get paginated questions by topic
- `getQuestion(questionId)` - Get single question details

**Example:**
```typescript
import { QuestionsService } from '@/services';

// List questions for a topic
const questions = await QuestionsService.listQuestions({
  topic_id: 5,
  part: 1,
  page_index: 1,
  page_size: 20,
  sort_by: 'popularity_score'
});

// Get specific question
const question = await QuestionsService.getQuestion(101);
```

---

#### ExamsService
Manages exam sets, test sessions, and simulation mode.

**Methods:**
- `listExamSets(skill)` - Get exam sets for a skill
- `getExamSet(examSetId)` - Get exam set details
- `startTest(request)` - Start a practice or simulation test
- `getSimulationUploadUrls(request)` - Get presigned URLs for audio upload
- `uploadAudioToR2(url, blob)` - Upload audio to R2 storage
- `confirmSimulationSubmission(request)` - Confirm simulation submission

**Example:**
```typescript
import { ExamsService } from '@/services';

// Get exam sets
const examSets = await ExamsService.listExamSets('speaking');

// Start a test
const session = await ExamsService.startTest({
  mode: 'practice',
  exam_set_id: 1,
  skill: 'speaking',
  part_1: true,
  part_2: true,
  part_3: true,
  time_limit: '12min'
});

// For simulation mode
const urls = await ExamsService.getSimulationUploadUrls({
  test_session_id: session.test_session_id,
  questions: {
    part_1: [1, 2, 3],
    part_2: [4, 5]
  }
});

// Upload audio
await ExamsService.uploadAudioToR2(urls.upload_urls.part_1['1'], audioBlob);

// Confirm submission
await ExamsService.confirmSimulationSubmission({
  test_session_id: session.test_session_id,
  answers: {
    part_1: {
      '1': 'https://r2.cloudflare.com/...',
      '2': 'https://r2.cloudflare.com/...'
    }
  }
});
```

---

#### AnswersService
Handles answer submission and retrieval with AI feedback.

**Methods:**
- `submitAnswer(questionId, audioBlob)` - Submit audio answer (practice mode)
- `getUserAnswers(questionId)` - Get user answers with evaluations

**Example:**
```typescript
import { AnswersService } from '@/services';

// Submit answer
const result = await AnswersService.submitAnswer(101, audioBlob);
console.log(result.user_answer_id); // 1234
console.log(result.status); // "processing"

// Get previous answers
const answers = await AnswersService.getUserAnswers(101);
console.log(answers[0].overall_score); // 7.5
console.log(answers[0].overall_feedback);
```

---

#### VocabularyService
Manages user's saved vocabulary.

**Methods:**
- `getSavedWords()` - Get all saved words
- `saveWord(word)` - Save a word
- `deleteWord(word)` - Delete a saved word
- `searchWord(word)` - Look up word definition (public, no auth)

**Example:**
```typescript
import { VocabularyService } from '@/services';

// Save a word
await VocabularyService.saveWord('sophisticated');

// Get saved words
const words = await VocabularyService.getSavedWords();

// Search dictionary (no auth required)
const definition = await VocabularyService.searchWord('eloquent');
console.log(definition.phonetic); // "/ˈɛləkwənt/"
console.log(definition.meanings[0].definitions[0].definition);

// Delete a word
await VocabularyService.deleteWord('sophisticated');
```

---

#### WebSocketService
Real-time feedback updates via WebSocket.

**Methods:**
- `connect()` - Connect to feedback WebSocket
- `disconnect()` - Disconnect from WebSocket
- `onFeedback(callback)` - Subscribe to feedback messages
- `onError(callback)` - Subscribe to error events
- `onClose(callback)` - Subscribe to close events
- `isConnected()` - Check connection status

**Example:**
```typescript
import { WebSocketService } from '@/services';

// Connect
await WebSocketService.connect();

// Listen for feedback
const unsubscribe = WebSocketService.onFeedback((message) => {
  console.log('Received feedback:', message);
  console.log('User answer ID:', message.user_answer_id);
  console.log('Status:', message.status);
  console.log('Score:', message.overall_score);
  console.log('Feedback:', message.overall_feedback);
});

// Clean up when done
unsubscribe();
WebSocketService.disconnect();
```

**React Hook Example:**
```typescript
import { useEffect, useState } from 'react';
import { WebSocketService } from '@/services';

function useFeedback() {
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    // Connect
    WebSocketService.connect();

    // Subscribe to feedback
    const unsubscribe = WebSocketService.onFeedback((message) => {
      if (message.status === 'completed') {
        setFeedback(message);
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
      WebSocketService.disconnect();
    };
  }, []);

  return feedback;
}
```

---

## Usage Examples

### Complete Practice Flow

```typescript
import {
  TopicsService,
  QuestionsService,
  AnswersService,
  WebSocketService
} from '@/services';

async function practiceFlow() {
  // 1. Get topics
  const topics = await TopicsService.listTopics();
  const techTopic = topics.find(t => t.topic_name === 'Technology');

  // 2. Get questions for a tag
  const questions = await QuestionsService.listQuestions({
    topic_id: techTopic.tags[0].id,
    part: 1,
    page_size: 10
  });

  // 3. Connect to WebSocket for real-time feedback
  await WebSocketService.connect();
  WebSocketService.onFeedback((feedback) => {
    console.log('AI Feedback received:', feedback);
  });

  // 4. Submit answer
  const audioBlob = new Blob([audioData], { type: 'audio/wav' });
  const result = await AnswersService.submitAnswer(questions[0].id, audioBlob);

  // 5. Wait for feedback via WebSocket or poll
  // Feedback will arrive via WebSocket callback

  // 6. Get all previous answers for this question
  const previousAnswers = await AnswersService.getUserAnswers(questions[0].id);
}
```

### Complete Simulation Flow

```typescript
import { ExamsService } from '@/services';

async function simulationFlow() {
  // 1. Get exam sets
  const examSets = await ExamsService.listExamSets('speaking');

  // 2. Start simulation
  const session = await ExamsService.startTest({
    mode: 'simulation',
    exam_set_id: examSets[0].id,
    skill: 'speaking',
    part_1: true,
    part_2: true,
    part_3: true,
    time_limit: '14min'
  });

  // 3. Get upload URLs
  const { upload_urls } = await ExamsService.getSimulationUploadUrls({
    test_session_id: session.test_session_id,
    questions: {
      part_1: session.part_1,
      part_2: session.part_2,
      part_3: session.part_3
    }
  });

  // 4. Record and upload audio for each question
  const audioFiles = {}; // Record audio files

  for (const [questionId, uploadUrl] of Object.entries(upload_urls.part_1)) {
    await ExamsService.uploadAudioToR2(uploadUrl, audioFiles[questionId]);
  }

  // 5. Confirm submission
  await ExamsService.confirmSimulationSubmission({
    test_session_id: session.test_session_id,
    answers: {
      part_1: Object.fromEntries(
        Object.keys(upload_urls.part_1).map(id => [id, `uploaded-url-${id}`])
      )
    }
  });

  // Processing will happen in background
  // Results available via WebSocket or polling
}
```

---

## Type Definitions

All TypeScript types are defined in `types.ts`. Import them as needed:

```typescript
import type {
  TopicOverview,
  QuestionWithDetails,
  StartTestRequest,
  UserAnswerWithEvaluation,
  WebSocketFeedbackMessage
} from '@/services';
```

Key types:
- `Skill` - "speaking" | "listening" | "reading" | "writing"
- `IELTSPart` - 1 | 2 | 3
- `TestMode` - "practice" | "simulation"
- `TimeLimit` - "0min" | "12min" | "14min"

See `types.ts` for complete type definitions.

---

## Error Handling

All services throw errors that should be caught and handled:

```typescript
try {
  const topics = await TopicsService.listTopics();
} catch (error) {
  if (error.message.includes('401')) {
    // Token expired, user should re-login
    router.push('/login');
  } else {
    // Other error
    console.error('Failed to fetch topics:', error);
    showErrorToast(error.message);
  }
}
```

Common error scenarios:
- **401 Unauthorized**: Token expired or invalid (auto-refresh attempted)
- **404 Not Found**: Resource doesn't exist
- **400 Bad Request**: Invalid request parameters
- **500 Server Error**: Backend issue

---

## File Structure

```
services/
├── README.md                   # This file
├── index.ts                    # Central export file
├── types.ts                    # TypeScript type definitions
├── api.service.ts              # Base API service
├── auth.service.ts             # Authentication service
├── topics.service.ts           # Topics service
├── questions.service.ts        # Questions service
├── exams.service.ts            # Exams/tests service
├── answers.service.ts          # User answers service
├── vocabulary.service.ts       # Vocabulary service
└── websocket.service.ts        # WebSocket service
```

---

## Backend Documentation

For detailed API endpoint documentation, see:
- `backend_docs/API_ENDPOINTS.md` - Complete API reference
- `backend_docs/AUTHENTICATION.md` - Authentication guide
- `backend_docs/DATA_MODELS.md` - Data structures
- `backend_docs/ERROR_HANDLING.md` - Error handling
- `backend_docs/INTEGRATION_GUIDE.md` - Integration guide

---

## Contributing

When adding new services:
1. Create a new service file (e.g., `feature.service.ts`)
2. Follow the existing naming conventions
3. Add TypeScript types to `types.ts`
4. Export from `index.ts`
5. Update this README with usage examples
6. Add comprehensive logging
7. Handle errors appropriately

---

## Support

For issues or questions:
- Check the backend documentation in `backend_docs/`
- Review existing service implementations
- Check console logs for detailed error messages
