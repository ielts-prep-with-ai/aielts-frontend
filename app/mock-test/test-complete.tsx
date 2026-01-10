import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function TestCompleteScreen() {
  const router = useRouter();
  const { testId, testName, testSessionId } = useLocalSearchParams<{
    testId: string;
    testName: string;
    testSessionId?: string;
  }>();

  const displayTestName = testName || 'IELTS Mock Test';

  const handleViewResults = () => {
    // Navigate to profile where test history/results will be shown
    // TODO: Create dedicated test history screen to show past tests and results
    router.push('/(tabs)/profile');
  };

  const handleTakeAnotherTest = () => {
    router.push('/mock-test');
  };

  const handleGoHome = () => {
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.push('/(tabs)')}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>AI Mock Test</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successCircle}>
            <IconSymbol name="checkmark" size={48} color="#4CAF50" />
          </View>
        </View>

        {/* Congratulations Text */}
        <Text style={styles.congratsTitle}>Congratulations!</Text>

        <Text style={styles.completionMessage}>
          You have finished the "{displayTestName}"
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Info Section */}
        <Text style={styles.infoText}>
          Your test has been submitted successfully!{'\n\n'}
          Our AI is now evaluating your responses. This may take a few minutes.
          {'\n\n'}
          Your detailed results and feedback will be available in your test history soon.
          {testSessionId && `\n\nTest Session ID: ${testSessionId}`}
        </Text>

        {/* Processing Status */}
        <View style={styles.processingCard}>
          <IconSymbol name="hourglass" size={24} color="#FF8C00" />
          <View style={styles.processingContent}>
            <Text style={styles.processingTitle}>AI Evaluation in Progress</Text>
            <Text style={styles.processingText}>
              We're analyzing your pronunciation, fluency, grammar, and vocabulary.
              Check back in a few minutes for your detailed score and feedback.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable style={styles.primaryButton} onPress={handleViewResults}>
            <IconSymbol name="person.fill" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Go to Profile</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleTakeAnotherTest}>
            <IconSymbol name="arrow.clockwise" size={20} color="#3BB9F0" />
            <Text style={styles.secondaryButtonText}>Take Another Test</Text>
          </Pressable>

          <Pressable style={styles.tertiaryButton} onPress={handleGoHome}>
            <IconSymbol name="house.fill" size={20} color="#666" />
            <Text style={styles.tertiaryButtonText}>Go to Home</Text>
          </Pressable>
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
    paddingTop: 60,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  congratsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  completionMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#333',
    marginBottom: 32,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 30,
    marginBottom: 24,
  },
  processingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
    gap: 16,
  },
  processingContent: {
    flex: 1,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 8,
  },
  processingText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 2,
    borderColor: '#3BB9F0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3BB9F0',
  },
  tertiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingVertical: 14,
    gap: 10,
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
