# Developer Guide - AI IELTS Frontend

## Quick Reference

### 🚀 Getting Started

```bash
cd aielts-frontend
npm install
npm start
```

Press `i` for iOS, `a` for Android, `w` for web.

### 📁 Project Structure

```
aielts-frontend/
├── app/              # Screens (Expo Router)
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── services/        # API integration
├── contexts/        # Global state
└── config/          # Configuration
```

## Common Tasks

### Add a New Screen

1. Create file in `app/`:
```typescript
// app/my-screen.tsx
import { View, Text } from 'react-native';
import { Header } from '@/components/header';

export default function MyScreen() {
  return (
    <View style={{flex: 1, backgroundColor: '#F5F5F5'}}>
      <Header title="My Screen" />
      <Text>Content here</Text>
    </View>
  );
}
```

2. Add to navigation in `app/_layout.tsx`:
```typescript
<Stack.Screen name="my-screen" options={{ headerShown: false }} />
```

3. Navigate to it:
```typescript
router.push('/my-screen');
```

### Use Existing Components

```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingView } from '@/components/ui/loading-view';
import { ErrorView } from '@/components/ui/error-view';
import { EmptyState } from '@/components/ui/empty-state';

// In your component:
<Button title="Click Me" onPress={() => {}} variant="primary" />
<Card><Text>Content</Text></Card>
<LoadingView message="Loading..." />
<ErrorView message="Error occurred" onRetry={() => {}} />
<EmptyState message="No data" icon="tray" />
```

### Use Custom Hooks

```typescript
import { useTopics } from '@/hooks/use-topics';
import { useQuestions } from '@/hooks/use-questions';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';

// Load topics
const { topics, loading, error, refresh } = useTopics();

// Load questions
const { questions } = useQuestions({
  topic_id: 1,
  part: 1,
  page_index: 1,
  page_size: 20
});

// Record audio
const recorder = useAudioRecorder();
await recorder.startRecording();
const audioBlob = await recorder.stopRecording();
```

### Call Backend APIs

```typescript
import { TopicsService } from '@/services/topics.service';
import { QuestionsService } from '@/services/questions.service';
import { AnswersService } from '@/services/answers.service';

// Get topics
const topics = await TopicsService.listTopics();

// Get questions
const questions = await QuestionsService.listQuestions({
  topic_id: 1,
  part: 1
});

// Submit answer
const result = await AnswersService.submitAnswer(questionId, audioBlob);
```

### Use Authentication

```typescript
import { useAuth } from '@/contexts/auth.context';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <Button title="Login" onPress={() => login('Google')} />;
  }

  return (
    <View>
      <Text>Welcome {user.name}!</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

### Handle Loading & Errors

```typescript
function MyScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await SomeService.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={loadData} />;
  if (data.length === 0) return <EmptyState message="No data" />;

  return <DataList data={data} />;
}
```

## Component Patterns

### Card with Content
```typescript
<Card>
  <Text style={{fontSize: 18, fontWeight: 'bold'}}>Title</Text>
  <Text style={{color: '#666'}}>Description</Text>
</Card>
```

### Card as Button
```typescript
<Card onPress={() => handleClick()}>
  <Text>Click me</Text>
</Card>
```

### Highlighted Card
```typescript
<Card highlighted>
  <Text style={{color: '#fff'}}>Featured</Text>
</Card>
```

### Button Variants
```typescript
<Button title="Primary" onPress={() => {}} variant="primary" />
<Button title="Secondary" onPress={() => {}} variant="secondary" />
<Button title="Outline" onPress={() => {}} variant="outline" />
<Button title="Danger" onPress={() => {}} variant="danger" />
```

### Button Sizes
```typescript
<Button title="Small" size="small" onPress={() => {}} />
<Button title="Medium" size="medium" onPress={() => {}} />
<Button title="Large" size="large" onPress={() => {}} />
```

### Loading Button
```typescript
<Button title="Submit" loading={isSubmitting} onPress={handleSubmit} />
```

## Styling Guide

### Colors
```typescript
const COLORS = {
  primary: '#3BB9F0',
  background: '#F5F5F5',
  cardBackground: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  error: '#EF4444',
  success: '#10B981',
  warning: '#FFA500',
};
```

### Common Styles
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
```

## Navigation

### Push to Screen
```typescript
router.push('/speaking');
router.push(`/speaking/${topicId}`);
router.push(`/speaking/practice/${questionId}`);
```

### Replace (No Back)
```typescript
router.replace('/(tabs)');
router.replace('/login');
```

### Go Back
```typescript
router.back();
```

### With Params
```typescript
// Navigate with params
router.push({
  pathname: '/speaking/[topic]',
  params: { topic: '123' }
});

// Read params
const params = useLocalSearchParams();
const topicId = params.topic;
```

## API Configuration

### Switch Environment
```typescript
// config/api.config.ts
const CURRENT_ENV: Environment = 'local'; // or 'production'
```

### Add New Service Method
```typescript
// services/my-service.ts
import { ApiService } from './api.service';

class MyServiceClass {
  async getData(): Promise<MyType> {
    return await ApiService.get<MyType>('/my-endpoint');
  }

  async postData(data: MyData): Promise<MyResponse> {
    return await ApiService.post<MyResponse>('/my-endpoint', data);
  }
}

export const MyService = new MyServiceClass();
```

## WebSocket Usage

```typescript
import { WebSocketService } from '@/services/websocket.service';

// Connect
await WebSocketService.connect();

// Listen for messages
const unsubscribe = WebSocketService.onFeedback((message) => {
  console.log('Received:', message);
});

// Cleanup
unsubscribe();
WebSocketService.disconnect();
```

## Audio Recording

```typescript
import { useAudioRecorder } from '@/hooks/use-audio-recorder';

const recorder = useAudioRecorder();

// Start recording
await recorder.startRecording();

// Check state
recorder.isRecording    // boolean
recorder.isPaused      // boolean
recorder.duration      // milliseconds

// Pause/resume
await recorder.pauseRecording();
await recorder.resumeRecording();

// Stop and get blob
const audioBlob = await recorder.stopRecording();

// Cancel
await recorder.cancelRecording();
```

## TypeScript Types

All backend types are in `services/types.ts`:

```typescript
import {
  TopicOverview,
  QuestionWithDetails,
  UserAnswerWithEvaluation,
  StartTestRequest,
  WebSocketFeedbackMessage,
} from '@/services/types';
```

## Debugging

### Log API Calls
All services log to console:
```typescript
[TopicsService] Fetching all topics...
[TopicsService] Successfully fetched 10 topics
```

### Check Auth State
```typescript
import { useAuth } from '@/contexts/auth.context';

const { isAuthenticated, user, token } = useAuth();
console.log('Auth:', { isAuthenticated, user, token });
```

### View Network Requests
Enable in app:
```typescript
// All API requests logged in ApiService
console.log(`[API] GET /topics`);
console.log(`[API] Token:`, token);
```

## Performance Tips

### Use Memoization
```typescript
import { useMemo } from 'react';

const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);
```

### Avoid Re-renders
```typescript
import { useCallback } from 'react';

const handlePress = useCallback(() => {
  doSomething();
}, [dependencies]);
```

### Lazy Load Images
```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={1000}
/>
```

## Testing

### Test Components
```typescript
// Test if screen renders
import { render } from '@testing-library/react-native';
import MyScreen from './my-screen';

test('renders correctly', () => {
  const { getByText } = render(<MyScreen />);
  expect(getByText('Hello')).toBeTruthy();
});
```

### Test API Calls
```typescript
// Mock services
jest.mock('@/services/topics.service');

const mockTopics = [{ id: 1, name: 'Test' }];
TopicsService.listTopics.mockResolvedValue(mockTopics);
```

## Common Issues

### "Can't connect to backend"
- Check `config/api.config.ts`
- Verify backend is running
- Check network connection

### "Token expired"
- Automatic refresh should handle this
- If not, logout and login again

### "Audio recording failed"
- Check microphone permissions
- Verify device has microphone
- Check platform support

### "WebSocket not connecting"
- Verify WS_BASE_URL in config
- Check backend WebSocket endpoint
- Ensure authenticated

## Best Practices

1. **Always use hooks for data fetching**
   ```typescript
   const { topics, loading, error } = useTopics();
   ```

2. **Always show loading states**
   ```typescript
   if (loading) return <LoadingView />;
   ```

3. **Always handle errors**
   ```typescript
   if (error) return <ErrorView message={error} />;
   ```

4. **Always provide empty states**
   ```typescript
   if (data.length === 0) return <EmptyState />;
   ```

5. **Use TypeScript types**
   ```typescript
   const [data, setData] = useState<MyType[]>([]);
   ```

6. **Destructure props**
   ```typescript
   function MyCard({ title, description }: Props) { ... }
   ```

7. **Use constants for colors**
   ```typescript
   const PRIMARY_COLOR = '#3BB9F0';
   ```

8. **Keep components small**
   - One component, one responsibility
   - Extract reusable parts

9. **Use meaningful names**
   ```typescript
   const handleSubmitAnswer = async () => { ... }
   ```

10. **Add comments for complex logic**
    ```typescript
    // Calculate band score based on criteria
    const bandScore = calculateScore(feedback);
    ```

## Resources

- Expo Docs: https://docs.expo.dev
- React Native: https://reactnative.dev
- TypeScript: https://www.typescriptlang.org
- Backend API: See `aielts-backend/docs/`

---

Happy coding! 🚀
