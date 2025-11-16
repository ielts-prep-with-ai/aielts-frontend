# Integration Guide

Step-by-step guide to integrating the AI IELTS Backend into your frontend application.

## Table of Contents

- [Quick Start](#quick-start)
- [Complete React Integration](#complete-react-integration)
- [Common Use Cases](#common-use-cases)
- [API Service Layer](#api-service-layer)
- [State Management](#state-management)
- [Real-time Features](#real-time-features)
- [File Upload Best Practices](#file-upload-best-practices)
- [Production Checklist](#production-checklist)

---

## Quick Start

### Prerequisites

- Node.js 16+ installed
- React 18+ (or your preferred frontend framework)
- Backend running on `http://localhost:8301`

### Installation

```bash
npm install axios
# or
yarn add axios
```

---

### Basic Setup

Create an API configuration file:

```javascript
// src/config/api.js

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8301/api/v1',
  WS_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:8301/api/v1',
  OAUTH_CALLBACK_URL: process.env.REACT_APP_OAUTH_CALLBACK || 'http://localhost:3000/auth/callback'
};
```

---

## Complete React Integration

### 1. Authentication Service

Create a comprehensive authentication service:

```javascript
// src/services/authService.js

import { API_CONFIG } from '../config/api';

class AuthService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.accessToken = null;
    this.user = null;
    this.loadFromStorage();
  }

  // Load tokens from localStorage on initialization
  loadFromStorage() {
    this.accessToken = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    this.user = userData ? JSON.parse(userData) : null;
  }

  // Initiate Google OAuth login
  initiateLogin() {
    const callbackUrl = API_CONFIG.OAUTH_CALLBACK_URL;
    const authUrl = `${this.baseURL.replace('/api/v1', '')}/auth/google?redirect_uri=${encodeURIComponent(callbackUrl)}`;
    window.location.href = authUrl;
  }

  // Handle OAuth callback
  handleCallback() {
    const hash = window.location.hash.substring(1);

    if (!hash) {
      throw new Error('No authentication data received');
    }

    const params = new URLSearchParams(hash);
    const encodedData = params.get('user_data');

    if (!encodedData) {
      throw new Error('Invalid callback data');
    }

    const userData = JSON.parse(atob(encodedData));
    this.storeAuthData(userData);

    // Clear hash from URL
    window.history.replaceState(null, '', window.location.pathname);

    return userData;
  }

  // Store authentication data
  storeAuthData(userData) {
    this.accessToken = userData.access_token;
    this.user = {
      id: userData.user_id,
      name: userData.user_name,
      avatar: userData.avatar_url
    };

    localStorage.setItem('access_token', userData.access_token);
    localStorage.setItem('refresh_token', userData.refresh_token);
    localStorage.setItem('access_token_expires_at', userData.access_token_expires_at);
    localStorage.setItem('refresh_token_expires_at', userData.refresh_token_expires_at);
    localStorage.setItem('user_data', JSON.stringify(this.user));
  }

  // Get current access token
  getAccessToken() {
    return this.accessToken || localStorage.getItem('access_token');
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Check if authenticated
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // Refresh access token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/token/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      this.clearAuth();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    // Update access token
    this.accessToken = data.access_token;
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('access_token_expires_at', data.access_token_expires_at);

    return data.access_token;
  }

  // Logout
  async logout() {
    const token = this.getAccessToken();

    if (token) {
      try {
        await fetch(`${this.baseURL}/auth/logout/google`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.clearAuth();
    window.location.href = '/login';
  }

  // Clear authentication data
  clearAuth() {
    this.accessToken = null;
    this.user = null;
    localStorage.clear();
  }

  // Setup automatic token refresh
  setupAutoRefresh() {
    setInterval(async () => {
      const expiresAt = localStorage.getItem('access_token_expires_at');

      if (!expiresAt) return;

      const timeUntilExpiry = new Date(expiresAt).getTime() - Date.now();

      // Refresh if expiring in less than 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        try {
          await this.refreshToken();
          console.log('Token refreshed automatically');
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }
    }, 60000); // Check every minute
  }
}

export default new AuthService();
```

---

### 2. API Client with Interceptors

Create an API client that automatically handles authentication and errors:

```javascript
// src/services/apiClient.js

import axios from 'axios';
import { API_CONFIG } from '../config/api';
import authService from './authService';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle no response (network error)
    if (!error.response) {
      return Promise.reject(new Error('Network error - please check your connection'));
    }

    // Handle 401 - token expired
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await authService.refreshToken();

        // Retry original request with new token
        const token = authService.getAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        authService.clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Extract error message
    const errorMessage = error.response.data?.error || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
```

---

### 3. API Service Methods

Create specific API service methods:

```javascript
// src/services/ieltsApi.js

import apiClient from './apiClient';

export const ieltsApi = {
  // ========== Topics & Questions ==========

  async getTopics() {
    const response = await apiClient.get('/topics');
    return response.data;
  },

  async getQuestions({ topicId, part, pageIndex = 1, pageSize = 20 }) {
    const params = new URLSearchParams({
      topic_id: topicId.toString(),
      page_index: pageIndex.toString(),
      page_size: pageSize.toString()
    });

    if (part) {
      params.append('part', part.toString());
    }

    const response = await apiClient.get(`/questions?${params}`);
    return response.data;
  },

  async getQuestionById(questionId) {
    const response = await apiClient.get(`/questions/${questionId}`);
    return response.data;
  },

  // ========== Practice & Tests ==========

  async getExamSets(skill = 'speaking') {
    const response = await apiClient.get(`/examsets?skill=${skill}`);
    return response.data;
  },

  async getExamSetById(examSetId) {
    const response = await apiClient.get(`/examsets/${examSetId}`);
    return response.data;
  },

  async startTest({ mode, examSetId, skill, part1, part2, part3, timeLimit }) {
    const response = await apiClient.post('/start_test', {
      mode,
      exam_set_id: examSetId,
      skill,
      part_1: part1,
      part_2: part2,
      part_3: part3,
      time_limit: timeLimit
    });
    return response.data;
  },

  // ========== Answers & Submissions ==========

  async submitAnswer(questionId, audioBlob) {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.wav');

    const response = await apiClient.post(
      `/questions/${questionId}/answers`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  async getUserAnswers(questionId) {
    const response = await apiClient.get(`/user_answers?question_id=${questionId}`);
    return response.data;
  },

  async getSimulationUploadURLs(testSessionId, questions) {
    const response = await apiClient.post('/get_simulation_upload_urls', {
      test_session_id: testSessionId,
      questions
    });
    return response.data;
  },

  async confirmSimulationSubmission(testSessionId, answers) {
    const response = await apiClient.post('/confirm_simulation_submission', {
      test_session_id: testSessionId,
      answers
    });
    return response.data;
  },

  // ========== Vocabulary ==========

  async getSavedWords() {
    const response = await apiClient.get('/users/words');
    return response.data;
  },

  async saveWord(word) {
    const response = await apiClient.post('/users/words', { word });
    return response.data;
  },

  async deleteWord(word) {
    await apiClient.delete(`/users/words/${encodeURIComponent(word)}`);
  },

  async lookupWord(word) {
    const response = await apiClient.get(`/vocabulary/search?q=${encodeURIComponent(word)}`);
    return response.data;
  }
};
```

---

### 4. React Context for Authentication

```javascript
// src/contexts/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user on mount
    const currentUser = authService.getUser();
    setUser(currentUser);
    setLoading(false);

    // Setup auto-refresh
    authService.setupAutoRefresh();
  }, []);

  const login = () => {
    authService.initiateLogin();
  };

  const handleCallback = () => {
    try {
      const userData = authService.handleCallback();
      setUser({
        id: userData.user_id,
        name: userData.user_name,
        avatar: userData.avatar_url
      });
      return true;
    } catch (error) {
      console.error('Callback error:', error);
      return false;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const isAuthenticated = authService.isAuthenticated();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        handleCallback
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
```

---

### 5. Protected Route Component

```javascript
// src/components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

---

### 6. Login Page

```javascript
// src/pages/LoginPage.jsx

import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="login-container">
      <h1>AI IELTS Practice</h1>
      <p>Sign in to start practicing</p>

      <button onClick={login} className="google-login-btn">
        <img src="/google-icon.svg" alt="Google" />
        Sign in with Google
      </button>
    </div>
  );
}
```

---

### 7. OAuth Callback Page

```javascript
// src/pages/AuthCallbackPage.jsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { handleCallback } = useAuth();

  useEffect(() => {
    const success = handleCallback();

    if (success) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate, handleCallback]);

  return (
    <div className="callback-container">
      <div className="spinner"></div>
      <p>Authenticating...</p>
    </div>
  );
}
```

---

## Common Use Cases

### Use Case 1: Display Topics

```javascript
// src/components/TopicList.jsx

import { useState, useEffect } from 'react';
import { ieltsApi } from '../services/ieltsApi';

export function TopicList() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTopics() {
      try {
        setLoading(true);
        const data = await ieltsApi.getTopics();
        setTopics(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTopics();
  }, []);

  if (loading) return <div>Loading topics...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="topic-list">
      {topics.map((topic) => (
        <div key={topic.id} className="topic-card">
          <h3>{topic.topic_name}</h3>
          <p>{topic.question_count} questions</p>

          <div className="tags">
            {topic.tags.map((tag) => (
              <span key={tag.id} className="tag">
                {tag.tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### Use Case 2: Record and Submit Audio

```javascript
// src/components/AudioRecorder.jsx

import { useState, useRef } from 'react';
import { ieltsApi } from '../services/ieltsApi';

export function AudioRecorder({ questionId, onSubmitted }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        chunksRef.current = [];

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Submit audio
        await submitAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitAudio = async (audioBlob) => {
    try {
      setIsSubmitting(true);
      const result = await ieltsApi.submitAnswer(questionId, audioBlob);
      onSubmitted(result);
    } catch (error) {
      console.error('Failed to submit audio:', error);
      alert('Failed to submit audio: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="audio-recorder">
      {!isRecording && !isSubmitting && (
        <button onClick={startRecording} className="record-btn">
          Start Recording
        </button>
      )}

      {isRecording && (
        <button onClick={stopRecording} className="stop-btn">
          Stop Recording
        </button>
      )}

      {isSubmitting && (
        <div className="submitting">
          <div className="spinner"></div>
          Uploading...
        </div>
      )}
    </div>
  );
}
```

---

### Use Case 3: Display Feedback

```javascript
// src/components/FeedbackDisplay.jsx

import { useState, useEffect } from 'react';
import { ieltsApi } from '../services/ieltsApi';

export function FeedbackDisplay({ questionId }) {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnswers() {
      try {
        const data = await ieltsApi.getUserAnswers(questionId);
        setAnswers(data);
      } catch (error) {
        console.error('Failed to load answers:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAnswers();
  }, [questionId]);

  if (loading) return <div>Loading feedback...</div>;

  return (
    <div className="feedback-list">
      {answers.map((answer) => (
        <div key={answer.id} className="feedback-card">
          <div className="header">
            <h3>Your Answer</h3>
            <span className="score">{answer.overall_score || 'Processing...'}</span>
          </div>

          <p className="transcription">{answer.answer_text}</p>

          {answer.overall_feedback && (
            <div className="overall-feedback">
              <h4>Overall Feedback</h4>
              <p>{answer.overall_feedback}</p>
            </div>
          )}

          {answer.feedback_details && (
            <div className="detailed-feedback">
              {Object.entries(answer.feedback_details).map(([criterion, details]) => (
                <div key={criterion} className="criterion">
                  <h4>
                    {criterion.charAt(0).toUpperCase() + criterion.slice(1)}
                    <span className="score">{details.score}</span>
                  </h4>

                  {details.strengths.length > 0 && (
                    <div className="strengths">
                      <strong>Strengths:</strong>
                      <ul>
                        {details.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {details.weaknesses.length > 0 && (
                    <div className="weaknesses">
                      <strong>Areas for Improvement:</strong>
                      <ul>
                        {details.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  {details.suggestions.length > 0 && (
                    <div className="suggestions">
                      <strong>Suggestions:</strong>
                      <ul>
                        {details.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <audio controls src={answer.presigned_url} />
        </div>
      ))}
    </div>
  );
}
```

---

### Use Case 4: Simulation Test Flow

```javascript
// src/components/SimulationTest.jsx

import { useState } from 'react';
import { ieltsApi } from '../services/ieltsApi';

export function SimulationTest({ examSetId }) {
  const [testSession, setTestSession] = useState(null);
  const [uploadUrls, setUploadUrls] = useState(null);
  const [recordings, setRecordings] = useState({});
  const [uploading, setUploading] = useState(false);

  // Step 1: Start test
  const startTest = async () => {
    try {
      const session = await ieltsApi.startTest({
        mode: 'simulation',
        examSetId,
        skill: 'speaking',
        part1: true,
        part2: true,
        part3: true,
        timeLimit: '12min'
      });

      setTestSession(session);

      // Get upload URLs
      const urls = await ieltsApi.getSimulationUploadURLs(session.test_session_id, {
        part_1: session.part_1,
        part_2: session.part_2,
        part_3: session.part_3
      });

      setUploadUrls(urls.upload_urls);
    } catch (error) {
      console.error('Failed to start test:', error);
      alert('Failed to start test');
    }
  };

  // Step 2: Record audio for each question
  const recordAnswer = async (part, questionId, audioBlob) => {
    setRecordings(prev => ({
      ...prev,
      [`${part}_${questionId}`]: audioBlob
    }));
  };

  // Step 3: Upload all recordings
  const submitTest = async () => {
    try {
      setUploading(true);

      const uploadedUrls = {
        part_1: {},
        part_2: {},
        part_3: {}
      };

      // Upload each recording
      for (const [key, blob] of Object.entries(recordings)) {
        const [part, questionId] = key.split('_');
        const partKey = `part_${part}`;
        const uploadUrl = uploadUrls[partKey][questionId];

        // Upload directly to R2
        await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': 'audio/wav'
          }
        });

        // Extract URL (remove query params)
        const audioUrl = uploadUrl.split('?')[0];
        uploadedUrls[partKey][questionId] = audioUrl;
      }

      // Confirm submission
      await ieltsApi.confirmSimulationSubmission(
        testSession.test_session_id,
        uploadedUrls
      );

      alert('Test submitted successfully!');
    } catch (error) {
      console.error('Failed to submit test:', error);
      alert('Failed to submit test');
    } finally {
      setUploading(false);
    }
  };

  if (!testSession) {
    return <button onClick={startTest}>Start Simulation Test</button>;
  }

  return (
    <div className="simulation-test">
      <h2>Simulation Test</h2>
      <p>Time Limit: {testSession.time_limit}</p>

      {/* Render questions and recording interface */}
      {/* ... */}

      <button onClick={submitTest} disabled={uploading}>
        {uploading ? 'Submitting...' : 'Submit Test'}
      </button>
    </div>
  );
}
```

---

## Real-time Features

### WebSocket Integration

```javascript
// src/services/websocketService.js

import { API_CONFIG } from '../config/api';
import authService from './authService';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
  }

  connect() {
    const token = authService.getAccessToken();
    const wsUrl = `${API_CONFIG.WS_URL}/ws/feedback?token=${token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.notifyListeners(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Subscribe to feedback for a specific answer
  subscribeFeedback(userAnswerId, callback) {
    this.listeners.set(userAnswerId, callback);
  }

  // Unsubscribe
  unsubscribeFeedback(userAnswerId) {
    this.listeners.delete(userAnswerId);
  }

  // Notify listeners
  notifyListeners(message) {
    const callback = this.listeners.get(message.user_answer_id);
    if (callback) {
      callback(message);
    }
  }
}

export default new WebSocketService();
```

**Usage in Component:**
```javascript
import { useEffect, useState } from 'react';
import websocketService from '../services/websocketService';

export function FeedbackListener({ userAnswerId }) {
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Subscribe to feedback
    websocketService.subscribeFeedback(userAnswerId, (message) => {
      if (message.status === 'completed') {
        setFeedback(message);
      }
    });

    return () => {
      websocketService.unsubscribeFeedback(userAnswerId);
    };
  }, [userAnswerId]);

  if (!feedback) {
    return <div>Waiting for feedback...</div>;
  }

  return <div>Score: {feedback.overall_score}</div>;
}
```

---

## File Upload Best Practices

### Progress Tracking

```javascript
function uploadWithProgress(file, url, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentage = (e.loaded / e.total) * 100;
        onProgress(percentage);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

// Usage
const [progress, setProgress] = useState(0);

await uploadWithProgress(audioBlob, presignedUrl, (percentage) => {
  setProgress(percentage);
});
```

---

## Production Checklist

### Environment Variables

Create a `.env` file:

```env
REACT_APP_API_URL=https://api.yourdomain.com/api/v1
REACT_APP_WS_URL=wss://api.yourdomain.com/api/v1
REACT_APP_OAUTH_CALLBACK=https://yourdomain.com/auth/callback
```

### Security

- [ ] Always use HTTPS in production
- [ ] Never log tokens in production
- [ ] Implement CSP headers
- [ ] Validate all user input
- [ ] Sanitize HTML content

### Performance

- [ ] Implement caching for static data
- [ ] Use React.memo for expensive components
- [ ] Lazy load routes
- [ ] Compress audio before upload
- [ ] Debounce search inputs

### Error Handling

- [ ] Global error boundary
- [ ] User-friendly error messages
- [ ] Error logging/monitoring
- [ ] Offline state detection
- [ ] Retry logic for failed requests

### Testing

- [ ] Unit tests for API services
- [ ] Integration tests for key flows
- [ ] E2E tests for critical paths
- [ ] Test error scenarios
- [ ] Test on different browsers

---

This completes the integration guide! You now have everything needed to integrate with the AI IELTS Backend.
