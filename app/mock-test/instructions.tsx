import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function MockTestInstructionsScreen() {
  const router = useRouter();
  const { testId, mode, parts, timeLimit } = useLocalSearchParams();

  const instructions = [
    'The exam is divided into 3 parts. The name of each part is mentioned on the top of the page.',
    'There will be an active timer to remind you of how much time is left.',
    'You will use a computer and headset to read and respond to questions.',
    'Submit your test after you finish by clicking on "SUBMIT TEST". Make sure you have attempt maximum number of questions.',
    'You can also review your recording and record again to change your responses after completing and before submission.',
    'You can check required browser settings for recording.',
  ];

  const handleNextStep = () => {
    // Navigate to microphone test page
    console.log('Starting test with params:', { testId, mode, parts, timeLimit });
    router.push({
      pathname: '/mock-test/microphone-test',
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
        <Text style={styles.pageTitle}>GENERAL INSTRUCTIONS</Text>

        {/* Instructions Card */}
        <View style={styles.instructionsCard}>
          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}

          {/* Next Step Button */}
          <Pressable style={styles.nextButton} onPress={handleNextStep}>
            <Text style={styles.nextButtonText}>Next step</Text>
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
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
  nextButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
