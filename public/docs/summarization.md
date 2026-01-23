### Summarization API Documentation

This document provides detailed developer documentation for the **Summarization APIs**, which enable users to summarize text using various modes — basic, advanced, streaming, and debug options.

---


#### Base URL

```
https://aigateway.shiprocket.in
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
POST https://aigateway.shiprocket.in/api/v1/summarization
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
curl -X POST "https://aigateway.shiprocket.in/api/v1/summarization" \
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
  "success": true,
  "status_code": 200,
  "data": {
    "output": {
      "summary": "This is a concise summary capturing the essence of the input text."
    },
    "tokens": {
      "input": 257,
      "output": 49,
      "total": 306
    }
  }
}
```

---

### 2. POST Summarize Text - Advanced

**Endpoint:**
```
POST https://aigateway.shiprocket.in/api/v1/summarization
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
curl -X POST "https://aigateway.shiprocket.in/api/v1/summarization" \
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
  "success": true,
  "status_code": 200,
  "data": {
    "output": {
      "summary": "This is an advanced summary of your text."
    },
    "tokens": {
      "input": 257,
      "output": 49,
      "total": 306
    }
  }
}
```

---

### 3. POST Summarize Text - Streaming Mode

**Endpoint:**
```
POST https://aigateway.shiprocket.in/api/v1/summarization
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
curl -X POST "https://aigateway.shiprocket.in/api/v1/summarization" \
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
POST https://aigateway.shiprocket.in/api/v1/summarization?debug=true
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
curl -X POST "https://aigateway.shiprocket.in/api/v1/summarization?debug=true" \
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
  "success": true,
  "status_code": 200,
  "data": {
    "input": {
      "user_prompt": "This is a long text that needs to be summarized. It contains multiple sentences and paragraphs that should be condensed into a shorter version while maintaining the key information and meaning.",
      "config": {
        "model": "gpt-4o",
        "provider": "openai",
        "system_prompt": "\nYou are an advanced summarization assistant trained to generate clear, contextually accurate, and concise summaries.\n\nYour goal is to distill the most important information from any provided text — whether it's an article, report, transcript, conversation, or document. \nFocus on:\n- Capturing the main ideas, facts, and intent.\n- Preserving the original meaning and tone.\n- Removing redundancy, filler, and irrelevant details.\n- Maintaining logical flow and readability.\n\nAdapt the summarization style and length based on the user's request (e.g., short summary, detailed summary, key bullet points, or executive brief).\n\nAlways ensure your summary stays within the specified word count limit (200 words) while maintaining quality and completeness.\n\nIf no specific format or length is mentioned, provide a balanced, paragraph-style summary that captures all key points within the word limit.\nAlso do not mention word count in the final summary\n",
        "temperature": 0.7,
        "max_tokens": 1000
      }
    },
    "output": {
      "summary": "The text is a lengthy piece that requires summarization. It consists of several sentences and paragraphs that need to be condensed into a shorter version while retaining the essential information and meaning."
    },
    "tokens": {
      "input": 230,
      "output": 35,
      "total": 265
    },
    "pii_detection": {
      "user_prompt": {
        "total_entities": 0,
        "entity_types": {},
        "detected_entities": [],
        "original_text": "This is a long text that needs to be summarized. It contains multiple sentences and paragraphs that should be condensed into a shorter version while maintaining the key information and meaning."
      },
      "system_prompt": {
        "total_entities": 0,
        "entity_types": {},
        "detected_entities": [],
        "original_text": "\nYou are an advanced summarization assistant trained to generate clear, contextually accurate, and concise summaries.\n\nYour goal is to distill the most important information from any provided text — whether it's an article, report, transcript, conversation, or document. \nFocus on:\n- Capturing the main ideas, facts, and intent.\n- Preserving the original meaning and tone.\n- Removing redundancy, filler, and irrelevant details.\n- Maintaining logical flow and readability.\n\nAdapt the summarization style and length based on the user's request (e.g., short summary, detailed summary, key bullet points, or executive brief).\n\nAlways ensure your summary stays within the specified word count limit (200 words) while maintaining quality and completeness.\n\nIf no specific format or length is mentioned, provide a balanced, paragraph-style summary that captures all key points within the word limit.\nAlso do not mention word count in the final summary\n"
      }
    }
  }
}
```

---

### 5. POST Summarize Text - Debug Mode Streaming

**Endpoint:**
```
POST https://aigateway.shiprocket.in/api/v1/summarization?debug=true
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
| 400 | Invalid input | `{ "success": false, "status_code": 400, "errors": {}, "message": "Invalid word_count parameter" }` |
| 401 | Unauthorized / Missing API key | `{ "success": false, "status_code": 401, "errors": {}, "message": "Unauthorized" }` |
| 500 | Internal server error | `{ "success": false, "status_code": 500, "errors": {}, "message": "Unexpected server failure" }` |

---

#### Notes
- The summarization service may have rate limits based on your API key.
- For **streaming** requests, ensure your client supports **Server-Sent Events (SSE)** or WebSocket streaming.
- Use `debug=true` for troubleshooting or inspecting full request/response payloads.

---

**Author:** API Platform Team  
**Version:** 1.0.0  
**Last Updated:** 2025-11-13
