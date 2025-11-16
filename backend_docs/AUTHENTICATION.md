# Authentication Guide

Complete guide to implementing authentication in your frontend application.

## Table of Contents

- [Overview](#overview)
- [OAuth 2.0 Flow](#oauth-20-flow)
- [JWT Token Management](#jwt-token-management)
- [Token Storage](#token-storage)
- [Making Authenticated Requests](#making-authenticated-requests)
- [Token Refresh](#token-refresh)
- [Logout](#logout)
- [Error Handling](#error-handling)

---

## Overview

The AI IELTS Backend uses a hybrid authentication approach:

1. **Google OAuth 2.0** for user login (no password required)
2. **JWT tokens** for API authorization
3. **Session management** in PostgreSQL for token revocation

### Token Types

| Token Type | Lifespan | Purpose | Storage |
|------------|----------|---------|---------|
| Access Token | 15 minutes (default) | API requests | Memory/localStorage |
| Refresh Token | 7 days (default) | Renew access token | Secure storage only |

---

## OAuth 2.0 Flow

### Step-by-Step Implementation

#### 1. Initiate Login

When user clicks "Login with Google":

```javascript
function handleGoogleLogin() {
  const frontendCallbackUrl = `${window.location.origin}/auth/callback`;
  const backendAuthUrl = `http://localhost:8301/auth/google?redirect_uri=${encodeURIComponent(frontendCallbackUrl)}`;

  // Redirect to backend OAuth endpoint
  window.location.href = backendAuthUrl;
}
```

**Parameters:**
- `redirect_uri`: Your frontend callback URL where the user will be redirected after authentication

---

#### 2. Handle Callback

Create a callback route in your frontend (e.g., `/auth/callback`):

```javascript
// React Example
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the hash fragment from URL
    const hash = window.location.hash.substring(1); // Remove '#'

    if (!hash) {
      console.error('No authentication data received');
      navigate('/login');
      return;
    }

    try {
      // Parse URL parameters
      const params = new URLSearchParams(hash);
      const encodedData = params.get('user_data');

      if (!encodedData) {
        throw new Error('No user data in callback');
      }

      // Decode base64 data
      const userData = JSON.parse(atob(encodedData));

      // Store tokens
      storeAuthTokens(userData);

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Authentication failed:', error);
      navigate('/login');
    }
  }, [navigate]);

  return <div>Authenticating...</div>;
}

function storeAuthTokens(userData) {
  // Store in localStorage (or secure storage)
  localStorage.setItem('access_token', userData.access_token);
  localStorage.setItem('refresh_token', userData.refresh_token);
  localStorage.setItem('access_token_expires_at', userData.access_token_expires_at);
  localStorage.setItem('user_id', userData.user_id);
  localStorage.setItem('user_name', userData.user_name);
  localStorage.setItem('avatar_url', userData.avatar_url);
}
```

---

#### 3. User Data Structure

After successful authentication, you'll receive:

```typescript
interface UserAuthData {
  session_id: string;              // UUID
  user_id: string;                 // Google user ID
  user_name: string;               // User's display name
  avatar_url: string;              // Profile picture URL
  access_token: string;            // JWT access token
  refresh_token: string;           // JWT refresh token
  access_token_expires_at: string; // ISO 8601 timestamp
  refresh_token_expires_at: string;// ISO 8601 timestamp
}
```

**Example Data:**
```json
{
  "session_id": "a3f21e45-8b9c-4d2f-9e1a-3b4c5d6e7f8a",
  "user_id": "108234567890123456789",
  "user_name": "John Doe",
  "avatar_url": "https://lh3.googleusercontent.com/a/...",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_token_expires_at": "2025-11-12T15:30:00Z",
  "refresh_token_expires_at": "2025-11-19T15:00:00Z"
}
```

---

## JWT Token Management

### Token Structure

JWT tokens are signed using HMAC-SHA256. The payload contains:

```typescript
interface JWTPayload {
  id: string;        // Session ID (UUID)
  user_id: string;   // Google OAuth user ID
  iat: number;       // Issued at (Unix timestamp)
  exp: number;       // Expires at (Unix timestamp)
}
```

### Decoding Tokens (Optional)

While not required, you can decode JWT tokens to inspect expiration:

```javascript
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Usage
const payload = decodeJWT(accessToken);
console.log('Token expires at:', new Date(payload.exp * 1000));
```

---

## Token Storage

### Best Practices

**Option 1: localStorage (Simple, Less Secure)**
```javascript
// Store
localStorage.setItem('access_token', accessToken);
localStorage.setItem('refresh_token', refreshToken);

// Retrieve
const accessToken = localStorage.getItem('access_token');
```

**Pros:**
- Simple to implement
- Persists across browser sessions

**Cons:**
- Vulnerable to XSS attacks
- Not recommended for highly sensitive applications

---

**Option 2: Memory + httpOnly Cookie (More Secure)**

Store access token in memory and refresh token in httpOnly cookie (requires backend modification):

```javascript
// In-memory storage
let accessToken = null;

function setAccessToken(token) {
  accessToken = token;
}

function getAccessToken() {
  return accessToken;
}

// Refresh token handled by httpOnly cookie automatically
```

**Pros:**
- More secure against XSS
- Refresh token not accessible via JavaScript

**Cons:**
- Requires backend cookie support
- Access token lost on page refresh (need to refresh immediately)

---

**Option 3: React Context + Secure Storage**

```javascript
// AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_data');

    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = (userData) => {
    setAccessToken(userData.access_token);
    setUser({
      id: userData.user_id,
      name: userData.user_name,
      avatar: userData.avatar_url
    });

    localStorage.setItem('access_token', userData.access_token);
    localStorage.setItem('refresh_token', userData.refresh_token);
    localStorage.setItem('user_data', JSON.stringify({
      id: userData.user_id,
      name: userData.user_name,
      avatar: userData.avatar_url
    }));
  };

  const logout = async () => {
    // Call logout endpoint
    await fetch('http://localhost:8301/api/v1/auth/logout/google', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Clear state
    setAccessToken(null);
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

**Usage:**
```javascript
function Dashboard() {
  const { user, accessToken } = useAuth();

  if (!accessToken) {
    return <Navigate to="/login" />;
  }

  return <div>Welcome, {user.name}!</div>;
}
```

---

## Making Authenticated Requests

### Basic Pattern

```javascript
async function fetchWithAuth(url, options = {}) {
  const accessToken = localStorage.getItem('access_token');

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expired, try to refresh
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry request with new token
      return fetchWithAuth(url, options);
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }
  }

  return response;
}
```

---

### Axios Interceptor Example

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8301/api/v1'
});

// Request interceptor - add token to all requests
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

**Usage:**
```javascript
import api from './api';

// Get topics
const response = await api.get('/topics');
const topics = response.data;

// Submit answer
const formData = new FormData();
formData.append('audio_file', audioBlob);
const result = await api.post(`/questions/${questionId}/answers`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

---

## Token Refresh

### When to Refresh

Refresh the access token when:
1. API returns 401 Unauthorized
2. Token expiration time is approaching (preemptive refresh)

### Manual Refresh

```javascript
async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('http://localhost:8301/api/v1/token/renew', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    // Store new access token
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('access_token_expires_at', data.access_token_expires_at);

    return data.access_token;

  } catch (error) {
    console.error('Failed to refresh token:', error);
    // Clear tokens and redirect to login
    localStorage.clear();
    return null;
  }
}
```

---

### Automatic Refresh (Proactive)

Refresh token before it expires:

```javascript
function setupTokenRefresh() {
  const checkInterval = 60000; // Check every minute

  setInterval(async () => {
    const expiresAt = localStorage.getItem('access_token_expires_at');

    if (!expiresAt) return;

    const expirationTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // Refresh if expiring in less than 5 minutes
    if (timeUntilExpiry < 5 * 60 * 1000) {
      console.log('Access token expiring soon, refreshing...');
      await refreshAccessToken();
    }
  }, checkInterval);
}

// Call on app initialization
setupTokenRefresh();
```

---

### React Hook for Token Refresh

```javascript
import { useEffect } from 'react';

export function useTokenRefresh() {
  useEffect(() => {
    const interval = setInterval(async () => {
      const expiresAt = localStorage.getItem('access_token_expires_at');

      if (!expiresAt) return;

      const expirationTime = new Date(expiresAt).getTime();
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      // Refresh if expiring in less than 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        try {
          await refreshAccessToken();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);
}
```

**Usage in App:**
```javascript
function App() {
  useTokenRefresh(); // Automatically refreshes tokens

  return <RouterProvider router={router} />;
}
```

---

## Logout

### Logout Flow

```javascript
async function logout() {
  const accessToken = localStorage.getItem('access_token');

  try {
    // Call backend logout endpoint
    await fetch('http://localhost:8301/api/v1/auth/logout/google', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  } catch (error) {
    console.error('Logout request failed:', error);
    // Continue with local cleanup even if backend call fails
  }

  // Clear local storage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('access_token_expires_at');
  localStorage.removeItem('user_data');

  // Redirect to login
  window.location.href = '/login';
}
```

### What Happens on Backend

1. Session is marked as blocked in database
2. Refresh token is invalidated
3. User must re-authenticate via OAuth

---

## Error Handling

### Common Authentication Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired access token | Refresh token or re-login |
| 401 on `/token/renew` | Invalid/expired refresh token | User must re-login |
| Missing Authorization header | Token not sent | Check token storage |
| Malformed token | Incorrect format | Re-authenticate |

---

### Error Response Format

```json
{
  "error": "token has expired"
}
```

---

### Handling Auth Errors

```javascript
async function handleApiCall() {
  try {
    const response = await fetchWithAuth('/api/v1/topics');

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 401) {
        // Try to refresh
        const refreshed = await refreshAccessToken();

        if (refreshed) {
          // Retry request
          return handleApiCall();
        } else {
          // Force re-login
          window.location.href = '/login';
        }
      }

      throw new Error(error.error || 'Request failed');
    }

    return await response.json();

  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

---

## Security Best Practices

### 1. Token Storage
- **Never** expose tokens in URL parameters
- **Never** log tokens to console in production
- Consider using httpOnly cookies for refresh tokens (requires backend changes)

### 2. HTTPS
- Always use HTTPS in production
- Tokens over HTTP can be intercepted

### 3. Token Expiration
- Don't ignore token expiration times
- Implement automatic refresh before expiration

### 4. XSS Protection
- Sanitize user input
- Use Content Security Policy (CSP)
- Consider using a state management library that prevents XSS

### 5. CSRF Protection
- Backend already has CORS configured
- For cookies, implement CSRF tokens

---

## Complete Authentication Example

```javascript
// auth.js - Complete authentication service

class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:8301/api/v1';
    this.setupTokenRefresh();
  }

  // Initiate Google OAuth login
  login(callbackUrl) {
    const backendAuthUrl = `${this.baseURL}/auth/google?redirect_uri=${encodeURIComponent(callbackUrl)}`;
    window.location.href = backendAuthUrl;
  }

  // Handle OAuth callback
  handleCallback() {
    const hash = window.location.hash.substring(1);

    if (!hash) {
      throw new Error('No authentication data');
    }

    const params = new URLSearchParams(hash);
    const encodedData = params.get('user_data');
    const userData = JSON.parse(atob(encodedData));

    this.storeTokens(userData);
    return userData;
  }

  // Store tokens and user data
  storeTokens(userData) {
    localStorage.setItem('access_token', userData.access_token);
    localStorage.setItem('refresh_token', userData.refresh_token);
    localStorage.setItem('access_token_expires_at', userData.access_token_expires_at);
    localStorage.setItem('user_data', JSON.stringify({
      id: userData.user_id,
      name: userData.user_name,
      avatar: userData.avatar_url
    }));
  }

  // Get current access token
  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  // Get current user data
  getUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // Refresh access token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await fetch(`${this.baseURL}/token/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('access_token_expires_at', data.access_token_expires_at);

    return data.access_token;
  }

  // Logout
  async logout() {
    const accessToken = this.getAccessToken();

    if (accessToken) {
      try {
        await fetch(`${this.baseURL}/auth/logout/google`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.clearTokens();
    window.location.href = '/login';
  }

  // Clear all tokens
  clearTokens() {
    localStorage.clear();
  }

  // Setup automatic token refresh
  setupTokenRefresh() {
    setInterval(async () => {
      const expiresAt = localStorage.getItem('access_token_expires_at');

      if (!expiresAt) return;

      const timeUntilExpiry = new Date(expiresAt).getTime() - Date.now();

      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }
    }, 60000);
  }
}

export default new AuthService();
```

**Usage:**
```javascript
import authService from './auth';

// Login button
function LoginButton() {
  const handleLogin = () => {
    authService.login(`${window.location.origin}/auth/callback`);
  };

  return <button onClick={handleLogin}>Login with Google</button>;
}

// Callback page
function AuthCallback() {
  useEffect(() => {
    try {
      const userData = authService.handleCallback();
      navigate('/dashboard');
    } catch (error) {
      navigate('/login');
    }
  }, []);

  return <div>Authenticating...</div>;
}

// Protected component
function Dashboard() {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  const user = authService.getUser();
  return <div>Welcome, {user.name}!</div>;
}
```

---

## Troubleshooting

### Token Expired Immediately

**Cause:** Server and client clocks are out of sync

**Solution:** Ensure system time is synchronized via NTP

---

### Infinite Redirect Loop

**Cause:** Callback URL misconfigured or tokens not being stored

**Solution:**
1. Verify `redirect_uri` matches exactly
2. Check browser console for errors
3. Ensure tokens are being stored in callback handler

---

### 401 on Every Request

**Cause:** Token not being sent or invalid format

**Solution:**
1. Check Authorization header format: `Bearer <token>`
2. Verify token is in localStorage
3. Check token hasn't expired

---

This completes the authentication guide. For API endpoint details, see [API_ENDPOINTS.md](./API_ENDPOINTS.md).
