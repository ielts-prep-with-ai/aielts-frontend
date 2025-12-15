/**
 * Custom hook for managing questions
 */
import { useState, useEffect } from 'react';
import { QuestionsService } from '@/services/questions.service';
import { QuestionWithDetails, ListQuestionsRequest } from '@/services/types';

export function useQuestions(params: ListQuestionsRequest) {
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await QuestionsService.listQuestions(params);
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load questions'));
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [params.topic_id, params.part, params.page_index, params.page_size]);

  return {
    questions,
    loading,
    error,
    refresh: loadQuestions,
  };
}
