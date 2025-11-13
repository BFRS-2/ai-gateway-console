### Summarization API Documentation

This document provides detailed developer documentation for the **Summarization APIs**, which enable users to summarize text using various modes — basic, advanced, streaming, and debug options.

---


#### Base URL

```
{{baseUrl}}
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

### 1. POST Summarize Text - Basic

**Endpoint:**
```
POST {{baseUrl}}/api/v1/summarization
```

**Description:**
Generates a concise summary for the provided text input based on the specified `word_count`.

#### Request Body
```json
{
  "user_prompt": "This is a long text that needs to be summarized. It contains multiple sentences and paragraphs that should be condensed into a shorter version while maintaining the key information and meaning.",
  "word_count": 150
}
```

#### Example cURL
```bash
curl -X POST "{{baseUrl}}/api/v1/summarization" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -d '{
    "user_prompt": "This is a long text that needs to be summarized.",
    "word_count": 150
  }'
```

#### Example Response
```json
{
  "summary": "This is a concise summary capturing the essence of the input text.",
  "tokens_used": 120,
  "model": "default"
}
```

---

### 2. POST Summarize Text - Advanced

**Endpoint:**
```
POST {{baseUrl}}/api/v1/summarization
```

**Description:**
Provides more control over summarization parameters, including model, provider, temperature, and token limits.

#### Request Body
```json
{
  "user_prompt": "This is a long text that needs to be summarized.",
  "model": "gpt-4o",
  "provider": "openai",
  "temperature": 0.7,
  "max_tokens": 1000,
  "word_count": 200
}
```

#### Example cURL
```bash
curl -X POST "{{baseUrl}}/api/v1/summarization" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -d '{
    "user_prompt": "This is a long text that needs to be summarized.",
    "model": "gpt-4o",
    "provider": "openai",
    "temperature": 0.7,
    "max_tokens": 1000,
    "word_count": 200
  }'
```

#### Example Response
```json
{
  "summary": "This is an advanced summary of your text.",
  "tokens_used": 180,
  "model": "gpt-4o",
  "provider": "openai",
  "temperature": 0.7
}
```

---

### 3. POST Summarize Text - Streaming Mode

**Endpoint:**
```
POST {{baseUrl}}/api/v1/summarization
```

**Description:**
Streams the summary content progressively for real-time display. Ideal for chat-based UIs or dashboards.

#### Request Body
```json
{
  "user_prompt": "This is a long text that needs to be summarized.",
  "model": "gpt-4o",
  "provider": "openai",
  "temperature": 0.7,
  "max_tokens": 1000,
  "word_count": 200,
  "stream": true
}
```

#### Example cURL
```bash
curl -X POST "{{baseUrl}}/api/v1/summarization" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -d '{
    "user_prompt": "This is a long text that needs to be summarized.",
    "model": "gpt-4o",
    "provider": "openai",
    "temperature": 0.7,
    "max_tokens": 1000,
    "word_count": 200,
    "stream": true
  }'
```

#### Example Streaming Response (SSE-style)
```
data: {"status":"started"}
data: {"chunk":"The input text discusses the need..."}
data: {"chunk":"...maintaining clarity and brevity."}
data: {"status":"completed","summary":"The input text outlines how to summarize long content concisely."}
```

---

### 4. POST Summarize Text - Debug Mode

**Endpoint:**
```
POST {{baseUrl}}/api/v1/summarization?debug=true
```

**Description:**
Enables detailed debug information in the response, including input data, configuration, and PII detection results.

#### Request Body
```json
{
  "user_prompt": "This is a long text that needs to be summarized.",
  "model": "gpt-4o",
  "provider": "openai",
  "temperature": 0.7,
  "max_tokens": 1000,
  "word_count": 200
}
```

#### Example cURL
```bash
curl -X POST "{{baseUrl}}/api/v1/summarization?debug=true" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -d '{
    "user_prompt": "This is a long text that needs to be summarized.",
    "model": "gpt-4o",
    "provider": "openai",
    "temperature": 0.7,
    "max_tokens": 1000,
    "word_count": 200
  }'
```

#### Example Response
```json
{
  "summary": "This is a debug-enabled summary.",
  "tokens_used": 200,
  "model": "gpt-4o",
  "provider": "openai",
  "config": {
    "temperature": 0.7,
    "max_tokens": 1000,
    "debug": true
  },
  "pii_detected": false,
  "input_excerpt": "This is a long text that needs to be summarized."
}
```

---

### 5. POST Summarize Text - Debug Mode Streaming

**Endpoint:**
```
POST {{baseUrl}}/api/v1/summarization?debug=true
```

**Description:**
Streams debug-enhanced summaries. Includes system initialization data, input metadata, and chunked summary responses.

#### Request Body
```json
{
  "user_prompt": "This is a long text that needs to be summarized.",
  "model": "gpt-4o",
  "provider": "openai",
  "temperature": 0.7,
  "max_tokens": 1000,
  "word_count": 200,
  "stream": true
}
```

#### Example Streaming Response
```
data: {"status":"init","config":{"model":"gpt-4o","provider":"openai"}}
data: {"input":"This is a long text that needs to be summarized."}
data: {"chunk":"The passage describes how..."}
data: {"chunk":"...to condense text efficiently."}
data: {"status":"completed","summary":"Condensed summary with debug trace."}
```

---

### Error Responses

| Status | Description | Example |
|--------|--------------|----------|
| 400 | Invalid input | `{ "error": "Invalid word_count parameter" }` |
| 401 | Unauthorized / Missing API key | `{ "error": "Unauthorized" }` |
| 500 | Internal server error | `{ "error": "Unexpected server failure" }` |

---

#### Notes
- The summarization service may have rate limits based on your API key.
- For **streaming** requests, ensure your client supports **Server-Sent Events (SSE)** or WebSocket streaming.
- Use `debug=true` for troubleshooting or inspecting full request/response payloads.

---

**Author:** API Platform Team  
**Version:** 1.0.0  
**Last Updated:** 2025-11-13
