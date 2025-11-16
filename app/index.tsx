import { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth.context';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎬 [SPLASH SCREEN] Component Mounted');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎬 [SPLASH SCREEN] Initial state:');
    console.log('   - isLoading:', isLoading);
    console.log('   - isAuthenticated:', isAuthenticated);

    // Fade in animation
    console.log('✨ [SPLASH SCREEN] Starting fade-in animation...');
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withSequence(
      withTiming(1.1, { duration: 400 }),
      withTiming(1, { duration: 400 })
    );

    // Navigate based on authentication status
    console.log('⏱️ [SPLASH SCREEN] Setting 2.5s timer for navigation check...');
    const timer = setTimeout(() => {
      console.log('───────────────────────────────────────────────────────────');
      console.log('⏰ [SPLASH SCREEN] Timer triggered - checking auth status');
      console.log('⏰ [SPLASH SCREEN] isLoading:', isLoading);
      console.log('⏰ [SPLASH SCREEN] isAuthenticated:', isAuthenticated);

      if (!isLoading) {
        console.log('✅ [SPLASH SCREEN] Auth check complete, ready to navigate');
        if (isAuthenticated) {
          console.log('🧭 [SPLASH SCREEN] User authenticated → navigating to tabs');
          router.replace('/(tabs)');
          console.log('✅ [SPLASH SCREEN] Navigation to tabs complete');
        } else {
          console.log('🧭 [SPLASH SCREEN] User not authenticated → navigating to login');
          router.replace('/login');
          console.log('✅ [SPLASH SCREEN] Navigation to login complete');
        }
      } else {
        console.log('⏳ [SPLASH SCREEN] Still loading, waiting...');
      }
      console.log('═══════════════════════════════════════════════════════════');
    }, 2500);

    return () => {
      console.log('🧹 [SPLASH SCREEN] Cleanup - clearing timer');
      clearTimeout(timer);
    };
  }, [isLoading, isAuthenticated]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoRow}>
            <Text style={styles.aiText}>A</Text>
            <View style={styles.iContainer}>
              <IconSymbol name="graduationcap.fill" size={24} color="#fff" style={styles.capIcon} />
              <Text style={styles.iText}>i</Text>
            </View>
            <Text style={styles.eltsText}>elts</Text>
            <Text style={styles.tmText}>™</Text>
          </View>
        </View>

        <View style={styles.taglineContainer}>
          <Text style={styles.poweredText}>Powered</Text>
          <Text style={styles.byAiText}>by AI</Text>
          <IconSymbol name="cpu.fill" size={16} color="#fff" style={styles.aiIcon} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3BB9F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aiText: {
    fontSize: 68,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -2,
  },
  iContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  capIcon: {
    position: 'absolute',
    top: -8,
    zIndex: 1,
  },
  iText: {
    fontSize: 68,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -2,
  },
  eltsText: {
    fontSize: 68,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -2,
  },
  tmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 2,
    marginTop: 8,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  poweredText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  byAiText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  aiIcon: {
    marginLeft: 2,
  },
});
