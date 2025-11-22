import { ApiService } from './api.service';
import { DictionaryDefinition, SavedWord, SaveWordRequest } from './types';

/**
 * Vocabulary Service - Handles all vocabulary-related API calls
 */
class VocabularyServiceClass {
  /**
   * Get all words saved by the user
   * GET /users/words
   */
  async getSavedWords(): Promise<SavedWord[]> {
    console.log('[VocabularyService] Fetching saved words...');

    try {
      const words = await ApiService.get<SavedWord[]>('/users/words');
      console.log(`[VocabularyService] Successfully fetched ${words.length} saved words`);
      return words;
    } catch (error) {
      console.error('[VocabularyService] Failed to fetch saved words:', error);
      throw error;
    }
  }

  /**
   * Save a word to user's vocabulary list
   * POST /users/words
   */
  async saveWord(word: string): Promise<SavedWord> {
    console.log(`[VocabularyService] Saving word: ${word}...`);

    try {
      const request: SaveWordRequest = { word };
      const savedWord = await ApiService.post<SavedWord>('/users/words', request);
      console.log(`[VocabularyService] Word "${word}" saved successfully`);
      return savedWord;
    } catch (error) {
      console.error(`[VocabularyService] Failed to save word "${word}":`, error);
      throw error;
    }
  }

  /**
   * Delete a saved word from user's vocabulary list
   * DELETE /users/words/{word}
   */
  async deleteWord(word: string): Promise<void> {
    console.log(`[VocabularyService] Deleting word: ${word}...`);

    try {
      await ApiService.delete(`/users/words/${encodeURIComponent(word)}`);
      console.log(`[VocabularyService] Word "${word}" deleted successfully`);
    } catch (error) {
      console.error(`[VocabularyService] Failed to delete word "${word}":`, error);
      throw error;
    }
  }

  /**
   * Look up word definition (public endpoint, no auth required)
   * GET /vocabulary/search?q={word}
   */
  async searchWord(word: string): Promise<DictionaryDefinition> {
    console.log(`[VocabularyService] Looking up word: ${word}...`);

    try {
      const definition = await ApiService.get<DictionaryDefinition>(
        `/vocabulary/search?q=${encodeURIComponent(word)}`,
        { skipAuth: true }
      );
      console.log(`[VocabularyService] Successfully found definition for "${word}"`);
      return definition;
    } catch (error) {
      console.error(`[VocabularyService] Failed to search word "${word}":`, error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions for a word prefix (public endpoint, no auth required)
   * GET /vocabulary/autocomplete?prefix={prefix}
   */
  async getAutocompleteSuggestions(prefix: string): Promise<string[]> {
    console.log(`[VocabularyService] Fetching autocomplete for: ${prefix}...`);

    try {
      const response = await ApiService.get<{ Word: string; Count: number }[]>(
        `/vocabulary/autocomplete?prefix=${encodeURIComponent(prefix)}`,
        { skipAuth: true }
      );
      const suggestions = response.map(item => item.Word);
      console.log(`[VocabularyService] Found ${suggestions.length} suggestions for "${prefix}"`);
      return suggestions;
    } catch (error) {
      console.error(`[VocabularyService] Failed to get autocomplete for "${prefix}":`, error);
      throw error;
    }
  }
}

export const VocabularyService = new VocabularyServiceClass();