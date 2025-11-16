import { Stack } from 'expo-router';

export default function SpeakingLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[topic]" options={{ headerShown: false }} />
      <Stack.Screen name="practice/[questionId]" options={{ headerShown: false }} />
    </Stack>
  );
}
