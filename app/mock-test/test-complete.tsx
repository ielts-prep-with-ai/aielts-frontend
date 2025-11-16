import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function TestCompleteScreen() {
  const router = useRouter();
  const { testId, testName } = useLocalSearchParams();

  const displayTestName = testName || 'IELTS Mock Test 2025 February Speaking Practice Test 1';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.push('/')}>
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
          Know IELTS Band Score Of Your Speaking Test?{'\n'}
          Over 12,000 students worldwide trusted our services to raise their IELTS Speaking scores up to 2 bands!
        </Text>
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
  },
});
