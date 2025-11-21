import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface StartTestRequest {
  mode: 'practice' | 'simulation';
  exam_set_id: number;
  skill: string;
  part1: boolean;
  part2: boolean;
  part3: boolean;
  time_limit: '0min' | '12min' | '14min';
}

interface StartTestResponse {
  test_session_id: string;
  part1: number[];
  part2: number[];
  part3: number[];
  start_time: string;
  end_time: string;
  time_limit: string;
}

export default function MockTestDetailsScreen() {
  const router = useRouter();
  const { testId, skill = 'speaking' } = useLocalSearchParams<{ testId: string; skill?: string }>();

  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState<'0min' | '12min' | '14min'>('12min');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePart = (part: string) => {
    if (part === 'full') {
      // Toggle all parts
      const allSelected = selectedParts.includes('full');
      setSelectedParts(allSelected ? [] : ['full', 'part1', 'part2', 'part3']);
    } else {
      setSelectedParts(prev => {
        const newParts = prev.includes(part) 
          ? prev.filter(p => p !== part && p !== 'full')
          : [...prev, part];
        
        // Auto-check "full" if all 3 parts selected
        const hasAll = ['part1', 'part2', 'part3'].every(p => newParts.includes(p));
        if (hasAll && !newParts.includes('full')) {
          return [...newParts, 'full'];
        }
        return newParts.filter(p => p !== 'full');
      });
    }
  };

  const parts = [
    { id: 'full', label: 'Full parts (3 parts - 18 questions)' },
    { id: 'part1', label: 'Part 1 (13 questions)' },
    { id: 'part2', label: 'Part 2 (1 questions)' },
    { id: 'part3', label: 'Part 3 (4 questions)' },
  ];

  const timeOptions: { value: '0min' | '12min' | '14min'; label: string }[] = [
    { value: '0min', label: 'No limit' },
    { value: '12min', label: '12 mins' },
    { value: '14min', label: '14 mins' },
  ];

  const startTest = (mode: 'practice' | 'simulation') => {
    const isFullParts = selectedParts.includes('full');
    
    const testConfig: StartTestRequest = {
      mode,
      exam_set_id: parseInt(testId, 10),
      skill: skill as string,
      part1: mode === 'simulation' ? true : (isFullParts || selectedParts.includes('part1')),
      part2: mode === 'simulation' ? true : (isFullParts || selectedParts.includes('part2')),
      part3: mode === 'simulation' ? true : (isFullParts || selectedParts.includes('part3')),
      time_limit: mode === 'simulation' ? '0min' : timeLimit,
    };

    console.log('[MockTest] Test config:', testConfig);

    // Pass config to next screen, API call will happen after mic test
    router.push({
      pathname: '/mock-test/instructions',
      params: {
        testId,
        testConfig: JSON.stringify(testConfig),
      },
    });
  };

  const handleStartPractice = () => {
    if (selectedParts.length === 0) {
      setError('Please select at least one part to practice.');
      return;
    }
    startTest('practice');
  };

  const handleStartSimulation = () => {
    startTest('simulation');
  };

  const selectTime = (time: '0min' | '12min' | '14min') => {
    setTimeLimit(time);
    setShowTimePicker(false);
  };

  const getTimeLimitLabel = (value: string) => {
    return timeOptions.find(t => t.value === value)?.label || value;
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
        <Text style={styles.pageTitle}>Choose a mode</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Practice Mode Card */}
        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>Practice mode</Text>
          <Text style={styles.modeDescription}>
            Practice mode is suitable for improving accuracy and time spent on each part.
          </Text>

          <Text style={styles.sectionLabel}>1. Choose part/task(s) you want to practice:</Text>

          {parts.map((part) => (
            <Pressable
              key={part.id}
              style={styles.checkboxRow}
              onPress={() => togglePart(part.id)}
            >
              <View style={[
                styles.checkbox,
                selectedParts.includes(part.id) && styles.checkboxChecked
              ]}>
                {selectedParts.includes(part.id) && (
                  <IconSymbol name="checkmark" size={14} color="#3BB9F0" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{part.label}</Text>
            </Pressable>
          ))}

          <Text style={styles.sectionLabel}>2. Choose a time limit:</Text>
          <Pressable style={styles.timeSelector} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.timeSelectorText}>{getTimeLimitLabel(timeLimit)}</Text>
            <IconSymbol name="chevron.down" size={20} color="#666" />
          </Pressable>

          <Pressable 
            style={[styles.startButton, loading && styles.startButtonDisabled]} 
            onPress={handleStartPractice}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>Start Now</Text>
            )}
          </Pressable>
        </View>

        {/* Simulation Test Mode Card */}
        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>Simulation test mode</Text>
          <Text style={styles.modeDescription}>
            Simulation test mode is the best option to experience the real IELTS on computer.
          </Text>

          <Text style={styles.testInfoLabel}>Test Information</Text>
          <Text style={styles.testInfoText}>Full parts (13 minutes - 3 parts - 18 questions)</Text>

          <Pressable 
            style={[styles.startButton, loading && styles.startButtonDisabled]} 
            onPress={handleStartSimulation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>Start Now</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTimePicker}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time Limit</Text>
            {timeOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.timeOption,
                  timeLimit === option.value && styles.timeOptionSelected
                ]}
                onPress={() => selectTime(option.value)}
              >
                <Text style={[
                  styles.timeOptionText,
                  timeLimit === option.value && styles.timeOptionTextSelected
                ]}>{option.label}</Text>
                {timeLimit === option.value && (
                  <IconSymbol name="checkmark" size={20} color="#3BB9F0" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#FFE8E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  modeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    borderColor: '#3BB9F0',
    backgroundColor: '#E8F6FC',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  timeSelectorText: {
    fontSize: 15,
    color: '#333',
  },
  startButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  testInfoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 8,
  },
  testInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  timeOptionSelected: {
    backgroundColor: '#E8F6FC',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333',
  },
  timeOptionTextSelected: {
    color: '#3BB9F0',
    fontWeight: '600',
  },
});