import { Stack } from 'expo-router';

export default function MockTestLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[testId]" options={{ headerShown: false }} />
      <Stack.Screen name="instructions" options={{ headerShown: false }} />
      <Stack.Screen name="microphone-test" options={{ headerShown: false }} />
      <Stack.Screen name="part2-topic" options={{ headerShown: false }} />
      <Stack.Screen name="test-question" options={{ headerShown: false }} />
      <Stack.Screen name="test-review" options={{ headerShown: false }} />
      <Stack.Screen name="test-complete" options={{ headerShown: false }} />
    </Stack>
  );
}
