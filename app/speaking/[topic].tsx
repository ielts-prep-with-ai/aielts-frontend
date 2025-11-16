import { StyleSheet, ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

interface Question {
  id: number;
  type: 'Official' | 'AI generated';
  part: number;
  question: string;
}

export default function TopicQuestionsScreen() {
  const router = useRouter();
  const { topic } = useLocalSearchParams();
  const [activeFilter, setActiveFilter] = useState<'All' | 'AI generated' | 'Official'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with API call
  const questions: Question[] = [
    { id: 1, type: 'Official', part: 1, question: "What's your full name?" },
    { id: 2, type: 'Official', part: 1, question: "What's your full name?" },
    { id: 3, type: 'Official', part: 1, question: "What's your full name?" },
    { id: 4, type: 'Official', part: 1, question: "What's your full name?" },
    { id: 5, type: 'Official', part: 1, question: "What's your full name?" },
    { id: 6, type: 'Official', part: 1, question: "What's your full name?" },
  ];

  const topicTitle = topic === 'education' ? 'Education' :
                     topic === 'technology' ? 'Technology' :
                     topic === 'travel' ? 'Travel & Tourism' :
                     topic === 'environment' ? 'Environment' :
                     topic === 'health' ? 'Health & Fitness' :
                     topic === 'work' ? 'Work & Career' :
                     'Personal Information';

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{topicTitle}</Text>
          <Text style={styles.headerSubtitle}>Practice questions</Text>
        </View>
      </View>

      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Filter question"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <IconSymbol name="magnifyingglass" size={20} color="#000" />
        </View>
        <Pressable style={styles.sortButton}>
          <Text style={styles.sortButtonText}>sort by Part</Text>
          <IconSymbol name="chevron.down" size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterPill, activeFilter === 'All' && styles.filterPillActive]}
          onPress={() => setActiveFilter('All')}
        >
          <Text style={[styles.filterPillText, activeFilter === 'All' && styles.filterPillTextActive]}>
            All
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterPill, activeFilter === 'AI generated' && styles.filterPillActive]}
          onPress={() => setActiveFilter('AI generated')}
        >
          <Text style={[styles.filterPillText, activeFilter === 'AI generated' && styles.filterPillTextActive]}>
            AI generated
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterPill, activeFilter === 'Official' && styles.filterPillActive]}
          onPress={() => setActiveFilter('Official')}
        >
          <Text style={[styles.filterPillText, activeFilter === 'Official' && styles.filterPillTextActive]}>
            Official
          </Text>
        </Pressable>
      </View>

      {/* Questions List */}
      <ScrollView style={styles.questionsList} contentContainerStyle={styles.questionsListContent}>
        {questions.map((q) => (
          <View key={q.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionType}>{q.type}</Text>
              <View style={styles.partBadge}>
                <Text style={styles.partBadgeText}>Part {q.part}</Text>
              </View>
            </View>
            <Text style={styles.questionText}>{q.question}</Text>
            <Pressable
              style={styles.startButton}
              onPress={() => router.push(`/speaking/practice/${q.id}?topic=${topic}`)}
            >
              <Text style={styles.startButtonText}>Start Practice</Text>
            </Pressable>
          </View>
        ))}
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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B8FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#fff',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  filterPillActive: {
    backgroundColor: '#00B8FF',
    borderColor: '#00B8FF',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  questionsList: {
    flex: 1,
  },
  questionsListContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  partBadge: {
    backgroundColor: '#00B8FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  partBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
  },
  startButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
