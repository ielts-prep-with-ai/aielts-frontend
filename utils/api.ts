import { AuthService } from '@/services/auth.service';

const API_BASE_URL = 'https://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1';

/**
 * Make an authenticated API request with automatic token validation
 * If the token is invalid or expired, it will attempt to refresh it
 *
 * @param endpoint - The API endpoint (e.g., '/questions')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Response object
 * @throws Error if request fails or session is invalid
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🌐 [API] Making authenticated request');
  console.log('🌐 [API] Endpoint:', endpoint);
  console.log('═══════════════════════════════════════════════════════════');

  // Get the current token
  const token = await AuthService.getToken();

  if (!token) {
    console.error('❌ [API] No token found, user not authenticated');
    throw new Error('Not authenticated');
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Make the request
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('🌐 [API] Request URL:', url);

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If we get a 401, the token might be expired - try to refresh it
  if (response.status === 401) {
    console.log('⚠️ [API] Received 401 Unauthorized, attempting token refresh...');

    const newToken = await AuthService.refreshAccessToken();

    if (!newToken) {
      console.error('❌ [API] Token refresh failed, session expired');
      throw new Error('Session expired');
    }

    console.log('✅ [API] Token refreshed, retrying request...');

    // Retry the request with the new token
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  console.log('🌐 [API] Response status:', response.status);
  console.log('═══════════════════════════════════════════════════════════');

  return response;
}

/**
 * Convenience method for GET requests
 */
export async function apiGet(endpoint: string): Promise<Response> {
  return authenticatedFetch(endpoint, { method: 'GET' });
}

/**
 * Convenience method for POST requests
 */
export async function apiPost(endpoint: string, data: any): Promise<Response> {
  return authenticatedFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut(endpoint: string, data: any): Promise<Response> {
  return authenticatedFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete(endpoint: string): Promise<Response> {
  return authenticatedFetch(endpoint, { method: 'DELETE' });
}
