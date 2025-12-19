### Chat API Documentation

This document provides detailed developer documentation for the **Chat APIs**, which enable users to interact with a RAG-powered chatbot that uses knowledge base context for intelligent responses.

---

#### Base URL

```
https://aigateway.shiprocket.in
```

---

#### Authentication

All requests must include the following headers:

```
x-api-key: {{project_api_key}}
X-User-Id: {{user_id}}
```

---

#### Content Type

```
Content-Type: application/json
```

---

### 1. POST Chat - Non-Streaming

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/chat
```

**Description:**
Sends a chat query and receives a complete response. The response is always returned in SSE format, but contains the full response at once when `stream: false`.

#### Request Body
```json
{
  "query": "What is artificial intelligence?",
  "model": "gpt-4o",
  "provider": "openai",
  "rag_limit": 5,
  "rag_threshold": 0.7
}
```

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -H "X-User-Id: {{user_id}}" \
  -d '{
    "query": "What is artificial intelligence?",
    "model": "gpt-4o",
    "provider": "openai",
    "rag_limit": 5,
    "rag_threshold": 0.7
  }'
```

#### Example Response (SSE Format)
```
data: {"type":"start","input":{...}}

data: {"type":"complete","success":true,"data":{"input":{...},"output":{"response":"Artificial Intelligence (AI) is...","rag_context":[...]},"tokens":{...}}}
```

---

### 2. POST Chat - Streaming

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/chat
```

**Description:**
Streams the chat response progressively for real-time display. Ideal for chat-based UIs where users see responses as they're generated.

#### Request Body
```json
{
  "query": "What is artificial intelligence?",
  "model": "gpt-4o",
  "provider": "openai",
  "stream": true,
  "rag_limit": 5,
  "rag_threshold": 0.7
}
```

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -H "X-User-Id: {{user_id}}" \
  -d '{
    "query": "What is artificial intelligence?",
    "model": "gpt-4o",
    "provider": "openai",
    "stream": true,
    "rag_limit": 5,
    "rag_threshold": 0.7
  }'
```

#### Example Streaming Response (SSE-style)
```
data: {"type":"start","input":{...}}

data: {"type":"content","content":"Artificial"}

data: {"type":"content","content":" Intelligence"}

data: {"type":"content","content":" (AI) is"}

data: {"type":"content","content":" the simulation"}

data: {"type":"complete","success":true,"data":{...}}
```

---

### 3. POST Chat - With Session Context

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/chat
```

**Description:**
Sends a chat query with session ID to maintain conversation context across multiple messages.

#### Request Body
```json
{
  "query": "Tell me more about that",
  "session_id": "session_12345",
  "model": "gpt-4o",
  "provider": "openai",
  "rag_limit": 5,
  "rag_threshold": 0.7
}
```

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -H "X-User-Id: {{user_id}}" \
  -d '{
    "query": "Tell me more about that",
    "session_id": "session_12345",
    "model": "gpt-4o",
    "provider": "openai",
    "rag_limit": 5,
    "rag_threshold": 0.7
  }'
```

---

### 4. GET Chat Sessions

**Endpoint:**
```
GET http://192.168.22.193:8001/api/v1/chat/sessions
```

**Description:**
Retrieves all chat sessions for a user with pagination support. Sessions are ordered by newest first.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | No | Optional project ID to filter sessions |
| `page` | integer | No | Page number (starts from 1, default: 1) |
| `limit` | integer | No | Number of sessions per page (max 100, default: 20) |

#### Example cURL
```bash
curl -X GET "http://192.168.22.193:8001/api/v1/chat/sessions?page=1&limit=20" \
  -H "X-User-Id: {{user_id}}"
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "session_id": "session_12345",
        "user_id": "user_123",
        "project_id": "project_456",
        "created_at": "2025-01-13T10:00:00Z",
        "updated_at": "2025-01-13T10:30:00Z",
        "message_count": 5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_count": 10,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

---

### 5. GET Chat Messages

**Endpoint:**
```
GET http://192.168.22.193:8001/api/v1/chat/chats
```

**Description:**
Retrieves all chat messages for a specific session with pagination support. Messages are ordered by newest first.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | Session ID to get chats for |
| `page` | integer | No | Page number (starts from 1, default: 1) |
| `limit` | integer | No | Number of messages per page (max 100, default: 50) |

#### Example cURL
```bash
curl -X GET "http://192.168.22.193:8001/api/v1/chat/chats?session_id=session_12345&page=1&limit=50" \
  -H "X-User-Id: {{user_id}}"
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "message_id": "msg_123",
        "session_id": "session_12345",
        "query": "What is artificial intelligence?",
        "response": "Artificial Intelligence (AI) is...",
        "created_at": "2025-01-13T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total_count": 5,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

---

### Request Parameters

#### POST /api/v1/chat

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | User's chat query/question |
| `session_id` | string | No | Session ID for conversation context |
| `model` | string | No | Model to use (default: from project config) |
| `provider` | string | No | Provider to use (default: from project config) |
| `stream` | boolean | No | Enable streaming (default: false) |
| `rag_limit` | integer | No | Maximum number of RAG context chunks (default: 5) |
| `rag_threshold` | float | No | Minimum similarity score for RAG context (default: 0.7) |

---

### Response Format

#### Success Response (Non-Streaming)
```json
{
  "success": true,
  "data": {
    "input": {
      "query": "What is artificial intelligence?",
      "config": {
        "model": "gpt-4o",
        "provider": "openai",
        "rag_limit": 5,
        "rag_threshold": 0.7
      }
    },
    "output": {
      "response": "Artificial Intelligence (AI) is...",
      "rag_context": [
        {
          "content": "AI is the simulation of human intelligence...",
          "score": 0.85
        }
      ]
    },
    "tokens": {
      "input": 100,
      "output": 50,
      "total": 150
    }
  }
}
```

#### Streaming Response (SSE)
```
data: {"type":"start","input":{...}}

data: {"type":"content","content":"chunk1"}

data: {"type":"content","content":"chunk2"}

data: {"type":"complete","success":true,"data":{...}}
```

---

### Error Responses

| Status | Description | Example |
|--------|-------------|---------|
| 400 | Invalid input | `{ "error": "query field is required" }` |
| 401 | Unauthorized / Missing API key | `{ "error": "Unauthorized" }` |
| 404 | Service not configured | `{ "error": "Chatbot service not configured for this project" }` |
| 500 | Internal server error | `{ "error": "Unexpected server failure" }` |

---

#### Notes
- The chat service may have rate limits based on your API key.
- **All responses are returned in SSE format**, even for non-streaming requests.
- The `X-User-Id` header is required for all chat requests to track user sessions.
- RAG (Retrieval-Augmented Generation) uses your project's knowledge base to provide context-aware responses.
- `rag_limit` controls how many relevant context chunks are included (default: 5).
- `rag_threshold` controls the minimum similarity score for context inclusion (default: 0.7, range: 0.0-1.0).
- Model and provider are optional - defaults from project configuration will be used if not specified.
- Sessions are automatically created if `session_id` is not provided.

---

**Author:** API Platform Team  
**Version:** 1.0.0  
**Last Updated:** 2025-01-13

