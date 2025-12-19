### OCR API Documentation

This document provides detailed developer documentation for the **OCR (Optical Character Recognition) APIs**, which enable users to extract text from images and PDF documents using AI vision models.

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
Content-Type: multipart/form-data
```

---

### 1. POST Extract Text from Image

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/ocr
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

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/ocr" \
  -H "x-api-key: {{project_api_key}}" \
  -F "file=@/path/to/image.jpg" \
  -F "file_type=image" \
  -F "model=gpt-4o-mini" \
  -F "provider=openai"
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
POST http://192.168.22.193:8001/api/v1/ocr
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

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/ocr" \
  -H "x-api-key: {{project_api_key}}" \
  -F "file=@/path/to/document.pdf" \
  -F "file_type=pdf" \
  -F "model=gpt-4o" \
  -F "provider=openai"
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
        "page_2": "Sample PDF Content\n\nIntroduction\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet.\n\nObjectives\n\nThe main objectives of this document are:\n\n• To provide a detailed overview of the project.\n• To illustrate the key findings through charts and tables.\n• To highlight the next steps and action items.\n\nKey Findings\n\n1. Market Analysis: Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n2. User Insights: Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.\n3. Technical Feasibility: Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum.\n\nMethodology\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam."
      },
      {
        "page_3": "Data Collection\n\n- **Surveys:** Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n- **Interviews:** Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.\n- **Observations:** Sed nisi. Nulla quis sem at nibh elementum imperdiet.\n\nData Analysis\n\n- **Quantitative Analysis:** Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n- **Qualitative Analysis:** Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.\n\nResults\n\nThe following table summarizes the key data points:\n\n| Metric             | Value      |\n|--------------------|------------|\n| Market Size        | $50 Billion|\n| User Satisfaction  | 85%        |\n| Growth Rate        | 10%        |\n\n_(Table 1: Summary of Key Data Points)_"
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

### 3. POST Extract Text - Using Default Configuration

**Endpoint:**
```
POST http://192.168.22.193:8001/api/v1/ocr
```

**Description:**
Extracts text using default model and provider from project configuration. Simplest usage pattern.

#### Request (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | Image or PDF file to process |
| `file_type` | string | Yes | Either `"image"` or `"pdf"` |

#### Example cURL
```bash
curl -X POST "http://192.168.22.193:8001/api/v1/ocr" \
  -H "x-api-key: {{project_api_key}}" \
  -F "file=@/path/to/document.pdf" \
  -F "file_type=pdf"
```

#### Example Response (PDF)
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
      "input": 300,
      "output": 150,
      "total": 450
    },
    "model_used": "gpt-4o-mini"
  }
}
```

**Note:** For image files, `output` will be an array with a single object containing `page_1` key.

---

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | file | Yes | Image or PDF file to process |
| `file_type` | string | Yes | Type of file: `"image"` or `"pdf"` |
| `model` | string | No | Model to use (default: from project config) |
| `provider` | string | No | Provider to use (default: from project config) |

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
- The OCR service may have rate limits based on your API key.
- **PDF files are limited to 10 pages maximum** for processing.
- Model and provider are optional - defaults from project configuration will be used if not specified.
- File size limits may apply based on your project configuration.
- The extracted text quality depends on the image/PDF quality and the model used.
- **Output Format:**
  - **Image files**: `output` is an **array with a single object** containing `page_1` key with the extracted text
  - **PDF files**: `output` is an **array of objects**, where each object contains a page key (e.g., `page_1`, `page_2`, `page_3`) with the extracted text as the value
  - Both image and PDF responses use the same array format, with images having only one page object

---

**Author:** API Platform Team  
**Version:** 1.0.0  
**Last Updated:** 2025-01-13

