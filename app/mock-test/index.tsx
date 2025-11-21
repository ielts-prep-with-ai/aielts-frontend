import { IconSymbol } from '@/components/ui/icon-symbol';
import { ApiService } from '@/services/api.service';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

interface ExamSet {
  id: number;
  title: string;
}

type SkillFilter = 'all' | 'listening' | 'reading' | 'writing' | 'speaking';

export default function MockTestScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SkillFilter>('all');
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = [
    { key: 'all', label: 'All skills' },
    { key: 'listening', label: 'Listening' },
    { key: 'reading', label: 'Reading' },
    { key: 'writing', label: 'Writing' },
    { key: 'speaking', label: 'Speaking' },
  ] as const;

  const fetchExamSets = async (skill?: string) => {
    setLoading(true);
    setError(null);
    try {
      let results: ExamSet[] = [];
      
      if (skill === 'all' || !skill) {
        // Fetch all skills in parallel
        const skills = ['listening', 'reading', 'writing', 'speaking'];
        const responses = await Promise.all(
          skills.map(s => ApiService.get<ExamSet[]>(`/examsets?skill=${s}`))
        );
        results = responses.flat();
      } else {
        results = await ApiService.get<ExamSet[]>(`/examsets?skill=${skill}`);
      }
      
      console.log('[MockTest] Response:', results);
      setExamSets(results);
    } catch (err: any) {
      const message = err?.message || 'Failed to load exam sets. Please try again.';
      setError(message);
      console.error('Error fetching exam sets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamSets(activeFilter);
  }, [activeFilter]);

  const filteredTests = examSets.filter(test => 
    test.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilterChange = (filter: SkillFilter) => {
    setActiveFilter(filter);
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
            onPress={() => handleFilterChange(filter.key)}
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

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3BB9F0" />
            <Text style={styles.loadingText}>Loading tests...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => fetchExamSets(activeFilter)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : filteredTests.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No tests found</Text>
          </View>
        ) : (
          filteredTests.map((test) => (
            <Pressable
              key={test.id}
              style={styles.testCard}
              onPress={() => router.push(`/mock-test/${test.id}`)}
            >
              <View style={styles.testCardContent}>
                <Text style={styles.testTitle}>{test.title}</Text>
              </View>
            </Pressable>
          ))
        )}
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
    shadowOffset: { width: 0, height: 1 },
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3BB9F0',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
});