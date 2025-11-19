### Chat Completion API Documentation

This document provides detailed developer documentation for the **Chat Completion APIs**, which enable users to interact with AI models for general chat completion tasks using various modes — basic, advanced, streaming, and debug options.

---

#### Base URL

```
http://192.168.22.193:8001
```

---

#### Authentication

All requests must include an `x-api-key` header:

```
x-api-key: {{project_api_key}}
```

---

#### Content Type

```
Content-Type: application/json
```

---

### 1. POST Chat Completion - Basic

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/chat/completion
```

**Description:**
Generates AI responses for user prompts. Uses default system prompt from project configuration if not provided.

#### Request Body
```json
{
  "user_prompt": "What is the capital of France?"
}
```

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/chat/completion" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -d '{
    "user_prompt": "What is the capital of France?"
  }'
```

#### Example Response
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "output": {
      "summary": "The capital of France is Paris."
    },
    "tokens": {
      "input": 30,
      "output": 33,
      "total": 63
    }
  }
}
```

---

### 2. POST Chat Completion - Advanced

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/chat/completion
```

**Description:**
Provides more control over chat completion parameters, including system prompt, model, provider, temperature, and token limits.

#### Request Body
```json
{
  "user_prompt": "What is the capital of France?",
  "system_prompt": "You are a helpful assistant that provides accurate and concise answers.",
  "model": "gpt-4o",
  "provider": "openai",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/chat/completion" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -d '{
    "user_prompt": "What is the capital of France?",
    "system_prompt": "You are a helpful assistant that provides accurate and concise answers.",
    "model": "gpt-4o",
    "provider": "openai",
    "temperature": 0.7,
    "max_tokens": 1000
  }'
```

#### Example Response
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "output": {
      "summary": "The capital of France is Paris."
    },
    "tokens": {
      "input": 36,
      "output": 7,
      "total": 43
    }
  }
}
```

---

### 3. POST Chat Completion - Streaming Mode

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/chat/completion
```

**Description:**
Streams the AI response content progressively for real-time display. Ideal for chat-based UIs or interactive applications.

#### Request Body
```json
{
  "user_prompt": "What is the capital of France?",
  "system_prompt": "You are a helpful assistant that provides accurate and concise answers.",
  "model": "gpt-4o",
  "provider": "openai",
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": true
}
```

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/chat/completion" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -d '{
    "user_prompt": "What is the capital of France?",
    "system_prompt": "You are a helpful assistant that provides accurate and concise answers.",
    "model": "gpt-4o",
    "provider": "openai",
    "temperature": 0.7,
    "max_tokens": 1000,
    "stream": true
  }'
```

#### Example Streaming Response (SSE-style)
```
data: {"type":"start","input":{...}}

data: {"type":"content","content":"The"}

data: {"type":"content","content":" capital"}

data: {"type":"content","content":" of France"}

data: {"type":"content","content":" is Paris."}

data: {"type":"complete","success":true,"tokens":{...}}
```

---

### 4. POST Chat Completion - Debug Mode

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/chat/completion?debug=true
```

**Description:**
Enables detailed debug information in the response, including input data, configuration, and PII detection results.

#### Request Body
```json
{
  "user_prompt": "Explain quantum computing in simple terms",
  "system_prompt": "You are a helpful assistant that explains complex topics in simple terms.",
  "model": "gpt-4o",
  "provider": "openai",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/chat/completion?debug=true" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -d '{
    "user_prompt": "Explain quantum computing in simple terms",
    "system_prompt": "You are a helpful assistant that explains complex topics in simple terms.",
    "model": "gpt-4o",
    "provider": "openai",
    "temperature": 0.7,
    "max_tokens": 1000
  }'
```

#### Example Response
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "input": {
      "user_prompt": "Explain quantum computing in simple terms",
      "config": {
        "model": "gpt-4o",
        "provider": "openai",
        "system_prompt": "You are a helpful assistant that explains complex topics in simple terms.",
        "temperature": 0.7,
        "max_tokens": 1000
      }
    },
    "output": {
      "summary": "Quantum computing is a new way of processing information using the principles of quantum mechanics, which is the science that explains how the smallest particles in the universe behave. \n\nTraditional computers use bits as the smallest unit of data, which can either be a 0 or a 1. Quantum computers use quantum bits, or qubits, which can be both 0 and 1 at the same time, thanks to a property called superposition. This allows quantum computers to process a vast amount of possibilities simultaneously.\n\nAnother key concept is entanglement, which means qubits can be linked together in a way that the state of one qubit can depend on the state of another, no matter how far apart they are. This can make calculations much more powerful and faster for specific tasks.\n\nQuantum computing is still in development, but it holds promise for solving complex problems that are currently impossible or very time-consuming for traditional computers, such as simulating molecules for drug discovery or optimizing complex systems."
    },
    "tokens": {
      "input": 36,
      "output": 195,
      "total": 231
    },
    "pii_detection": {
      "user_prompt": {
        "total_entities": 0,
        "entity_types": {},
        "detected_entities": [],
        "original_text": "Explain quantum computing in simple terms"
      },
      "system_prompt": {
        "total_entities": 0,
        "entity_types": {},
        "detected_entities": [],
        "original_text": "You are a helpful assistant that explains complex topics in simple terms."
      }
    }
  }
}
```

---

### 5. POST Chat Completion - Debug Mode Streaming

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/chat/completion?debug=true
```

**Description:**
Streams debug-enhanced chat responses. Includes system initialization data, input metadata, and chunked response content.

#### Request Body
```json
{
  "user_prompt": "Write a short story about artificial intelligence",
  "system_prompt": "You are a creative writer that writes engaging short stories.",
  "model": "gpt-4o",
  "provider": "openai",
  "temperature": 0.8,
  "max_tokens": 1500,
  "stream": true
}
```

#### Example Streaming Response
```
data: {"type":"start","input":{...},"config":{...}}

data: {"type":"content","content":"Once"}

data: {"type":"content","content":" upon"}

data: {"type":"content","content":" a time"}

data: {"type":"complete","success":true,"tokens":{...},"pii_detection":{...}}
```

---

### Error Responses

| Status | Description | Example |
|--------|-------------|---------|
| 400 | Invalid input | `{ "success": false, "status_code": 400, "errors": {}, "message": "Invalid request parameters" }` |
| 401 | Unauthorized / Missing API key | `{ "success": false, "status_code": 401, "errors": {}, "message": "Unauthorized" }` |
| 500 | Internal server error | `{ "success": false, "status_code": 500, "errors": {}, "message": "Unexpected server failure" }` |

---

#### Notes
- The chat completion service may have rate limits based on your API key.
- **System Prompt Priority**: Payload → Database Config → Empty
- For **streaming** requests, ensure your client supports **Server-Sent Events (SSE)** or WebSocket streaming.
- Use `debug=true` for troubleshooting or inspecting full request/response payloads.
- Model and provider are optional - defaults from project configuration will be used if not specified.

---

**Author:** API Platform Team  
**Version:** 1.0.0  
**Last Updated:** 2025-01-13

