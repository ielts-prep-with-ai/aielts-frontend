# AI IELTS Backend - Frontend Integration Documentation

Welcome to the AI IELTS Backend API documentation. This guide will help frontend developers understand and integrate with the backend services.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Documentation Index](#documentation-index)
4. [Technology Stack](#technology-stack)
5. [Base URL](#base-url)

## Overview

The AI IELTS Backend is a Go-based REST API that provides:
- IELTS speaking practice with AI-powered feedback
- Question bank management with topics and tags
- Simulation tests and practice modes
- Speech-to-text transcription with audio storage
- Vocabulary management
- Real-time feedback via WebSocket

## Quick Start

### 1. Authentication
All protected endpoints require JWT authentication via Bearer token:

```javascript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

### 2. Get Topics
```javascript
const response = await fetch('http://localhost:8301/api/v1/topics', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const topics = await response.json();
```

### 3. Submit an Answer
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
```

## Documentation Index

- **[API Endpoints](./API_ENDPOINTS.md)** - Complete API reference with all endpoints, request/response formats
- **[Authentication](./AUTHENTICATION.md)** - OAuth flow, JWT tokens, session management
- **[Data Models](./DATA_MODELS.md)** - Request and response schemas
- **[Error Handling](./ERROR_HANDLING.md)** - Error codes, formats, and troubleshooting
- **[Integration Guide](./INTEGRATION_GUIDE.md)** - Step-by-step integration examples

## Technology Stack

### Backend
- **Framework**: Gin Web Framework (Go)
- **Database**: PostgreSQL 15
- **Cache**: Redis + Ristretto (in-memory)
- **Authentication**: Google OAuth 2.0 + JWT
- **Storage**: Cloudflare R2 (S3-compatible)
- **AI/ML**: OpenAI API for feedback generation
- **Background Jobs**: Asynq (Redis-backed queue)
- **WebSocket**: Gorilla WebSocket

### Key Features
- RESTful API design
- JWT-based authentication
- Presigned URLs for direct audio uploads
- Asynchronous audio processing
- Real-time feedback delivery
- CORS-enabled for cross-origin requests

## Base URL

### Development
```
http://localhost:8301/api/v1
```

### Production
```
https://your-production-domain.com/api/v1
```

## CORS Configuration

The API supports cross-origin requests with the following configuration:
- **Allowed Origins**: `*` (all origins)
- **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Allowed Headers**: `Origin`, `Content-Type`, `Authorization`, `Idempotency`
- **Credentials**: Supported

## Health Check

Test if the backend is running:

```bash
curl http://localhost:8301/api/v1/ping
```

Expected response: `200 OK`

## Support

For questions or issues:
- Review the detailed documentation in this folder
- Check the [Integration Guide](./INTEGRATION_GUIDE.md) for common patterns
- Refer to [Error Handling](./ERROR_HANDLING.md) for troubleshooting

## Next Steps

1. Read the [Authentication Guide](./AUTHENTICATION.md) to implement user login
2. Review [API Endpoints](./API_ENDPOINTS.md) to understand available endpoints
3. Check [Data Models](./DATA_MODELS.md) for request/response structures
4. Follow the [Integration Guide](./INTEGRATION_GUIDE.md) for complete examples
