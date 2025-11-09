import { AuthService } from './auth.service';

const API_BASE_URL = 'https://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1';
// const API_BASE_URL = 'http://localhost:8301/api/v1';

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryOnUnauthorized?: boolean;
}

class ApiServiceClass {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  /**
   * Subscribe to token refresh completion
   */
  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  /**
   * Notify all subscribers that token has been refreshed
   */
  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  /**
   * Make authenticated API request with automatic token refresh
   */
  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, retryOnUnauthorized = true, ...fetchOptions } = options;

    let token: string | null = null;

    // Get access token if not skipping auth
    if (!skipAuth) {
      token = await AuthService.getToken();

      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }
    }

    // Build headers
    const headers = new Headers(fetchOptions.headers);
    if (token && !skipAuth) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && fetchOptions.body) {
      headers.set('Content-Type', 'application/json');
    }

    // Make request
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] ${fetchOptions.method || 'GET'} ${url}`);

    let response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && retryOnUnauthorized && !skipAuth) {
      console.log('[API] Received 401, attempting token refresh...');

      // If already refreshing, wait for it to complete
      if (this.isRefreshing) {
        console.log('[API] Token refresh already in progress, waiting...');
        const newToken = await new Promise<string>((resolve) => {
          this.subscribeTokenRefresh(resolve);
        });

        // Retry with new token
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, {
          ...fetchOptions,
          headers,
        });
      } else {
        // Start refresh process
        this.isRefreshing = true;

        try {
          const newToken = await AuthService.refreshAccessToken();

          if (!newToken) {
            throw new Error('Failed to refresh token');
          }

          // Notify all waiting requests
          this.onTokenRefreshed(newToken);

          // Retry original request with new token
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await fetch(url, {
            ...fetchOptions,
            headers,
          });
        } catch (error) {
          console.error('[API] Token refresh failed:', error);
          throw new Error('Session expired. Please login again.');
        } finally {
          this.isRefreshing = false;
        }
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If not JSON, use the text as is
        if (errorText) errorMessage = errorText;
      }

      console.error('[API] Request failed:', errorMessage);
      throw new Error(errorMessage);
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    // Return empty object for non-JSON responses
    return {} as T;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const ApiService = new ApiServiceClass();
