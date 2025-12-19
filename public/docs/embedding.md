### Embedding API Documentation

This document provides detailed developer documentation for the **Embedding APIs**, which enable users to generate vector embeddings from text using various AI models.

---

#### Base URL

```
https://aigateway.shiprocket.in```

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

### 1. POST Generate Embedding - Basic

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/embedding
```

**Description:**
Generates vector embeddings for the provided text input using the default model from project configuration.

#### Request Body
```json
{
  "input": "hi"
}
```

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/embedding" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -d '{
    "input": "hi"
  }'
```

#### Example Response
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "output": {
      "embedding": [0.0123, -0.0456, 0.0789, 0.1234, ...],
      "model_used": "text-embedding-3-small"
    },
    "tokens": {
      "input": 1,
      "output": 0,
      "total": 1
    }
  }
}
```

---

### 2. POST Generate Embedding - Advanced

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/embedding
```

**Description:**
Generates embeddings with specified model and provider. Overrides default project configuration.

#### Request Body
```json
{
  "input": "hi",
  "provider": "openai",
  "model": "text-embedding-3-large"
}
```

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/embedding" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -d '{
    "input": "hi",
    "provider": "openai",
    "model": "text-embedding-3-large"
  }'
```

#### Example Response
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "output": {
      "embedding": [0.0123, -0.0456, 0.0789, 0.1234, ...],
      "model_used": "text-embedding-3-large"
    },
    "tokens": {
      "input": 1,
      "output": 0,
      "total": 1
    }
  }
}
```

---

### 3. POST Generate Embedding - Shunya Provider

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/embedding
```

**Description:**
Generates embeddings using the Shunya provider. Useful for cost-effective embedding generation.

#### Request Body
```json
{
  "input": "hi",
  "provider": "shunya",
  "model": "shunya-embedding-model"
}
```

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/embedding" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {{project_api_key}}" \
  -d '{
    "input": "hi",
    "provider": "shunya",
    "model": "shunya-embedding-model"
  }'
```

#### Example Response
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "output": {
      "embedding": [0.0123, -0.0456, 0.0789, 0.1234, ...],
      "model_used": "shunya-embedding-model"
    },
    "tokens": {
      "input": 1,
      "output": 0,
      "total": 1
    }
  }
}
```

---

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | string | Yes | Text to generate embedding for |
| `model` | string | No | Model to use (default: from project config) |
| `provider` | string | No | Provider to use (default: from project config) |

---

### Response Format

#### Success Response
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "output": {
      "embedding": [0.0123, -0.0456, ...],
      "model_used": "model-name"
    },
    "tokens": {
      "input": 1,
      "output": 0,
      "total": 1
    }
  }
}
```

#### Error Response
```json
{
  "success": false,
  "status_code": 400,
  "errors": {},
  "message": "Error message"
}
```

---

### Error Responses

| Status | Description | Example |
|--------|-------------|---------|
| 400 | Invalid input | `{ "success": false, "status_code": 400, "errors": {}, "message": "input field is required" }` |
| 401 | Unauthorized / Missing API key | `{ "success": false, "status_code": 401, "errors": {}, "message": "Unauthorized" }` |
| 404 | Service not configured | `{ "success": false, "status_code": 404, "errors": {}, "message": "Embedding service not configured for this project" }` |
| 500 | Internal server error | `{ "success": false, "status_code": 500, "errors": {}, "message": "Unexpected server failure" }` |

---

#### Notes
- The embedding service may have rate limits based on your API key.
- Model and provider are optional - defaults from project configuration will be used if not specified.
- Embedding dimensions vary by model (e.g., `text-embedding-3-small` = 1536 dimensions, `text-embedding-3-large` = 3072 dimensions).
- Use the `input` field to provide the text for embedding generation.
- Embedding generation typically does not consume output tokens, only input tokens.

---

**Author:** API Platform Team  
**Version:** 1.0.0  
**Last Updated:** 2025-01-13

