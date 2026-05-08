<!-- ADLC: This stub was auto-extracted by Claude (85% extracted). -->
<!-- Review and enhance the content below. -->

### Base URL: `process.env.NEXT_PUBLIC_BASE_API_URL`
- Auth: Bearer Token (JWT from `localStorage.jwt_access_token`)
- API Key Header: `x-api-key: 6915c6a4fd440ec639b1f1c3` (all requests)

---

## Authentication

### POST /api/v1/auth/login
- Auth: None
- Request body: `email: string, password: string`
- Response: `200 { success: boolean, data: { user: UserInfo }, status_code: number }`

### GET /api/v1/auth/user
- Auth: Bearer token
- Response: `200 { success: boolean, data: { user: { email, id, is_admin, name, organizations[], project_permissions[] } } }`

### GET /api/v1/users/permissions
- Auth: Bearer token
- Request body: query params `organization_id: string, project_id: string`
- Response: `200 { data: { role: string, access: string } }`

### POST /api/v1/users/set-password
- Auth: Bearer token
- Request body: `email: string, password: string`
- Response: `200`

---

## Organizations

### GET /api/v1/organizations
- Auth: Bearer token
- Request body: optional query `active_only: boolean`
- Response: `200 { data: Organization[], success: boolean, status_code: number }`

### GET /api/v1/organizations/{id}
- Auth: Bearer token
- Response: `200 { id, name, description?, active, created_at?, updated_at? }`

### POST /api/v1/organizations
- Auth: Bearer token
- Request body: `name: string, description?: string, active?: boolean`
- Response: `200`

### PUT /api/v1/organizations/{id}
- Auth: Bearer token
- Request body: `name?: string, description?: string, active?: boolean`
- Response: `200`

### DELETE /api/v1/organizations/{id}
- Auth: Bearer token
- Response: `200`

### GET /api/v1/user/organizations
- Auth: Bearer token
- Response: `200 Organization[]`

---

## Projects

### GET /api/v1/projects
- Auth: Bearer token
- Request body: optional query `project_id: string`
- Response: `200 { data: Project[], success: boolean, status_code: number }`

### POST /api/v1/projects/setup
- Auth: Bearer token
- Request body: `name: string, organization_id: string, description?: string, cost_limits?: { daily?: number, monthly?: number }, active?: boolean, services?: ProjectServicePayload[]`
- Response: `200 { data: Project[], success: boolean }`

### GET /api/v1/projects/setup/by-organization
- Auth: Bearer token
- Request body: query `organization_id: string`
- Response: `200 Project[]`

### GET /api/v1/projects/{project_id}/services
- Auth: Bearer token
- Response: `200`

### PUT /api/v1/projects/update
- Auth: Bearer token
- Request body: `project_id: string, name: string, description?: string, status?: "active"|"inactive", cost_limits?: { daily?, monthly? }, langfuse_project_name?: string`
- Response: `200`

### POST /api/v1/projects/{project_id}/api-key/generate
- Auth: Bearer token
- Response: `200 { data: { api_key?: string } }`

### DELETE /api/v1/projects/{project_id}/api-key/delete
- Auth: Bearer token
- Request body: `name: string`
- Response: `200 { success: boolean }`

### GET /api/v1/user/projects
- Auth: Bearer token
- Response: `200 Project[]`

---

## Usage & Analytics

### GET /api/v1/usage
- Auth: Bearer token
- Request body: query `project_id?: string, organization_id?: string, start_date: string, end_date: string, scope?: "org"|"project", type?: "daywise"|"mtd"`
- Response: `200 usage metrics object`

### GET /api/v1/usage/organization/{org_id}
- Auth: Bearer token
- Request body: query `group_by: "project"|"service", start_date: string, end_date: string` or `project_id: string, start_date, end_date`
- Response: `200 OrgUsageByProjectItem[] | OrgUsageByServiceItem[]`

---

## Users

### GET /api/v1/users
- Auth: Bearer token
- Request body: query `name?: string, page?: number, limit?: number, organization_id: string, project_id: string`
- Response: `200 User[]`

### POST /api/v1/members/add
- Auth: Bearer token
- Request body: `email: string, role: "admin"|"owner"|"member", organization_id?: string, project_id?: string, access_type?: "read"|"write"|"admin"`
- Response: `200`

### PUT /api/v1/users/update
- Auth: Bearer token
- Request body: `update_password?: { old: string, new: string }`
- Response: `200`

---

## Service Management

### GET /api/v1/services
- Auth: Bearer token
- Request body: query `project_id: string`
- Response: `200 { data: Service[], success: boolean }`

### GET /api/v1/models
- Auth: Bearer token
- Response: `200 { data: ModelRow[] }`

### GET /api/v1/providers
- Auth: Bearer token
- Response: `200 { data: ProviderRow[] }`

### GET /api/v1/models/by-provider/{provider}
- Auth: Bearer token
- Response: `200 ModelInfo[]` — `{ name: string, provider: string }`

### POST /api/v1/projects/{project_id}/services
- Auth: Bearer token
- Request body: `service: string, config: { default_model?, backup_model?, default_provider?, backup_provider?, allowed_models?, system_prompt?, temperature?, max_tokens? }, limits?: { daily?, monthly? }, enabled?: boolean`
- Response: `200`

### PUT /api/v1/projects/{project_id}/services
- Auth: Bearer token
- Request body: same as POST above
- Response: `200`

---

## Inference

### POST /api/v1/inference
- Auth: Bearer token
- Request body: `user_prompt: string, system_prompt?: string, stream?: boolean, temperature?: number, max_tokens?: number, model?: string, provider?: string, messages?: { role: "system"|"user"|"assistant", content: string }[]`
- Response: `200 { output?: string }` / `401` / `422`

---

## Embedding

### POST /api/v1/embedding
- Auth: Bearer token
- Request body: `input: string|string[], model?: string, provider?: string` (playground variant: `text: string, provider: string, model: string`)
- Response: `200 { data: { embedding: number[], index?, metadata? }[] }` / `401` / `422`

---

## Summarization

### POST /api/v1/summarization
- Auth: Bearer token
- Request body: `user_prompt: string, stream?: boolean, temperature?: number, max_tokens?: number, model?: string, provider?: string, word_count?: number`
- Response: `200 { summary?: string, usage?: any }` / `401` / `422`

---

## OCR

### POST /api/v1/ocr
- Auth: Bearer token
- Request body: `multipart/form-data` — `file: File, file_type: "image"|"pdf", model?: string, provider?: string, type?: "text"|"json", system_prompt?: string`
- Response: `200 { text?, content? }` / `401` / `422`

---

## Chat / Completion

### POST /api/v1/chat/completion
- Auth: Bearer token
- Request body: `user_prompt: string, model: string, provider: string, temperature?: number, max_tokens?: number, system_prompt?: string`
- Response: `200 { data: { answer?, content? } }`

### POST /api/v1/chat
- Auth: Bearer token
- Request body: `query: string, model: string, provider: string, rag_limit?: number, rag_threshold?: number`
- Response: `200 { data: { answer?, sources?[] } }`

---

## Knowledge Base

### POST /api/v1/kb/init
- Auth: Bearer token
- Request body: `multipart/form-data` — file upload
- Response: `200 { data: { _id, file_name, file_path, chunking_size, overlapping_size, status, message } }`

### GET /api/v1/kb/status/{project_id}
- Auth: Bearer token
- Response: `200 { data: { file_name, chunking_size, overlapping_size, status: "pending"|"processing"|"completed"|"failed"|"started", collection_name, chunks_created, csv_rows_processed, csv_columns[], jsonl_path, error } }`

---

## Agent Builder

### GET /api/v1/agent/config
- Auth: Bearer token
- Request body: query `project_id: string`
- Response: `200`

### POST /api/v1/agent/setup
- Auth: Bearer token
- Request body: `project_id: string, name: string, graph_json: { nodes[], edges[], entry_point, state_schema }, mcp_url?: string, system_prompt: string, kb_collection?: string, max_steps: number`
- Response: `200`

### POST /api/v1/agent/preview
- Auth: Bearer token
- Request body: `project_id: string, config: Record<string, unknown>`
- Response: `200`

### POST /api/v1/mcp/status
- Auth: Bearer token
- Request body: `url: string`
- Response: `200`

---

## Video Generation

### POST /api/v1/video-generation/
- Auth: Bearer token
- Request body: `multipart/form-data` — `prompt: string, model: string, provider: string, aspect_ratio?: string, duration_seconds?: number, negative_prompt?: string, image?: File`
- Response: `200 { data: { job_id?: string } }`

### GET /api/v1/video-generation/status/{job_id}
- Auth: Bearer token
- Response: `200 { data: { status?: string, video_url?: string } }`
