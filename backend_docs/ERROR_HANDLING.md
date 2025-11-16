# Error Handling Guide

Complete guide to understanding and handling errors from the AI IELTS Backend API.

## Table of Contents

- [HTTP Status Codes](#http-status-codes)
- [Error Response Format](#error-response-format)
- [Common Errors by Endpoint](#common-errors-by-endpoint)
- [Error Handling Patterns](#error-handling-patterns)
- [Troubleshooting Guide](#troubleshooting-guide)

---

## HTTP Status Codes

The API uses standard HTTP status codes to indicate success or failure.

### Success Codes

| Code | Name | Description | When Used |
|------|------|-------------|-----------|
| 200 | OK | Request successful | GET requests, successful operations |
| 201 | Created | Resource created successfully | POST requests creating new resources |
| 204 | No Content | Successful deletion | DELETE requests |

---

### Client Error Codes (4xx)

| Code | Name | Description | Common Causes |
|------|------|-------------|---------------|
| 400 | Bad Request | Invalid request format or parameters | Missing required fields, invalid JSON, type mismatch |
| 401 | Unauthorized | Authentication failed or missing | Missing/invalid access token, expired token |
| 404 | Not Found | Resource doesn't exist | Invalid ID, deleted resource |
| 409 | Conflict | Business logic conflict | Duplicate entry, invalid state transition |

---

### Server Error Codes (5xx)

| Code | Name | Description | Common Causes |
|------|------|-------------|---------------|
| 500 | Internal Server Error | Unexpected server error | Database error, unhandled exception |

---

## Error Response Format

### Standard Error Response

All errors follow this format:

```typescript
interface ErrorResponse {
  error: string; // Human-readable error message
}
```

**Example:**
```json
{
  "error": "token has expired"
}
```

---

### Validation Error Response

For request validation failures:

```json
{
  "error": "Key: 'startTestRequest.Mode' Error:Field validation for 'Mode' failed on the 'required' tag"
}
```

---

## Common Errors by Endpoint

### Authentication Endpoints

#### POST /token/renew

**401 Unauthorized**
```json
{
  "error": "token has expired"
}
```
**Cause:** Refresh token has expired
**Solution:** User must log in again via OAuth

```json
{
  "error": "invalid token"
}
```
**Cause:** Malformed or tampered refresh token
**Solution:** Clear tokens and redirect to login

---

**404 Not Found**
```json
{
  "error": "session not found"
}
```
**Cause:** Session was deleted or never existed
**Solution:** User must log in again

---

### Topic & Question Endpoints

#### GET /topics

**401 Unauthorized**
```json
{
  "error": "authorization header is not provided"
}
```
**Cause:** Missing Authorization header
**Solution:** Include `Authorization: Bearer {token}` header

```json
{
  "error": "authorization header format is invalid"
}
```
**Cause:** Incorrect header format (not "Bearer {token}")
**Solution:** Fix header format

---

**500 Internal Server Error**
```json
{
  "error": "failed to list topics"
}
```
**Cause:** Database error or server issue
**Solution:** Retry request, contact support if persists

---

#### GET /questions

**400 Bad Request**
```json
{
  "error": "invalid topic_id"
}
```
**Cause:** topic_id is not a valid number
**Solution:** Ensure topic_id is a valid integer

```json
{
  "error": "invalid page_index or page_size"
}
```
**Cause:** Pagination parameters are invalid
**Solution:** Use positive integers for page_index and page_size

---

**404 Not Found**
```json
{
  "error": "no questions found for this topic"
}
```
**Cause:** Topic has no questions or topic doesn't exist
**Solution:** Verify topic_id is correct

---

#### GET /questions/{id}

**404 Not Found**
```json
{
  "error": "question not found"
}
```
**Cause:** Question ID doesn't exist
**Solution:** Verify question ID is correct

---

### Practice & Test Endpoints

#### POST /start_test

**400 Bad Request**
```json
{
  "error": "at least one part must be selected"
}
```
**Cause:** All part_1, part_2, part_3 are false
**Solution:** Set at least one part to true

```json
{
  "error": "invalid mode: must be 'practice' or 'simulation'"
}
```
**Cause:** Mode is not "practice" or "simulation"
**Solution:** Use valid mode value

---

**404 Not Found**
```json
{
  "error": "exam set not found"
}
```
**Cause:** exam_set_id doesn't exist or is inactive
**Solution:** Verify exam set ID from /examsets endpoint

---

#### POST /questions/{id}/answers

**400 Bad Request**
```json
{
  "error": "audio_file is required"
}
```
**Cause:** No file uploaded or wrong field name
**Solution:** Upload file with field name "audio_file"

```json
{
  "error": "invalid file format"
}
```
**Cause:** Uploaded file is not an audio format
**Solution:** Use WAV, MP3, or other supported audio formats

---

**404 Not Found**
```json
{
  "error": "question not found"
}
```
**Cause:** Question ID in URL doesn't exist
**Solution:** Verify question ID

---

**500 Internal Server Error**
```json
{
  "error": "failed to upload audio file"
}
```
**Cause:** R2 storage error or network issue
**Solution:** Retry upload, check file size (should be < 10MB)

---

#### POST /confirm_simulation_submission

**400 Bad Request**
```json
{
  "error": "test_session_id is required"
}
```
**Cause:** Missing test_session_id in request
**Solution:** Include valid test session UUID

```json
{
  "error": "answers cannot be empty"
}
```
**Cause:** No answers provided
**Solution:** Include at least one answer URL

---

**404 Not Found**
```json
{
  "error": "test session not found"
}
```
**Cause:** Test session ID doesn't exist
**Solution:** Verify test session UUID from /start_test response

---

**409 Conflict**
```json
{
  "error": "test session already completed"
}
```
**Cause:** Attempting to submit answers for already completed test
**Solution:** Start a new test session

---

### Vocabulary Endpoints

#### POST /users/words

**400 Bad Request**
```json
{
  "error": "word is required"
}
```
**Cause:** Missing "word" field in request body
**Solution:** Include word in request

---

**409 Conflict**
```json
{
  "error": "word already saved"
}
```
**Cause:** User already saved this word
**Solution:** Display message to user, no action needed

---

#### DELETE /users/words/{word}

**404 Not Found**
```json
{
  "error": "word not found in user's saved words"
}
```
**Cause:** User hasn't saved this word
**Solution:** Refresh word list, verify word exists

---

### WebSocket Endpoints

#### GET /ws/feedback

**401 Unauthorized**
```json
{
  "error": "invalid token"
}
```
**Cause:** Token in query parameter is invalid
**Solution:** Ensure valid access token in WebSocket URL

---

**Upgrade Failed**
If WebSocket upgrade fails, you'll get HTTP error instead of WebSocket connection.

**Cause:** Missing Upgrade headers or protocol mismatch
**Solution:** Ensure client sends correct WebSocket headers

---

## Error Handling Patterns

### Basic Error Handling

```javascript
async function fetchTopics() {
  try {
    const response = await fetch('http://localhost:8301/api/v1/topics', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error);
    }

    return await response.json();

  } catch (error) {
    console.error('Failed to fetch topics:', error.message);
    throw error;
  }
}
```

---

### Comprehensive Error Handling

```javascript
async function makeApiRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);

    // Handle specific status codes
    switch (response.status) {
      case 200:
      case 201:
        return await response.json();

      case 204:
        return null; // No content

      case 400: {
        const error = await response.json();
        throw new ValidationError(error.error);
      }

      case 401: {
        const error = await response.json();
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry request with new token
          return makeApiRequest(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          });
        }
        throw new AuthError(error.error);
      }

      case 404: {
        const error = await response.json();
        throw new NotFoundError(error.error);
      }

      case 409: {
        const error = await response.json();
        throw new ConflictError(error.error);
      }

      case 500: {
        const error = await response.json();
        throw new ServerError(error.error);
      }

      default: {
        const error = await response.json();
        throw new Error(error.error || 'Unknown error occurred');
      }
    }

  } catch (error) {
    // Network errors (no response received)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new NetworkError('Unable to connect to server');
    }

    throw error;
  }
}
```

---

### Custom Error Classes

```javascript
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

class ValidationError extends ApiError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class AuthError extends ApiError {
  constructor(message) {
    super(message, 401);
    this.name = 'AuthError';
  }
}

class NotFoundError extends ApiError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends ApiError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class ServerError extends ApiError {
  constructor(message) {
    super(message, 500);
    this.name = 'ServerError';
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

**Usage:**
```javascript
try {
  const topics = await makeApiRequest('/api/v1/topics', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
} catch (error) {
  if (error instanceof AuthError) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error instanceof NotFoundError) {
    // Show not found message
    showMessage('Resource not found');
  } else if (error instanceof NetworkError) {
    // Show offline message
    showMessage('You appear to be offline');
  } else {
    // Generic error handling
    showMessage('An error occurred: ' + error.message);
  }
}
```

---

### React Error Boundary

```javascript
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Log to error tracking service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### Axios Error Handling

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8301/api/v1'
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Network error
    if (!error.response) {
      throw new NetworkError('Unable to connect to server');
    }

    // Handle specific errors
    switch (error.response.status) {
      case 401:
        if (!originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            localStorage.clear();
            window.location.href = '/login';
            throw new AuthError('Session expired');
          }
        }
        throw new AuthError(error.response.data.error);

      case 400:
        throw new ValidationError(error.response.data.error);

      case 404:
        throw new NotFoundError(error.response.data.error);

      case 409:
        throw new ConflictError(error.response.data.error);

      case 500:
        throw new ServerError(error.response.data.error);

      default:
        throw new Error(error.response.data.error || 'Unknown error');
    }
  }
);

export default api;
```

---

### React Hook for Error Handling

```javascript
import { useState } from 'react';

export function useApiError() {
  const [error, setError] = useState(null);

  const handleError = (error) => {
    if (error instanceof AuthError) {
      localStorage.clear();
      window.location.href = '/login';
    } else if (error instanceof ValidationError) {
      setError(`Validation error: ${error.message}`);
    } else if (error instanceof NotFoundError) {
      setError(`Not found: ${error.message}`);
    } else if (error instanceof NetworkError) {
      setError('Network error. Please check your connection.');
    } else {
      setError(`Error: ${error.message}`);
    }
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
}
```

**Usage:**
```javascript
function TopicList() {
  const [topics, setTopics] = useState([]);
  const { error, handleError, clearError } = useApiError();

  useEffect(() => {
    async function loadTopics() {
      try {
        const data = await api.get('/topics');
        setTopics(data);
        clearError();
      } catch (err) {
        handleError(err);
      }
    }

    loadTopics();
  }, []);

  if (error) {
    return <div className="error">{error}</div>;
  }

  return <div>...</div>;
}
```

---

## Troubleshooting Guide

### Issue: "authorization header is not provided"

**Symptoms:**
- 401 error on protected endpoints
- Error message about missing authorization header

**Causes:**
1. Access token not included in request
2. Header name is incorrect
3. Token was cleared from storage

**Solutions:**
```javascript
// ✅ Correct
fetch('/api/v1/topics', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// ❌ Wrong - missing Bearer prefix
fetch('/api/v1/topics', {
  headers: {
    'Authorization': accessToken
  }
});

// ❌ Wrong - wrong header name
fetch('/api/v1/topics', {
  headers: {
    'Auth': `Bearer ${accessToken}`
  }
});
```

---

### Issue: "token has expired"

**Symptoms:**
- 401 error after some time
- Error message about expired token

**Causes:**
1. Access token expired (default: 15 minutes)
2. User's session was revoked

**Solutions:**
```javascript
// Option 1: Automatic retry with token refresh
async function fetchWithRetry(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error.response?.status === 401) {
      await refreshAccessToken();
      return await fetch(url, options);
    }
    throw error;
  }
}

// Option 2: Proactive refresh before expiration
setInterval(async () => {
  const expiresAt = localStorage.getItem('access_token_expires_at');
  const timeUntilExpiry = new Date(expiresAt) - Date.now();

  if (timeUntilExpiry < 5 * 60 * 1000) {
    await refreshAccessToken();
  }
}, 60000);
```

---

### Issue: CORS Error

**Symptoms:**
- Browser console shows CORS error
- Request doesn't reach server

**Causes:**
1. Making request from wrong origin
2. Missing CORS headers in preflight

**Solutions:**
```javascript
// Backend already has CORS enabled for all origins
// If still getting CORS errors:

// 1. Check if using correct URL
const url = 'http://localhost:8301/api/v1/topics'; // ✅
// NOT: localhost:8301/api/v1/topics (missing protocol) // ❌

// 2. For credentials, ensure:
fetch(url, {
  credentials: 'include', // If using cookies
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

// 3. For file uploads, don't set Content-Type manually
const formData = new FormData();
formData.append('audio_file', file);

fetch(url, {
  method: 'POST',
  body: formData,
  // Don't set Content-Type header - browser will set it with boundary
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

### Issue: "failed to upload audio file"

**Symptoms:**
- 500 error when uploading audio
- Upload hangs then fails

**Causes:**
1. File too large (limit: ~10MB)
2. Network timeout
3. R2 storage error
4. Wrong file format

**Solutions:**
```javascript
// 1. Check file size before upload
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

if (audioBlob.size > MAX_SIZE) {
  throw new Error('Audio file too large (max 10MB)');
}

// 2. Compress audio before upload
async function compressAudio(blob) {
  // Use audio compression library or reduce quality
  // Example: Convert to MP3 with lower bitrate
}

// 3. Add timeout to request
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s

try {
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    signal: controller.signal
  });
  clearTimeout(timeout);
  return response;
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Upload timeout - file may be too large');
  }
  throw error;
}
```

---

### Issue: WebSocket Connection Failed

**Symptoms:**
- WebSocket doesn't connect
- Error in connection

**Causes:**
1. Invalid access token
2. Wrong WebSocket URL
3. Server not accepting connections

**Solutions:**
```javascript
// Correct WebSocket URL format
const wsUrl = `ws://localhost:8301/api/v1/ws/feedback`;

const ws = new WebSocket(wsUrl);

// Add token to initial request (if supported) or send after connect
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: accessToken
  }));
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Fallback to polling if WebSocket fails
  startPolling();
};

ws.onclose = (event) => {
  if (!event.wasClean) {
    console.error('WebSocket closed unexpectedly');
    // Attempt to reconnect
    setTimeout(connectWebSocket, 5000);
  }
};
```

---

### Issue: Request Takes Too Long

**Symptoms:**
- Requests hang for a long time
- Eventually timeout

**Causes:**
1. Large file upload
2. Server processing delay
3. Network issues

**Solutions:**
```javascript
// 1. Add loading indicator
setLoading(true);
try {
  await apiCall();
} finally {
  setLoading(false);
}

// 2. Add timeout
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch(url, {
    signal: controller.signal
  });
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Request timeout');
  }
}

// 3. Show progress for uploads
const xhr = new XMLHttpRequest();

xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentage = (e.loaded / e.total) * 100;
    setUploadProgress(percentage);
  }
});

xhr.open('POST', url);
xhr.send(formData);
```

---

### Issue: Infinite Redirect Loop

**Symptoms:**
- Page keeps redirecting
- Login never completes

**Causes:**
1. Callback not storing tokens
2. Auth check before token stored

**Solutions:**
```javascript
// In OAuth callback:
useEffect(() => {
  const hash = window.location.hash.substring(1);

  if (!hash) return;

  try {
    const params = new URLSearchParams(hash);
    const encodedData = params.get('user_data');
    const userData = JSON.parse(atob(encodedData));

    // Store tokens BEFORE navigating
    localStorage.setItem('access_token', userData.access_token);
    localStorage.setItem('refresh_token', userData.refresh_token);

    // Clear hash to prevent re-processing
    window.history.replaceState(null, '', window.location.pathname);

    // Then navigate
    navigate('/dashboard');

  } catch (error) {
    console.error('Auth callback error:', error);
    navigate('/login');
  }
}, []); // Empty deps - run once
```

---

## Best Practices

1. **Always handle errors** - Never ignore error responses
2. **Use try-catch** - Wrap async calls in try-catch blocks
3. **Show user-friendly messages** - Don't show technical errors to users
4. **Log errors** - Log errors for debugging and monitoring
5. **Implement retry logic** - Retry failed requests (with exponential backoff)
6. **Handle network errors** - Check for offline state
7. **Validate before sending** - Validate input on frontend before API call
8. **Use error boundaries** - Catch React rendering errors
9. **Monitor error rates** - Track errors in production
10. **Test error scenarios** - Test how your app handles errors

---

This completes the error handling guide. For authentication details, see [AUTHENTICATION.md](./AUTHENTICATION.md).
