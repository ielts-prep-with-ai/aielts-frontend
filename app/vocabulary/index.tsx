import { StyleSheet, ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function VocabularyScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Vocabulary Builder</Text>
      </View>

      {/* Dictionary Section */}
      <View style={styles.dictionarySection}>
        <View style={styles.dictionaryHeader}>
          <Text style={styles.dictionaryTitle}>Dictionary</Text>
          <View style={styles.languageToggle}>
            <Text style={styles.languageText}>EN</Text>
            <View style={styles.toggleSwitch}>
              <View style={styles.toggleButton} />
            </View>
            <Text style={styles.languageText}>VI</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a word..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <IconSymbol name="magnifyingglass" size={24} color="#fff" style={styles.searchIcon} />
        </View>
      </View>

      {/* Tabs Section */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
            Search
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Saved (3)
          </Text>
        </Pressable>
      </View>

      {/* Content Area */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'search' && (
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={60} color="#D3D3D3" />
            <Text style={styles.emptyStateTitle}>Search for a word to get started</Text>
            <Text style={styles.emptyStateSubtitle}>Try: articulate, comprehensive, inevitable</Text>
          </View>
        )}
        {activeTab === 'saved' && (
          <View style={styles.emptyState}>
            <IconSymbol name="bookmark" size={60} color="#D3D3D3" />
            <Text style={styles.emptyStateTitle}>No saved words yet</Text>
            <Text style={styles.emptyStateSubtitle}>Save words to practice them later</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  dictionarySection: {
    backgroundColor: '#5DADE2',
    padding: 24,
    paddingBottom: 32,
  },
  dictionaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dictionaryTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  toggleSwitch: {
    width: 32,
    height: 18,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
  },
  toggleButton: {
    width: 14,
    height: 14,
    backgroundColor: '#5DADE2',
    borderRadius: 7,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '400',
  },
  searchIcon: {
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3BB9F0',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: '#3BB9F0',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#C8C8C8',
    textAlign: 'center',
  },
});
