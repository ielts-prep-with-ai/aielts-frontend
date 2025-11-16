import { StyleSheet, ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { useState } from 'react';

interface MockTest {
  id: number;
  title: string;
  testsTaken: number;
  completionPercentage?: number;
  skill: 'listening' | 'reading' | 'writing' | 'speaking';
}

export default function MockTestScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'listening' | 'reading' | 'writing' | 'speaking'>('all');

  const mockTests: MockTest[] = [
    { id: 1, title: 'January Speaking Practice Test 1', testsTaken: 63182, completionPercentage: 100, skill: 'speaking' },
    { id: 2, title: 'January Speaking Practice Test 2', testsTaken: 63182, completionPercentage: 100, skill: 'speaking' },
    { id: 3, title: 'February Speaking Practice Test 1', testsTaken: 63182, completionPercentage: 100, skill: 'speaking' },
    { id: 4, title: 'February Speaking Practice Test 2', testsTaken: 63182, skill: 'speaking' },
    { id: 5, title: 'March Speaking Practice Test 1', testsTaken: 63182, skill: 'speaking' },
    { id: 6, title: 'January Speaking Practice Test 1', testsTaken: 63182, skill: 'speaking' },
    { id: 7, title: 'January Listening Practice Test 1', testsTaken: 45230, completionPercentage: 85, skill: 'listening' },
    { id: 8, title: 'February Reading Practice Test 1', testsTaken: 52100, skill: 'reading' },
    { id: 9, title: 'March Writing Practice Test 1', testsTaken: 38450, completionPercentage: 60, skill: 'writing' },
  ];

  const filteredTests = mockTests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || test.skill === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { key: 'all', label: 'All skills' },
    { key: 'listening', label: 'Listening' },
    { key: 'reading', label: 'Reading' },
    { key: 'writing', label: 'Writing' },
    { key: 'speaking', label: 'Speaking' },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>AI Mock Test</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <IconSymbol name="magnifyingglass" size={20} color="#000" />
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScrollView}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((filter) => (
          <Pressable
            key={filter.key}
            style={[
              styles.filterPill,
              activeFilter === filter.key && styles.filterPillActive
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text style={[
              styles.filterPillText,
              activeFilter === filter.key && styles.filterPillTextActive
            ]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tests List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>IELTS Mock Test 2025</Text>

        {filteredTests.map((test) => (
          <Pressable
            key={test.id}
            style={styles.testCard}
            onPress={() => router.push(`/mock-test/${test.id}`)}
          >
            {test.completionPercentage !== undefined && (
              <View style={styles.progressCircle}>
                <Text style={styles.progressText}>{test.completionPercentage}%</Text>
              </View>
            )}
            <View style={styles.testCardContent}>
              <Text style={styles.testTitle}>{test.title}</Text>
              <View style={styles.testStats}>
                <IconSymbol name="trophy.fill" size={16} color="#FFB800" />
                <Text style={styles.testStatsText}>{test.testsTaken.toLocaleString()} tests taken</Text>
              </View>
            </View>
          </Pressable>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  filtersScrollView: {
    maxHeight: 50,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#3BB9F0',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  testCardContent: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  testStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testStatsText: {
    fontSize: 13,
    color: '#666',
  },
});
