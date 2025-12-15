# Backend Integration Guide

This document explains how the frontend integrates with the AI IELTS backend API.

## Backend Documentation
All backend API documentation is located in `aielts-backend/docs/`:
- **README.md** - Overview and quick start
- **API_ENDPOINTS.md** - Complete API reference
- **AUTHENTICATION.md** - OAuth flow and JWT tokens
- **DATA_MODELS.md** - Request/response schemas
- **ERROR_HANDLING.md** - Error codes and troubleshooting
- **INTEGRATION_GUIDE.md** - Step-by-step integration examples

## Base URLs

### Production
```typescript
const API_BASE_URL = 'https://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1';
const WS_BASE_URL = 'wss://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1';
```

### Local Development
```typescript
const API_BASE_URL = 'http://localhost:8301/api/v1';
const WS_BASE_URL = 'ws://localhost:8301/api/v1';
```

## Service Architecture

### 1. Core Services

#### ApiService (`services/api.service.ts`)
- **Purpose**: Base HTTP client with automatic token refresh
- **Features**:
  - Automatic Bearer token injection
  - 401 error handling with token refresh
  - Request/response interceptors
  - Retry logic for failed requests

#### AuthService (`services/auth.service.ts`)
- **Purpose**: OAuth authentication and token management
- **Features**:
  - Google OAuth login flow
  - Token storage in SecureStore
  - Automatic token refresh
  - Session validation

**Key Methods**:
```typescript
AuthService.loginWithOAuth(provider) // Initiate OAuth
AuthService.handleCallback(url) // Process OAuth callback
AuthService.getToken() // Get current access token
AuthService.refreshAccessToken() // Refresh expired token
AuthService.logout() // Logout and clear tokens
```

#### TopicsService (`services/topics.service.ts`)
- **Endpoint**: `GET /topics`
- **Purpose**: Fetch speaking topics with tags
- **Returns**: Array of `TopicOverview`

```typescript
const topics = await TopicsService.listTopics();
```

#### QuestionsService (`services/questions.service.ts`)
- **Endpoints**:
  - `GET /questions?topic_id={id}&part={part}` - List questions
  - `GET /questions/{id}` - Get single question
- **Purpose**: Fetch IELTS questions by topic

```typescript
const questions = await QuestionsService.listQuestions({
  topic_id: 1,
  part: 1,
  page_index: 1,
  page_size: 20
});

const question = await QuestionsService.getQuestion(101);
```

#### AnswersService (`services/answers.service.ts`)
- **Endpoints**:
  - `POST /questions/{id}/answers` - Submit audio answer
  - `GET /user_answers?question_id={id}` - Get user answers with feedback
- **Purpose**: Submit answers and retrieve AI feedback

```typescript
// Submit audio answer
const result = await AnswersService.submitAnswer(questionId, audioBlob);

// Get all answers for a question
const answers = await AnswersService.getUserAnswers(questionId);
```

#### ExamsService (`services/exams.service.ts`)
- **Endpoints**:
  - `GET /examsets?skill={skill}` - List exam sets
  - `GET /examsets/{id}` - Get exam set details
  - `POST /start_test` - Start practice/simulation test
  - `POST /get_simulation_upload_urls` - Get presigned upload URLs
  - `POST /confirm_simulation_submission` - Confirm test submission
- **Purpose**: Manage practice and simulation tests

```typescript
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

// Get upload URLs for simulation
const urls = await ExamsService.getSimulationUploadUrls({
  test_session_id: session.test_session_id,
  questions: {
    part_1: [1, 2, 3],
    part_2: [4, 5]
  }
});

// Upload audio to R2
await ExamsService.uploadAudioToR2(presignedUrl, audioBlob);

// Confirm submission
await ExamsService.confirmSimulationSubmission({
  test_session_id: session.test_session_id,
  answers: {
    part_1: { '1': 'https://...', '2': 'https://...' }
  }
});
```

#### VocabularyService (`services/vocabulary.service.ts`)
- **Endpoints**:
  - `GET /users/words` - Get saved words
  - `POST /users/words` - Save a word
  - `DELETE /users/words/{word}` - Delete a word
  - `GET /vocabulary/search?q={word}` - Dictionary lookup (public)
- **Purpose**: Manage user vocabulary

```typescript
const savedWords = await VocabularyService.getSavedWords();
await VocabularyService.saveWord('sophisticated');
await VocabularyService.deleteWord('sophisticated');
const definition = await VocabularyService.searchWord('eloquent');
```

#### WebSocketService (`services/websocket.service.ts`)
- **Endpoint**: `GET /ws/feedback?token={token}`
- **Purpose**: Real-time AI feedback updates
- **Features**:
  - Auto-reconnect on disconnect
  - Event-based callbacks
  - Connection state management

```typescript
// Connect to WebSocket
await WebSocketService.connect();

// Listen for feedback
const unsubscribe = WebSocketService.onFeedback((message) => {
  console.log('Feedback received:', message);
  // message.user_answer_id
  // message.status: 'completed' | 'failed'
  // message.overall_score
  // message.feedback_details
});

// Disconnect
WebSocketService.disconnect();
```

### 2. Authentication Context (`contexts/auth.context.tsx`)

Provides global authentication state:

```typescript
const {
  isLoading,
  isAuthenticated,
  user,
  token,
  login,
  logout,
  handleAuthCallback,
  checkSession
} = useAuth();
```

**Usage in Components**:
```typescript
import { useAuth } from '@/contexts/auth.context';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginButton onPress={() => login('Google')} />;
  }

  return <Text>Welcome {user.name}!</Text>;
}
```

## TypeScript Types

All backend types are defined in `services/types.ts`:

```typescript
import {
  TopicOverview,
  QuestionWithDetails,
  UserAnswerWithEvaluation,
  StartTestRequest,
  WebSocketFeedbackMessage,
  // ... and more
} from '@/services/types';
```

## Authentication Flow

### 1. Login Flow

```typescript
// 1. User clicks "Login with Google"
await AuthService.loginWithOAuth('Google');

// 2. Backend redirects to: ielts://oauth-callback?data=<base64>

// 3. App handles deep link
const url = event.url; // From deep linking
await AuthService.handleCallback(url);

// 4. Tokens stored in SecureStore
// 5. User redirected to dashboard
```

### 2. Making Authenticated Requests

All API requests automatically include the Bearer token:

```typescript
// ApiService automatically adds: Authorization: Bearer <token>
const topics = await TopicsService.listTopics();
```

### 3. Token Refresh

When access token expires (401 error), ApiService automatically:
1. Pauses the failed request
2. Refreshes the token using refresh token
3. Retries the original request with new token
4. If refresh fails, redirects to login

## Common Use Cases

### Use Case 1: Display Topics

```typescript
import { useState, useEffect } from 'react';
import { TopicsService } from '@/services/topics.service';

function TopicsList() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTopics() {
      try {
        const data = await TopicsService.listTopics();
        setTopics(data);
      } catch (error) {
        console.error('Failed to load topics:', error);
      } finally {
        setLoading(false);
      }
    }
    loadTopics();
  }, []);

  if (loading) return <Text>Loading...</Text>;

  return (
    <FlatList
      data={topics}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Text>{item.topic_name}</Text>
          <Text>{item.question_count} questions</Text>
        </View>
      )}
    />
  );
}
```

### Use Case 2: Record and Submit Audio

```typescript
import { Audio } from 'expo-av';
import { AnswersService } from '@/services/answers.service';

async function recordAndSubmit(questionId: number) {
  // 1. Record audio
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
  await recording.startAsync();

  // ... user speaks ...

  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();

  // 2. Convert to blob
  const response = await fetch(uri);
  const blob = await response.blob();

  // 3. Submit to backend
  const result = await AnswersService.submitAnswer(questionId, blob);

  console.log('Answer submitted:', result.user_answer_id);
  console.log('Status:', result.status); // 'processing'
}
```

### Use Case 3: Real-time Feedback

```typescript
import { useEffect } from 'react';
import { WebSocketService } from '@/services/websocket.service';

function FeedbackListener({ userAnswerId }) {
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    WebSocketService.connect();

    // Listen for feedback
    const unsubscribe = WebSocketService.onFeedback((message) => {
      if (message.user_answer_id === userAnswerId) {
        setFeedback(message);
      }
    });

    return () => {
      unsubscribe();
      WebSocketService.disconnect();
    };
  }, [userAnswerId]);

  if (!feedback) {
    return <Text>Waiting for AI feedback...</Text>;
  }

  return (
    <View>
      <Text>Score: {feedback.overall_score}</Text>
      <Text>{feedback.overall_feedback}</Text>
      {/* Display detailed feedback */}
    </View>
  );
}
```

### Use Case 4: Simulation Test Flow

```typescript
async function runSimulationTest() {
  // 1. Start test
  const session = await ExamsService.startTest({
    mode: 'simulation',
    exam_set_id: 1,
    skill: 'speaking',
    part_1: true,
    part_2: true,
    part_3: true,
    time_limit: '12min'
  });

  // 2. Get upload URLs
  const urls = await ExamsService.getSimulationUploadUrls({
    test_session_id: session.test_session_id,
    questions: {
      part_1: session.part_1,
      part_2: session.part_2,
      part_3: session.part_3
    }
  });

  // 3. Record and upload each answer
  const uploadedUrls = {};
  for (const [questionId, uploadUrl] of Object.entries(urls.upload_urls.part_1)) {
    const audioBlob = await recordAudio(); // Your recording logic
    await ExamsService.uploadAudioToR2(uploadUrl, audioBlob);
    uploadedUrls[questionId] = uploadUrl.split('?')[0]; // Remove query params
  }

  // 4. Confirm submission
  await ExamsService.confirmSimulationSubmission({
    test_session_id: session.test_session_id,
    answers: {
      part_1: uploadedUrls
    }
  });
}
```

## Error Handling

All services throw errors that should be caught:

```typescript
try {
  const topics = await TopicsService.listTopics();
} catch (error) {
  if (error.message.includes('401')) {
    // Token expired - ApiService will auto-refresh
  } else if (error.message.includes('404')) {
    // Resource not found
  } else if (error.message.includes('500')) {
    // Server error
  } else {
    // Network error or other
    console.error('Failed to load topics:', error);
  }
}
```

## Environment Configuration

To switch between local and production:

1. Update in `services/api.service.ts`:
```typescript
// For local development
const API_BASE_URL = 'http://localhost:8301/api/v1';

// For production
const API_BASE_URL = 'https://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1';
```

2. Update in `services/auth.service.ts`:
```typescript
// Same as above
const API_BASE_URL = '...';
```

3. Update in `services/websocket.service.ts`:
```typescript
// For local
const WS_BASE_URL = 'ws://localhost:8301/api/v1';

// For production
const WS_BASE_URL = 'wss://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1';
```

## Deep Linking Configuration

The app uses custom URL scheme `ielts://` for OAuth callbacks.

**app.json**:
```json
{
  "expo": {
    "scheme": "ielts"
  }
}
```

**iOS (ios/aielts/Info.plist)**:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>ielts</string>
    </array>
  </dict>
</array>
```

**Android (android/app/src/main/AndroidManifest.xml)**:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="ielts" />
</intent-filter>
```

## Testing Endpoints

Use the backend documentation to verify all endpoints:

```bash
# Health check
curl http://localhost:8301/api/v1/ping

# Get topics (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8301/api/v1/topics
```

## Next Steps

1. ✅ All core services implemented
2. ✅ Authentication flow working
3. ✅ TypeScript types defined
4. ✅ WebSocket support added
5. 🔨 Build UI components for each feature
6. 🔨 Implement audio recording UI
7. 🔨 Add feedback display screens
8. 🔨 Create test simulation UI

## Support

For backend API questions, refer to:
- `aielts-backend/docs/README.md`
- `aielts-backend/docs/INTEGRATION_GUIDE.md`
