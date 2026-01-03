import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/auth.context';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/theme.context';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { handleAuthCallback, isAuthenticated } = useAuth();

  // Handle deep links
  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔗 [ROOT LAYOUT] Setting up Deep Link Handlers');
    console.log('═══════════════════════════════════════════════════════════');

    // Handle initial URL if app was opened via deep link
    const handleInitialURL = async () => {
      console.log('🔗 [ROOT LAYOUT] Checking for initial deep link URL...');
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('✅ [ROOT LAYOUT] Initial deep link URL found:', initialUrl);
        handleDeepLink(initialUrl);
      } else {
        console.log('ℹ️ [ROOT LAYOUT] No initial deep link URL found (normal app launch)');
      }
    };

    // Handle deep links while app is open
    console.log('🔗 [ROOT LAYOUT] Setting up deep link event listener...');
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔗 [ROOT LAYOUT] Deep Link Event Received');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔗 [ROOT LAYOUT] Event URL:', event.url);
      handleDeepLink(event.url);
    });

    console.log('✅ [ROOT LAYOUT] Deep link listener registered');
    handleInitialURL();

    return () => {
      console.log('🔗 [ROOT LAYOUT] Removing deep link listener (cleanup)');
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔗 [DEEP LINK HANDLER] Processing Deep Link');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔗 [DEEP LINK HANDLER] URL:', url);
    console.log('🔗 [DEEP LINK HANDLER] Current auth status:', isAuthenticated);

    // Check if it's an auth callback
    console.log('🔍 [DEEP LINK HANDLER] Checking if URL contains "callback"...');
    if (url.includes('callback')) {
      console.log('✅ [DEEP LINK HANDLER] This is an auth callback URL');
      console.log('───────────────────────────────────────────────────────────');

      try {
        console.log('🔄 [DEEP LINK HANDLER] Calling handleAuthCallback()...');
        await handleAuthCallback(url);

        console.log('✅ [DEEP LINK HANDLER] Auth callback processed successfully');
        console.log('🧭 [DEEP LINK HANDLER] Navigating to tabs screen...');
        router.replace('/(tabs)');
        console.log('✅ [DEEP LINK HANDLER] Navigation complete');
        console.log('═══════════════════════════════════════════════════════════');
      } catch (error) {
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ [DEEP LINK HANDLER] Error handling auth callback');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ [DEEP LINK HANDLER] Error:', error);
        if (error instanceof Error) {
          console.error('❌ [DEEP LINK HANDLER] Error message:', error.message);
          console.error('❌ [DEEP LINK HANDLER] Error stack:', error.stack);
        }

        console.log('🧭 [DEEP LINK HANDLER] Navigating back to login screen...');
        router.replace('/login');
        console.log('═══════════════════════════════════════════════════════════');
      }
    } else {
      console.log('ℹ️ [DEEP LINK HANDLER] Not an auth callback URL, ignoring');
      console.log('═══════════════════════════════════════════════════════════');
    }
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="speaking" options={{ headerShown: false }} />
        <Stack.Screen name="reading" options={{ headerShown: false }} />
        <Stack.Screen name="writing" options={{ headerShown: false }} />
        <Stack.Screen name="listening" options={{ headerShown: false }} />
        <Stack.Screen name="vocabulary" options={{ headerShown: false }} />
        <Stack.Screen name="mock-test" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </CustomThemeProvider>
  );
}
