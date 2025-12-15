# Quick Start Guide

## What's Been Done ✅

Your React Native Expo frontend is **fully integrated** with the AI IELTS backend! Here's what's ready:

### ✅ Complete Services Layer
All backend endpoints are wrapped in easy-to-use TypeScript services:
- Authentication (OAuth + JWT)
- Topics & Questions
- Audio submissions
- AI Feedback (REST + WebSocket)
- Vocabulary
- Practice & Simulation tests

### ✅ Custom React Hooks
Reusable hooks for common tasks:
- `useTopics()` - Load topics with auto-refresh
- `useQuestions()` - Load questions with pagination
- `useAudioRecorder()` - Record audio easily
- `useWebSocketFeedback()` - Real-time feedback

### ✅ Centralized Configuration
Switch environments with one line:
```typescript
// config/api.config.ts
const CURRENT_ENV: Environment = 'production'; // or 'local'
```

## Quick Setup

### 1. Install Dependencies
```bash
cd aielts-frontend
npm install
```

### 2. Configure Environment
Edit `config/api.config.ts` and set your environment:
```typescript
const CURRENT_ENV: Environment = 'local'; // for local dev
// or
const CURRENT_ENV: Environment = 'production'; // for production
```

### 3. Run the App
```bash
npm start
```

## Usage Examples

### Example 1: Show Topics
```typescript
import { useTopics } from '@/hooks/use-topics';

function TopicsScreen() {
  const { topics, loading, error } = useTopics();

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <FlatList
      data={topics}
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

### Example 2: Record & Submit Answer
```typescript
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { AnswersService } from '@/services/answers.service';

function PracticeScreen({ questionId }) {
  const recorder = useAudioRecorder();

  async function handleSubmit() {
    const audioBlob = await recorder.stopRecording();
    const result = await AnswersService.submitAnswer(questionId, audioBlob);
    console.log('Answer ID:', result.user_answer_id);
  }

  return (
    <View>
      {!recorder.isRecording ? (
        <Button onPress={recorder.startRecording}>Record</Button>
      ) : (
        <>
          <Text>Recording... {recorder.duration}ms</Text>
          <Button onPress={handleSubmit}>Stop & Submit</Button>
        </>
      )}
    </View>
  );
}
```

### Example 3: Real-time Feedback
```typescript
import { useWebSocketFeedback } from '@/hooks/use-websocket-feedback';

function FeedbackScreen({ userAnswerId }) {
  const { feedback, connected } = useWebSocketFeedback(userAnswerId);

  if (!connected) return <Text>Connecting...</Text>;
  if (!feedback) return <Text>Processing your answer...</Text>;

  return (
    <View>
      <Text style={{ fontSize: 48 }}>{feedback.overall_score}</Text>
      <Text>{feedback.overall_feedback}</Text>
    </View>
  );
}
```

### Example 4: Login/Logout
```typescript
import { useAuth } from '@/contexts/auth.context';

function ProfileScreen() {
  const { isAuthenticated, user, login, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <Button onPress={() => login('Google')}>
        Login with Google
      </Button>
    );
  }

  return (
    <View>
      <Text>Welcome, {user.name}!</Text>
      <Text>{user.email}</Text>
      <Button onPress={logout}>Logout</Button>
    </View>
  );
}
```

## File Organization

```
services/           # Backend API integration
  ├── api.service.ts        # Base HTTP client
  ├── auth.service.ts       # OAuth & JWT
  ├── topics.service.ts     # Topics API
  ├── questions.service.ts  # Questions API
  ├── answers.service.ts    # Answers & feedback
  ├── exams.service.ts      # Tests & simulations
  ├── vocabulary.service.ts # Dictionary & saved words
  ├── websocket.service.ts  # Real-time feedback
  └── types.ts              # TypeScript types

hooks/              # Reusable React hooks
  ├── use-topics.ts
  ├── use-questions.ts
  ├── use-audio-recorder.ts
  └── use-websocket-feedback.ts

contexts/           # Global state
  └── auth.context.tsx      # Authentication state

config/             # Configuration
  └── api.config.ts         # API URLs & settings
```

## Common Tasks

### Switch to Local Backend
```typescript
// config/api.config.ts
const CURRENT_ENV: Environment = 'local';
```

Make sure backend is running:
```bash
# In aielts-backend folder (don't touch it, just verify it's running)
curl http://localhost:8301/api/v1/ping
```

### Switch to Production
```typescript
// config/api.config.ts
const CURRENT_ENV: Environment = 'production';
```

### Test Authentication
1. Run app: `npm start`
2. Click login button
3. Authenticate with Google
4. Should redirect back to app with user logged in

### Test API Calls
```typescript
import { TopicsService } from '@/services/topics.service';

// In any component
useEffect(() => {
  TopicsService.listTopics()
    .then(topics => console.log('Topics:', topics))
    .catch(error => console.error('Error:', error));
}, []);
```

## What to Build Next

### Priority 1: Core UI
1. **Topics List Screen** - Show all topics
2. **Questions List Screen** - Show questions by topic
3. **Practice Screen** - Question + audio recorder
4. **Feedback Screen** - Show AI evaluation

### Priority 2: Test Features
1. **Exam Selection** - Choose test sets
2. **Practice Mode** - Answer questions one-by-one
3. **Simulation Mode** - Timed full test
4. **Results** - View scores and feedback

### Priority 3: Additional
1. **Vocabulary** - Saved words & dictionary
2. **Profile** - User settings & history
3. **Progress** - Track improvement over time

## Documentation

### For Integration Details
See `BACKEND_INTEGRATION.md` for:
- Complete service documentation
- API endpoint reference
- Authentication flow
- Error handling
- WebSocket usage

### For Implementation Status
See `FRONTEND_STATUS.md` for:
- What's completed
- What's pending
- Code examples
- File structure

### For Backend API
See `aielts-backend/docs/`:
- `API_ENDPOINTS.md` - All endpoints
- `AUTHENTICATION.md` - OAuth & JWT
- `DATA_MODELS.md` - TypeScript types
- `ERROR_HANDLING.md` - Error codes
- `INTEGRATION_GUIDE.md` - Examples

## Troubleshooting

### "No authentication token found"
- User needs to login: `await login('Google')`
- Check if token exists: `await AuthService.getToken()`

### "401 Unauthorized"
- Token expired → ApiService auto-refreshes
- If refresh fails → User logged out automatically

### "Network request failed"
- Check backend is running
- Check `CURRENT_ENV` in `config/api.config.ts`
- Check device/emulator has internet

### OAuth not redirecting back
- Check deep linking configured (`ielts://` scheme)
- Check `app.json` has `"scheme": "ielts"`
- View logs during OAuth flow

## Next Steps

1. ✅ **Services are ready** - No backend code needed!
2. 🔨 **Build UI screens** - Use the hooks and services
3. 🔨 **Style components** - Make it beautiful
4. 🔨 **Add features** - Vocabulary, progress, etc.

## Need Help?

- **Integration**: See `BACKEND_INTEGRATION.md`
- **Status**: See `FRONTEND_STATUS.md`
- **Backend API**: See `aielts-backend/docs/`

---

**Everything is ready! Just start building your UI using the provided services and hooks.**

Happy coding! 🚀
