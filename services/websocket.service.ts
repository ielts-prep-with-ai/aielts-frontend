import { AuthService } from './auth.service';
import { WebSocketFeedbackMessage } from './types';
import { API_CONFIG } from '../config/api.config';

const WS_BASE_URL = API_CONFIG.WS_BASE_URL;

type FeedbackCallback = (message: WebSocketFeedbackMessage) => void;
type ErrorCallback = (error: Event) => void;
type CloseCallback = (event: CloseEvent) => void;

/**
 * WebSocket Service - Handles real-time feedback WebSocket connection
 */
class WebSocketServiceClass {
  private ws: WebSocket | null = null;
  private feedbackCallbacks: FeedbackCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private closeCallbacks: CloseCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds

  /**
   * Connect to the feedback WebSocket
   * GET /ws/feedback?token={access_token}
   */
  async connect(): Promise<void> {
    console.log('[WebSocketService] Connecting to feedback WebSocket...');

    try {
      // Get access token
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }

      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
      }

      // Create WebSocket connection with token in query params
      const wsUrl = `${WS_BASE_URL}/ws/feedback?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      // Set up event handlers
      this.ws.onopen = () => {
        console.log('[WebSocketService] WebSocket connection established');
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      };

      this.ws.onmessage = (event) => {
        console.log('[WebSocketService] Received message:', event.data);

        try {
          const message: WebSocketFeedbackMessage = JSON.parse(event.data);
          // Notify all registered callbacks
          this.feedbackCallbacks.forEach((callback) => callback(message));
        } catch (error) {
          console.error('[WebSocketService] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocketService] WebSocket error:', error);
        // Notify all registered error callbacks
        this.errorCallbacks.forEach((callback) => callback(error));
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocketService] WebSocket connection closed:', event.code, event.reason);
        // Notify all registered close callbacks
        this.closeCallbacks.forEach((callback) => callback(event));

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(
            `[WebSocketService] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
          );
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };

      console.log('[WebSocketService] WebSocket initialized');
    } catch (error) {
      console.error('[WebSocketService] Failed to connect to WebSocket:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    console.log('[WebSocketService] Disconnecting from WebSocket...');

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    // Clear all callbacks
    this.feedbackCallbacks = [];
    this.errorCallbacks = [];
    this.closeCallbacks = [];
    this.reconnectAttempts = 0;
  }

  /**
   * Register a callback for feedback messages
   */
  onFeedback(callback: FeedbackCallback): () => void {
    this.feedbackCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.feedbackCallbacks = this.feedbackCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register a callback for error events
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register a callback for close events
   */
  onClose(callback: CloseCallback): () => void {
    this.closeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.closeCallbacks = this.closeCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get the current WebSocket ready state
   */
  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }
}

export const WebSocketService = new WebSocketServiceClass();
