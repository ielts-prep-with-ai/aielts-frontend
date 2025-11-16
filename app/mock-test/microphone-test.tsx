import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

export default function MicrophoneTestScreen() {
  const router = useRouter();
  const { testId, mode, parts, timeLimit } = useLocalSearchParams();
  const [isTesting, setIsTesting] = useState(false);

  const handleTestMicrophone = async () => {
    setIsTesting(true);
    // TODO: Implement actual microphone test
    console.log('Testing microphone...');

    // Simulate microphone test (replace with actual implementation)
    setTimeout(() => {
      setIsTesting(false);
      router.push({
        pathname: '/mock-test/test-question',
        params: {
          testId,
          mode,
          parts,
          timeLimit,
        },
      });
    }, 2000);
  };

  const handleSkip = () => {
    // Navigate directly to test question page
    console.log('Proceeding to test with params:', { testId, mode, parts, timeLimit });
    router.push({
      pathname: '/mock-test/test-question',
      params: {
        testId,
        mode,
        parts,
        timeLimit,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>AI Mock Test</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.pageTitle}>TEST YOUR MICROPHONE</Text>

        {/* Test Card */}
        <View style={styles.testCard}>
          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.instructionText}>You have 20 seconds to speak...</Text>
            </View>
            <View style={styles.instructionRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.instructionText}>
                To complete this activity, you must allow access to your system's microphone. Click the button below to start.
              </Text>
            </View>
          </View>

          {/* Microphone Icon */}
          <View style={styles.microphoneContainer}>
            <View style={[styles.microphoneCircle, isTesting && styles.microphoneCircleTesting]}>
              <IconSymbol name="mic.fill" size={48} color="#FF6B6B" />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable
              style={[styles.testButton, isTesting && styles.testButtonDisabled]}
              onPress={handleTestMicrophone}
              disabled={isTesting}
            >
              <Text style={styles.testButtonText}>
                {isTesting ? 'Testing...' : 'Test microphone'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isTesting}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  testCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionsContainer: {
    marginBottom: 32,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 18,
    color: '#000',
    marginRight: 12,
    marginTop: 2,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    flex: 1,
  },
  microphoneContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  microphoneCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  microphoneCircleTesting: {
    backgroundColor: '#FFD0D0',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  testButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skipButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});
