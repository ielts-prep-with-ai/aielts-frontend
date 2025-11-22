import { IconSymbol } from '@/components/ui/icon-symbol';
import type { DictionaryDefinition, SavedWord } from '@/services/types';
import { VocabularyService } from '@/services/vocabulary.service';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function VocabularyScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [searchQuery, setSearchQuery] = useState('');

  // Search state
  const [searchResult, setSearchResult] = useState<DictionaryDefinition | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saved words state
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // Track which words are saved for quick lookup
  const [savedWordsSet, setSavedWordsSet] = useState<Set<string>>(new Set());

  // Audio playback for pronunciation
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioPlayer = useAudioPlayer(audioUrl);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  // Animation values
  const searchResultAnimation = useRef(new Animated.Value(0)).current;
  const savedWordsAnimation = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnimation = useRef(new Animated.Value(0)).current;
  const emptyStateAnimation = useRef(new Animated.Value(0)).current;
  const errorAnimation = useRef(new Animated.Value(0)).current;

  // Load saved words when component mounts
  useEffect(() => {
    loadSavedWords();
  }, []);

  // Reload saved words when switching to saved tab
  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedWords();
    }
  }, [activeTab]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Fetch autocomplete suggestions with 300ms debounce
  const fetchSuggestions = useCallback(async (prefix: string) => {
    if (!prefix.trim() || prefix.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const results = await VocabularyService.getAutocompleteSuggestions(prefix.trim());
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('[Vocabulary] Autocomplete failed:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Handle search query change with debounce
  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Hide suggestions if input is cleared
    if (!text.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Set new timer for 300ms debounce
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Trigger search with selected suggestion
    performSearch(suggestion);
  };

  const loadSavedWords = async () => {
    try {
      setIsLoadingSaved(true);
      const words = await VocabularyService.getSavedWords();
      setSavedWords(words);
      setSavedWordsSet(new Set(words.map(w => w.word.toLowerCase())));
    } catch (error: any) {
      console.error('[Vocabulary] Failed to load saved words:', error);
      Alert.alert('Error', 'Failed to load saved words. Please try again.');
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Extracted search logic for reuse
  const performSearch = async (word: string) => {
    if (!word.trim()) {
      setSearchError('Please enter a word to search');
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      setSearchResult(null);
      setAudioUrl(null);
      setShowSuggestions(false);

      const result = await VocabularyService.searchWord(word.trim());
      setSearchResult(result);

      if (result.phonetics && result.phonetics.length > 0) {
        const audioPhonetic = result.phonetics.find(p => p.audio);
        if (audioPhonetic?.audio) {
          setAudioUrl(audioPhonetic.audio);
        }
      }
    } catch (error: any) {
      console.error('[Vocabulary] Search failed:', error);
      setSearchError(error?.message || 'Word not found. Please try another word.');
      setSearchResult(null);
      setAudioUrl(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Search for a word
  const handleSearch = () => {
    setShowSuggestions(false);
    performSearch(searchQuery);
  };

  // Play pronunciation audio
  const handlePlayAudio = () => {
    if (!audioUrl) return;
    try {
      if (playerStatus.playing) {
        audioPlayer.pause();
        audioPlayer.seekTo(0);
      } else {
        audioPlayer.seekTo(0);
        audioPlayer.play();
      }
    } catch (error) {
      console.error('[Vocabulary] Audio playback failed:', error);
    }
  };

  useEffect(() => {
    if (playerStatus.didJustFinish) {
      audioPlayer.pause();
      audioPlayer.seekTo(0);
    }
  }, [playerStatus.didJustFinish]);

  useEffect(() => {
    if (searchResult) {
      searchResultAnimation.setValue(0);
      Animated.spring(searchResultAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [searchResult]);

  useEffect(() => {
    if (savedWords.length > 0 && activeTab === 'saved') {
      savedWordsAnimation.setValue(0);
      Animated.stagger(50,
        savedWords.map((_, index) =>
          Animated.spring(savedWordsAnimation, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          })
        )
      ).start();
    }
  }, [savedWords, activeTab]);

  useEffect(() => {
    Animated.spring(tabIndicatorAnimation, {
      toValue: activeTab === 'search' ? 0 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [activeTab]);

  useEffect(() => {
    if (searchError) {
      errorAnimation.setValue(0);
      Animated.sequence([
        Animated.spring(errorAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  }, [searchError]);

  useEffect(() => {
    if (!searchResult && !searchError && !isSearching) {
      emptyStateAnimation.setValue(0);
      Animated.timing(emptyStateAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [searchResult, searchError, isSearching]);

  const handleSaveWord = async (word: string) => {
    try {
      await VocabularyService.saveWord(word);
      const newWord: SavedWord = { word, created_at: new Date().toISOString() };
      setSavedWords(prev => [newWord, ...prev]);
      setSavedWordsSet(prev => new Set([...prev, word.toLowerCase()]));
      Alert.alert('Success', `"${word}" saved to your vocabulary list!`);
    } catch (error: any) {
      console.error('[Vocabulary] Failed to save word:', error);
      Alert.alert('Error', 'Failed to save word. Please try again.');
    }
  };

  const handleDeleteWord = async (word: string) => {
    try {
      await VocabularyService.deleteWord(word);
      setSavedWords(prev => prev.filter(w => w.word !== word));
      setSavedWordsSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(word.toLowerCase());
        return newSet;
      });
      Alert.alert('Removed', `"${word}" removed from your vocabulary list.`);
    } catch (error: any) {
      console.error('[Vocabulary] Failed to delete word:', error);
      Alert.alert('Error', 'Failed to remove word. Please try again.');
    }
  };

  const isCurrentWordSaved = searchResult ? savedWordsSet.has(searchResult.word.toLowerCase()) : false;

  const handleSavedWordClick = async (word: string) => {
    setActiveTab('search');
    setSearchQuery(word);
    performSearch(word);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Vocabulary Builder</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for any word..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            onSubmitEditing={handleSearch}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {(isSearching || isLoadingSuggestions) && (
            <ActivityIndicator size="small" color="#3BB9F0" />
          )}
        </View>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  pressed && styles.suggestionItemPressed,
                  index === suggestions.length - 1 && styles.suggestionItemLast,
                ]}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <IconSymbol name="magnifyingglass" size={16} color="#999" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Tabs Section */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'search' && styles.tabActive,
            pressed && styles.tabPressed
          ]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
            Search
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'saved' && styles.tabActive,
            pressed && styles.tabPressed
          ]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Saved ({savedWords.length})
          </Text>
        </Pressable>
      </View>

      {/* Content Area */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={!searchResult && !searchError && activeTab === 'search' ? styles.contentContainer : undefined}
        onScrollBeginDrag={() => setShowSuggestions(false)}
      >
        {activeTab === 'search' && (
          <>
            {searchError && (
              <Animated.View
                style={[
                  styles.errorContainer,
                  {
                    opacity: errorAnimation,
                    transform: [{
                      scale: errorAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    }],
                  },
                ]}
              >
                <IconSymbol name="exclamationmark.circle" size={48} color="#FF6B6B" />
                <Text style={styles.errorText}>{searchError}</Text>
                <Text style={styles.errorSubtext}>Try searching for another word</Text>
              </Animated.View>
            )}

            {searchResult && (
              <Animated.View
                style={[
                  styles.resultContainer,
                  {
                    opacity: searchResultAnimation,
                    transform: [
                      {
                        translateY: searchResultAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                      {
                        scale: searchResultAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.95, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.wordHeader}>
                  <View style={styles.wordMainInfo}>
                    <Text style={styles.wordTitle}>{searchResult.word}</Text>
                    <View style={styles.wordActions}>
                      {audioUrl && (
                        <Pressable
                          style={({ pressed }) => [
                            styles.actionButton,
                            playerStatus.playing && styles.actionButtonActive,
                            pressed && { transform: [{ scale: 0.9 }] }
                          ]}
                          onPress={handlePlayAudio}
                        >
                          <IconSymbol
                            name={playerStatus.playing ? "pause.circle.fill" : "speaker.wave.2.fill"}
                            size={22}
                            color={playerStatus.playing ? "#3BB9F0" : "#666"}
                          />
                        </Pressable>
                      )}
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionButton,
                          isCurrentWordSaved && styles.actionButtonActive,
                          pressed && { transform: [{ scale: 0.9 }] }
                        ]}
                        onPress={() => isCurrentWordSaved ? handleDeleteWord(searchResult.word) : handleSaveWord(searchResult.word)}
                      >
                        <IconSymbol
                          name={isCurrentWordSaved ? "bookmark.fill" : "bookmark"}
                          size={22}
                          color={isCurrentWordSaved ? "#3BB9F0" : "#666"}
                        />
                      </Pressable>
                    </View>
                  </View>
                  {searchResult.phonetic && (
                    <Text style={styles.phoneticText}>{searchResult.phonetic}</Text>
                  )}
                </View>

                {searchResult.meanings.map((meaning, index) => (
                  <View key={index} style={styles.meaningSection}>
                    <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>
                    {meaning.definitions.slice(0, 3).map((def, defIndex) => (
                      <View key={defIndex} style={styles.definitionItem}>
                        <Text style={styles.definitionText}>{def.definition}</Text>
                        {def.example && (
                          <Text style={styles.exampleText}>"{def.example}"</Text>
                        )}
                      </View>
                    ))}
                    {meaning.synonyms && meaning.synonyms.length > 0 && (
                      <View style={styles.relatedWordsContainer}>
                        <Text style={styles.relatedWordsLabel}>Similar:</Text>
                        <View style={styles.tagsList}>
                          {meaning.synonyms.slice(0, 5).map((synonym, idx) => (
                            <View key={idx} style={styles.wordTag}>
                              <Text style={styles.wordTagText}>{synonym}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </Animated.View>
            )}

            {!searchResult && !searchError && !isSearching && (
              <Animated.View style={[styles.emptyState, { opacity: emptyStateAnimation }]}>
                <IconSymbol name="magnifyingglass" size={60} color="#D3D3D3" />
                <Text style={styles.emptyStateTitle}>Search for a word to get started</Text>
                <Text style={styles.emptyStateSubtitle}>Try: articulate, comprehensive, inevitable</Text>
              </Animated.View>
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <>
            {isLoadingSaved && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3BB9F0" />
                <Text style={styles.loadingText}>Loading saved words...</Text>
              </View>
            )}

            {!isLoadingSaved && savedWords.length > 0 && (
              <Animated.View
                style={[
                  styles.savedWordsContainer,
                  {
                    opacity: savedWordsAnimation,
                    transform: [{
                      translateY: savedWordsAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  },
                ]}
              >
                {savedWords.map((savedWord, index) => {
                  let formattedDate = 'Recently added';
                  if (savedWord.created_at) {
                    try {
                      const date = new Date(savedWord.created_at);
                      if (!isNaN(date.getTime())) {
                        formattedDate = date.toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        });
                      }
                    } catch (error) {
                      console.error('[Vocabulary] Date parsing error:', error);
                    }
                  }
                  return (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.savedWordItem,
                        pressed && styles.savedWordItemPressed
                      ]}
                      onPress={() => handleSavedWordClick(savedWord.word)}
                    >
                      <View style={styles.savedWordInfo}>
                        <Text style={styles.savedWordText}>{savedWord.word}</Text>
                        <Text style={styles.savedWordDate}>{formattedDate}</Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.deleteButton,
                          pressed && { transform: [{ scale: 0.85 }], backgroundColor: '#FFE5E5' }
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteWord(savedWord.word);
                        }}
                      >
                        <IconSymbol name="trash" size={20} color="#FF6B6B" />
                      </Pressable>
                    </Pressable>
                  );
                })}
              </Animated.View>
            )}

            {!isLoadingSaved && savedWords.length === 0 && (
              <View style={styles.emptyState}>
                <IconSymbol name="bookmark" size={60} color="#D3D3D3" />
                <Text style={styles.emptyStateTitle}>No saved words yet</Text>
                <Text style={styles.emptyStateSubtitle}>Save words to practice them later</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#000' },
  searchSection: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, zIndex: 10 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#000', fontWeight: '400' },
  suggestionsContainer: {
    position: 'absolute', top: 76, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 12, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    maxHeight: 250, overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  suggestionItemPressed: { backgroundColor: '#F5F5F5' },
  suggestionItemLast: { borderBottomWidth: 0 },
  suggestionText: { fontSize: 15, color: '#333', flex: 1 },
  tabsContainer: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1, paddingVertical: 16, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#3BB9F0' },
  tabPressed: { backgroundColor: '#F8F8F8' },
  tabText: { fontSize: 16, fontWeight: '500', color: '#999' },
  tabTextActive: { color: '#3BB9F0', fontWeight: '600' },
  content: { flex: 1, backgroundColor: '#FAFAFA' },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyStateTitle: { fontSize: 15, color: '#999', marginTop: 16, marginBottom: 6, textAlign: 'center', fontWeight: '500' },
  emptyStateSubtitle: { fontSize: 14, color: '#BBB', textAlign: 'center' },
  errorContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  errorText: { fontSize: 16, color: '#FF6B6B', marginTop: 16, textAlign: 'center', fontWeight: '500' },
  errorSubtext: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
  resultContainer: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 24,
    shadowColor: '#3BB9F0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  wordHeader: { marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  wordMainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  wordTitle: { fontSize: 28, fontWeight: '700', color: '#000' },
  wordActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  actionButtonActive: { backgroundColor: '#E8F6FC', shadowColor: '#3BB9F0', shadowOpacity: 0.2 },
  phoneticText: { fontSize: 15, color: '#666', fontWeight: '400' },
  meaningSection: { marginBottom: 20 },
  partOfSpeech: { fontSize: 13, fontWeight: '600', color: '#3BB9F0', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  definitionItem: { marginBottom: 16 },
  definitionText: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 6 },
  exampleText: { fontSize: 14, color: '#888', lineHeight: 20, marginTop: 6, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#E0E0E0' },
  relatedWordsContainer: { marginTop: 12 },
  relatedWordsLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordTag: {
    backgroundColor: '#F0F8FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: '#D0E8FF',
    shadowColor: '#3BB9F0', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
  },
  wordTagText: { fontSize: 13, color: '#3BB9F0', fontWeight: '500' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
  savedWordsContainer: { padding: 16 },
  savedWordItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  savedWordItemPressed: { backgroundColor: '#F8F8F8', transform: [{ scale: 0.98 }] },
  savedWordInfo: { flex: 1 },
  savedWordText: { fontSize: 17, fontWeight: '600', color: '#000', marginBottom: 4 },
  savedWordDate: { fontSize: 12, color: '#999' },
  deleteButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center' },
});