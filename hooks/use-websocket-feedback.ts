/**
 * Custom hook for WebSocket feedback
 */
import { useEffect, useState } from 'react';
import { WebSocketService } from '@/services/websocket.service';
import { WebSocketFeedbackMessage } from '@/services/types';

export function useWebSocketFeedback(userAnswerId?: number) {
  const [feedback, setFeedback] = useState<WebSocketFeedbackMessage | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribeFeedback: (() => void) | undefined;
    let unsubscribeError: (() => void) | undefined;

    const setupWebSocket = async () => {
      try {
        // Connect if not already connected
        if (!WebSocketService.isConnected()) {
          await WebSocketService.connect();
        }
        setConnected(true);

        // Subscribe to feedback messages
        unsubscribeFeedback = WebSocketService.onFeedback((message) => {
          // If userAnswerId is provided, filter messages
          if (userAnswerId && message.user_answer_id !== userAnswerId) {
            return;
          }
          setFeedback(message);
        });

        // Subscribe to errors
        unsubscribeError = WebSocketService.onError((err) => {
          console.error('[useWebSocketFeedback] WebSocket error:', err);
          setError(new Error('WebSocket connection error'));
          setConnected(false);
        });
      } catch (err) {
        console.error('[useWebSocketFeedback] Failed to setup WebSocket:', err);
        setError(err instanceof Error ? err : new Error('Failed to connect to WebSocket'));
        setConnected(false);
      }
    };

    setupWebSocket();

    // Cleanup
    return () => {
      if (unsubscribeFeedback) unsubscribeFeedback();
      if (unsubscribeError) unsubscribeError();
    };
  }, [userAnswerId]);

  return {
    feedback,
    connected,
    error,
    clearFeedback: () => setFeedback(null),
  };
}
