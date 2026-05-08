### OCR API Documentation

This document provides detailed developer documentation for the **OCR (Optical Character Recognition) APIs**, which enable users to extract text from images and PDF documents using AI vision models.

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
Content-Type: multipart/form-data
```

---

### 1. POST Extract Text from Image

**Endpoint:**
```
POST https://aigateway.shiprocket.in/api/v1/ocr
```

**Description:**
Extracts text content from uploaded image files using OCR technology. Supports common image formats (JPEG, PNG, etc.).

#### Request (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | Image file to process |
| `file_type` | string | Yes | Must be `"image"` |
| `model` | string | No | Model to use (default: from project config) |
| `provider` | string | No | Provider to use (default: from project config) |
| `type` | string | No | Output format: `"text"` or `"json"`. Not applicable for `pytesseract` provider |
| `system_prompt` | string | No | Custom instruction to guide the OCR extraction. Only used when `type` is `"text"` |

#### Example cURL
```bash
curl -X POST "https://aigateway.shiprocket.in/api/v1/ocr" \
  -H "x-api-key: {{project_api_key}}" \
  -F "file=@/path/to/image.jpg" \
  -F "file_type=image" \
  -F "model=gpt-4o-mini" \
  -F "provider=openai" \
  -F "type=text" \
  -F "system_prompt=Extract only the invoice number and total amount"
```

#### Example Response
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "output": [
      {
        "page_1": "Extracted text content from the image..."
      }
    ],
    "tokens": {
      "input": 1136,
      "output": 436,
      "total": 1572
    },
    "model_used": "gpt-4o"
  }
}
```

---

### 2. POST Extract Text from PDF

**Endpoint:**
```
POST https://aigateway.shiprocket.in/api/v1/ocr
```

**Description:**
Extracts text content from uploaded PDF documents. **Note: PDF files are limited to 10 pages maximum.**

#### Request (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | PDF file to process |
| `file_type` | string | Yes | Must be `"pdf"` |
| `model` | string | No | Model to use (default: from project config) |
| `provider` | string | No | Provider to use (default: from project config) |
| `type` | string | No | Output format: `"text"` or `"json"`. Not applicable for `pytesseract` provider |
| `system_prompt` | string | No | Custom instruction to guide the OCR extraction. Only used when `type` is `"text"` |

#### Example cURL
```bash
curl -X POST "https://aigateway.shiprocket.in/api/v1/ocr" \
  -H "x-api-key: {{project_api_key}}" \
  -F "file=@/path/to/document.pdf" \
  -F "file_type=pdf" \
  -F "model=gpt-4o" \
  -F "provider=openai" \
  -F "type=json"
```

#### Example Response
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "output": [
      {
        "page_1": "```\nCompany, Inc.\n\nSample PDF\n\nPrepared By\nChadwick Hilarity\n\n+123-456-7890                   https://sample-files.com\n```"
      },
      {
        "page_2": "Sample PDF Content\n\nIntroduction\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit..."
      }
    ],
    "tokens": {
      "input": 5695,
      "output": 515,
      "total": 6210
    },
    "model_used": "gpt-4o"
  }
}
```

---

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | file | Yes | Image or PDF file to process |
| `file_type` | string | Yes | Type of file: `"image"` or `"pdf"` |
| `model` | string | No | Model to use (default: from project config) |
| `provider` | string | No | Provider to use (default: from project config) |
| `type` | string | No | Output format: `"text"` or `"json"`. Not applicable for `pytesseract` provider |
| `system_prompt` | string | No | Custom system instruction to guide the extraction. Only used when `type` is `"text"` |

---

### Response Format

#### Success Response (Image)
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "output": [
      {
        "page_1": "Extracted text content from the image..."
      }
    ],
    "tokens": {
      "input": 1136,
      "output": 436,
      "total": 1572
    },
    "model_used": "gpt-4o"
  }
}
```

#### Success Response (PDF)
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "output": [
      {
        "page_1": "Text content from page 1..."
      },
      {
        "page_2": "Text content from page 2..."
      }
    ],
    "tokens": {
      "input": 5695,
      "output": 515,
      "total": 6210
    },
    "model_used": "gpt-4o"
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
| 400 | Invalid input | `{ "success": false, "status_code": 400, "errors": {}, "message": "file_type must be 'image' or 'pdf'" }` |
| 401 | Unauthorized / Missing API key | `{ "success": false, "status_code": 401, "errors": {}, "message": "Unauthorized" }` |
| 404 | Service not configured | `{ "success": false, "status_code": 404, "errors": {}, "message": "OCR service not configured for this project" }` |
| 500 | Internal server error | `{ "success": false, "status_code": 500, "errors": {}, "message": "Unexpected server failure" }` |

---

#### Notes
- **Model & Provider Priority**: Payload → Database Config → Default
- **PDF files are limited to 10 pages maximum** for processing.
- Model and provider are optional — defaults from project configuration will be used if not specified.
- The `type` field (`"text"` or `"json"`) controls the output format. It is **not supported** when using the `pytesseract` provider.
- The `system_prompt` field allows you to pass custom instructions (e.g. "extract only dates and amounts") and is only applied when `type` is `"text"`.
- **Output Format:**
  - **Image files**: `output` is an array with a single object containing a `page_1` key
  - **PDF files**: `output` is an array of objects, one per page (`page_1`, `page_2`, etc.)

---

**Author:** API Platform Team  
**Version:** 2.0.0  
**Last Updated:** 2026-04-02
