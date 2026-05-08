### Video Generation API Documentation

This document provides detailed developer documentation for the **Video Generation APIs**, which enable users to generate videos from text prompts using AI models.

Video generation is **asynchronous** — submitting a job returns a `job_id`, which you then poll via the status endpoint to retrieve the final video URL.

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

### 1. POST Video Generation - Submit Job

**Endpoint:**
```
POST https://aigateway.shiprocket.in/api/v1/video-generation/
```

**Description:**
Submits a video generation job. The response returns a `job_id` and a `pending` status. Use the status endpoint to poll for completion.

#### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Text description of the video to generate |
| `model` | string | No | Model to use (e.g. `veo-2.0-generate-001`) |
| `provider` | string | No | Provider to use (e.g. `gemini`) |
| `aspect_ratio` | string | No | Aspect ratio of the output video (e.g. `16:9`) |
| `duration_seconds` | number | No | Duration of the video in seconds |
| `negative_prompt` | string | No | Things to exclude from the video |
| `image` | file | No | Reference image for image-to-video generation |

#### Example cURL
```bash
curl -X POST "https://aigateway.shiprocket.in/api/v1/video-generation/" \
  -H "x-api-key: {{project_api_key}}" \
  -F "prompt=A futuristic city skyline at night with flying cars" \
  -F "model=veo-2.0-generate-001" \
  -F "provider=gemini"
```

#### Response — 202 Accepted
```json
{
  "success": true,
  "status_code": 202,
  "data": {
    "job_id": "69ce4e300588da398147975e",
    "status": "pending",
    "message": "Video generation job submitted successfully"
  }
}
```

---

### 2. GET Video Generation Status

**Endpoint:**
```
GET https://aigateway.shiprocket.in/api/v1/video-generation/status/{job_id}
```

**Description:**
Polls the status of a submitted video generation job. Keep polling until `status` is `completed` (or `failed`).

#### Path Parameter

| Parameter | Type | Description |
|-----------|------|-------------|
| `job_id` | string | The job ID returned from the submit endpoint |

#### Example cURL
```bash
curl -X GET "https://aigateway.shiprocket.in/api/v1/video-generation/status/69ce4e300588da398147975e" \
  -H "x-api-key: {{project_api_key}}"
```

#### Response — 200 OK (Completed)
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "job_id": "69ce4e300588da398147975e",
    "status": "completed",
    "prompt": "A futuristic city skyline at night with flying cars",
    "model": "veo-2.0-generate-001",
    "provider": "gemini",
    "video_url": "https://storage.example.com/video_generation/output.mp4",
    "video_duration": 8,
    "cost": 0.28,
    "error": null,
    "created_at": "2026-04-02T11:08:32.402000",
    "updated_at": "2026-04-02T11:09:29.943000"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Unique identifier for the job |
| `status` | string | `pending` \| `processing` \| `completed` \| `failed` |
| `prompt` | string | The original prompt submitted |
| `model` | string | Model used for generation |
| `provider` | string | Provider used for generation |
| `video_url` | string | Pre-signed URL to download the generated video (valid for 1 hour) |
| `video_duration` | number | Duration of the generated video in seconds |
| `cost` | number | Cost incurred for this generation |
| `error` | string \| null | Error message if the job failed, otherwise `null` |
| `created_at` | string | ISO 8601 timestamp when the job was created |
| `updated_at` | string | ISO 8601 timestamp of the last status update |

---

### Async Flow

```
1. POST /api/v1/video-generation/   →  202 { job_id, status: "pending" }
2. GET  /api/v1/video-generation/status/{job_id}  →  poll until status = "completed"
3. Download video from video_url (pre-signed, expires in 1 hour)
```

---

### Error Responses

| Status | Description | Example |
|--------|-------------|---------|
| 400 | Invalid input | `{ "success": false, "status_code": 400, "errors": {}, "message": "Invalid request parameters" }` |
| 401 | Unauthorized / Missing API key | `{ "success": false, "status_code": 401, "errors": {}, "message": "Unauthorized" }` |
| 404 | Job not found | `{ "success": false, "status_code": 404, "errors": {}, "message": "Job not found" }` |
| 500 | Internal server error | `{ "success": false, "status_code": 500, "errors": {}, "message": "Unexpected server failure" }` |

---

#### Notes
- The `video_url` is a pre-signed S3 URL that expires in **1 hour** — download the video promptly.
- **Model & Provider Priority**: Payload → Database Config → Default
- Longer `duration_seconds` increases generation time and cost.
- Poll the status endpoint every few seconds; typical generation takes 1–3 minutes.
- Model and provider are optional — defaults from project configuration will be used if not specified.

---

**Author:** API Platform Team
**Version:** 2.0.0
**Last Updated:** 2026-04-02
