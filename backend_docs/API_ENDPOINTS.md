# API Endpoints Reference

Complete reference for all backend API endpoints.

## Base URL

```
http://localhost:8301/api/v1
```

## Table of Contents

- [Authentication Endpoints](#authentication-endpoints)
- [Topic & Question Endpoints](#topic--question-endpoints)
- [Practice & Test Endpoints](#practice--test-endpoints)
- [User Answer Endpoints](#user-answer-endpoints)
- [Vocabulary Endpoints](#vocabulary-endpoints)
- [WebSocket Endpoints](#websocket-endpoints)
- [Utility Endpoints](#utility-endpoints)

---

## Authentication Endpoints

### 1. OAuth Login (Google)

Initiates Google OAuth login flow.

```http
GET /auth/google?redirect_uri={frontend_url}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| redirect_uri | string | Yes | Frontend URL to redirect after successful auth |

**Example:**
```javascript
window.location.href = 'http://localhost:8301/auth/google?redirect_uri=http://localhost:3000/auth/callback';
```

**Flow:**
1. User clicks login button
2. Frontend redirects to `/auth/google?redirect_uri=...`
3. User authenticates with Google
4. Backend redirects to callback with encoded user data in URL

---

### 2. OAuth Callback

Handles OAuth callback from Google (automatically called by Google).

```http
GET /auth/google/callback
```

**Returns:**
Redirects to your `redirect_uri` with user data encoded in URL fragment:

```
http://localhost:3000/auth/callback#user_data=<base64_encoded_json>
```

**Decode the user data:**
```javascript
// In your callback component
const hash = window.location.hash.substring(1); // Remove #
const params = new URLSearchParams(hash);
const encodedData = params.get('user_data');
const userData = JSON.parse(atob(encodedData));

// userData contains:
{
  "session_id": "uuid",
  "user_id": "google_user_id",
  "user_name": "John Doe",
  "avatar_url": "https://...",
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "access_token_expires_at": "2025-11-12T15:30:00Z",
  "refresh_token_expires_at": "2025-11-19T15:30:00Z"
}
```

---

### 3. Renew Access Token

Refreshes an expired access token using a refresh token.

```http
POST /token/renew
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "access_token": "new_access_token",
  "access_token_expires_at": "2025-11-12T16:00:00Z"
}
```

**Example:**
```javascript
const response = await fetch('http://localhost:8301/api/v1/token/renew', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refresh_token: storedRefreshToken
  })
});

const { access_token, access_token_expires_at } = await response.json();
```

---

### 4. Logout

Logs out the user and invalidates the session.

```http
GET /auth/logout/google
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `200 OK`

---

## Topic & Question Endpoints

### 1. List Topics with Tags

Get all speaking topics with their tags and question counts.

```http
GET /topics
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "skill": "speaking",
    "topic_name": "Technology",
    "tags": [
      {
        "id": 1,
        "tag": "smartphones",
        "popularity_score": 85
      },
      {
        "id": 2,
        "tag": "social media",
        "popularity_score": 90
      }
    ],
    "question_count": 45
  }
]
```

**Example:**
```javascript
const response = await fetch('http://localhost:8301/api/v1/topics', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const topics = await response.json();
```

---

### 2. List Questions by Topic

Get paginated questions for a specific topic tag.

```http
GET /questions?topic_id={topic_id}&part={part}&sort_by={field}&page_index={page}&page_size={size}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| topic_id | int32 | Yes | Topic tag ID |
| part | int32 | No | IELTS part (1, 2, or 3) |
| sort_by | string | No | Sort field (e.g., "popularity_score") |
| page_index | int32 | No | Page number (default: 1) |
| page_size | int32 | No | Items per page (default: 10) |

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `200 OK`
```json
[
  {
    "id": 101,
    "part": 1,
    "question_text": "Do you use a smartphone?",
    "topic_id": 1,
    "topic_name": "Technology",
    "tag_id": 1,
    "tag_name": "smartphones",
    "popularity_score": 85,
    "ai_generated": false
  }
]
```

**Example:**
```javascript
const params = new URLSearchParams({
  topic_id: '1',
  part: '1',
  page_index: '1',
  page_size: '20'
});

const response = await fetch(`http://localhost:8301/api/v1/questions?${params}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const questions = await response.json();
```

---

### 3. Get Question Details

Get a single question with topic and tag information.

```http
GET /questions/{question_id}
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `200 OK`
```json
{
  "question_id": 101,
  "part": 1,
  "question_text": "Do you use a smartphone?",
  "topic_tag_id": 1,
  "topic_id": 1,
  "topic_name": "Technology",
  "tag_name": "smartphones"
}
```

---

## Practice & Test Endpoints

### 1. List Exam Sets by Skill

Get available exam sets for a specific skill.

```http
GET /examsets?skill={skill}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| skill | string | Yes | "speaking", "listening", "reading", or "writing" |

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Speaking Test Set #1",
    "skill": "speaking"
  }
]
```

---

### 2. Get Exam Set Details

Get complete exam set with all question IDs.

```http
GET /examsets/{exam_set_id}
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Speaking Test Set #1",
  "skill": "speaking",
  "part1_ids": [1, 2, 3, 4],
  "part2_ids": [5, 6],
  "part3_ids": [7, 8, 9],
  "is_active": true
}
```

---

### 3. Start a Test Session

Start a practice or simulation test.

```http
POST /start_test
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "mode": "practice",
  "exam_set_id": 1,
  "skill": "speaking",
  "part_1": true,
  "part_2": false,
  "part_3": true,
  "time_limit": "12min"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| mode | string | Yes | "practice" or "simulation" |
| exam_set_id | int32 | Yes | Exam set ID |
| skill | string | Yes | "speaking", "listening", etc. |
| part_1 | bool | Yes | Include part 1? |
| part_2 | bool | Yes | Include part 2? |
| part_3 | bool | Yes | Include part 3? |
| time_limit | string | No | "0min", "12min", "14min" |

**Response:** `200 OK`
```json
{
  "test_session_id": "uuid-here",
  "part_1": [1, 2, 3, 4],
  "part_2": [5, 6],
  "part_3": [7, 8, 9],
  "start_time": "2025-11-12T10:00:00Z",
  "end_time": "2025-11-12T10:12:00Z",
  "time_limit": "12min"
}
```

**Example:**
```javascript
const response = await fetch('http://localhost:8301/api/v1/start_test', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    mode: 'practice',
    exam_set_id: 1,
    skill: 'speaking',
    part_1: true,
    part_2: true,
    part_3: true,
    time_limit: '12min'
  })
});

const testSession = await response.json();
```

---

### 4. Get Simulation Upload URLs

Generate presigned URLs for uploading audio files in simulation mode.

```http
POST /get_simulation_upload_urls
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "test_session_id": "uuid-here",
  "questions": {
    "part_1": [1, 2, 3],
    "part_2": [4, 5],
    "part_3": [6, 7]
  }
}
```

**Response:** `200 OK`
```json
{
  "upload_urls": {
    "part_1": {
      "1": "https://r2.cloudflare.com/presigned-url-1",
      "2": "https://r2.cloudflare.com/presigned-url-2",
      "3": "https://r2.cloudflare.com/presigned-url-3"
    },
    "part_2": {
      "4": "https://r2.cloudflare.com/presigned-url-4",
      "5": "https://r2.cloudflare.com/presigned-url-5"
    },
    "part_3": {
      "6": "https://r2.cloudflare.com/presigned-url-6",
      "7": "https://r2.cloudflare.com/presigned-url-7"
    }
  }
}
```

**Usage Flow:**
1. Request presigned URLs
2. Upload audio files directly to R2 using presigned URLs
3. Confirm submission with `/confirm_simulation_submission`

**Example Upload:**
```javascript
// Get presigned URLs
const urlResponse = await fetch('http://localhost:8301/api/v1/get_simulation_upload_urls', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    test_session_id: sessionId,
    questions: {
      part_1: [1, 2, 3]
    }
  })
});

const { upload_urls } = await urlResponse.json();

// Upload audio directly to R2
const audioBlob = new Blob([audioData], { type: 'audio/wav' });
await fetch(upload_urls.part_1['1'], {
  method: 'PUT',
  body: audioBlob,
  headers: {
    'Content-Type': 'audio/wav'
  }
});
```

---

### 5. Confirm Simulation Submission

Confirm that all audio files have been uploaded for a simulation test.

```http
POST /confirm_simulation_submission
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "test_session_id": "uuid-here",
  "answers": {
    "part_1": {
      "1": "https://r2.cloudflare.com/path-to-audio-1",
      "2": "https://r2.cloudflare.com/path-to-audio-2"
    },
    "part_2": {
      "4": "https://r2.cloudflare.com/path-to-audio-4"
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "Submission confirmed. Processing started."
}
```

---

## User Answer Endpoints

### 1. Submit Answer (Practice Mode)

Submit an audio answer for a question in practice mode.

```http
POST /questions/{question_id}/answers
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| audio_file | file | Yes | Audio file (WAV, MP3, etc.) |

**Response:** `201 Created`
```json
{
  "user_answer_id": 1234,
  "question_id": 101,
  "audio_url": "https://r2.cloudflare.com/...",
  "status": "processing"
}
```

**Example:**
```javascript
const formData = new FormData();
formData.append('audio_file', audioBlob, 'recording.wav');

const response = await fetch(`http://localhost:8301/api/v1/questions/${questionId}/answers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const result = await response.json();
```

**Processing Flow:**
1. Audio uploaded to R2 storage
2. Background job created for transcription
3. Transcription processed asynchronously
4. AI feedback generated
5. Results available via WebSocket or polling `/user_answers`

---

### 2. Get User Answers with Evaluations

Get all user answers with AI evaluations for specific questions.

```http
GET /user_answers?question_id={id}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| question_id | int32 | Yes | Question ID to get answers for |

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `200 OK`
```json
[
  {
    "id": 1234,
    "question_id": 101,
    "part": 1,
    "question_text": "Do you use a smartphone?",
    "answer_text": "Yes, I use a smartphone every day...",
    "presigned_url": "https://r2.cloudflare.com/download-url",
    "submitted_at": "2025-11-12T10:30:00Z",
    "overall_score": 7.5,
    "overall_feedback": "Good response with clear pronunciation...",
    "feedback_details": {
      "fluency": {
        "score": 7.0,
        "strengths": ["Natural flow", "Good pace"],
        "weaknesses": ["Some hesitation"],
        "suggestions": ["Practice speaking without pauses"]
      },
      "vocabulary": {
        "score": 8.0,
        "strengths": ["Good range of vocabulary"],
        "weaknesses": [],
        "suggestions": ["Use more advanced words"]
      }
    }
  }
]
```

---

## Vocabulary Endpoints

### 1. Get User's Saved Words

Retrieve all words saved by the user.

```http
GET /users/words
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `200 OK`
```json
[
  {
    "word": "sophisticated",
    "created_at": "2025-11-10T10:00:00Z"
  },
  {
    "word": "eloquent",
    "created_at": "2025-11-11T14:30:00Z"
  }
]
```

---

### 2. Save a Word

Add a word to user's vocabulary list.

```http
POST /users/words
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "word": "sophisticated"
}
```

**Response:** `201 Created`
```json
{
  "word": "sophisticated",
  "created_at": "2025-11-12T10:00:00Z"
}
```

---

### 3. Delete a Saved Word

Remove a word from user's vocabulary list.

```http
DELETE /users/words/{word}
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `204 No Content`

---

### 4. Dictionary Lookup

Look up word definitions (public endpoint, no auth required).

```http
GET /vocabulary/search?q={word}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Word to look up |

**Response:** `200 OK`
```json
{
  "word": "sophisticated",
  "phonetic": "/səˈfɪstɪkeɪtɪd/",
  "meanings": [
    {
      "partOfSpeech": "adjective",
      "definitions": [
        {
          "definition": "Having or showing a great deal of worldly experience",
          "example": "A sophisticated lifestyle"
        }
      ]
    }
  ]
}
```

---

## WebSocket Endpoints

### 1. Real-time Feedback WebSocket

Connect to receive real-time AI feedback updates.

```http
GET /ws/feedback
```

**Headers:**
```
Authorization: Bearer {access_token}
Upgrade: websocket
Connection: Upgrade
```

**Example:**
```javascript
const ws = new WebSocket(`ws://localhost:8301/api/v1/ws/feedback?token=${accessToken}`);

ws.onmessage = (event) => {
  const feedback = JSON.parse(event.data);
  console.log('Received feedback:', feedback);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

**Message Format:**
```json
{
  "user_answer_id": 1234,
  "status": "completed",
  "overall_score": 7.5,
  "overall_feedback": "Good response...",
  "feedback_details": { ... }
}
```

---

## Utility Endpoints

### 1. Health Check

Check if the server is running.

```http
GET /ping
```

**Response:** `200 OK`
```json
{
  "message": "pong"
}
```

---

## Rate Limiting

Currently, there are no rate limits enforced. However, it's recommended to:
- Avoid excessive requests in short periods
- Use WebSocket for real-time updates instead of polling
- Cache responses when appropriate

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page_index`: Page number (starts at 1)
- `page_size`: Items per page (default: 10, max: 100)

**Example:**
```
GET /questions?topic_id=1&page_index=2&page_size=20
```

---

## Status Codes Summary

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 404 | Not Found |
| 409 | Conflict (business logic error) |
| 500 | Internal Server Error |

See [Error Handling](./ERROR_HANDLING.md) for detailed error formats.
