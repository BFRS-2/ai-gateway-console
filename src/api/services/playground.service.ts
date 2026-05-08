// src/api/services/playground.service.ts

import { callGetApi, callPostApi } from "../callApi";

export type PlaygroundProvider = string;
export type PlaygroundModel = string;

export type ApiResponse<T = any> = {
  success: boolean;
  data: T;
  status_code: number;
  message?: string;
};

/* -------------------- Payload Types -------------------- */

export interface SummarizationBody {
  user_prompt: string;
  model: PlaygroundModel;
  provider: PlaygroundProvider;
  temperature?: number;
  max_tokens?: number;
  word_count?: number;
}

export interface EmbeddingBody {
  text: string;
  provider: PlaygroundProvider;
  model: PlaygroundModel;
}

export type OcrFileType = "pdf" | "image";

export interface OcrBody {
  file: File;
  file_type: OcrFileType;
  model: PlaygroundModel;
  provider: PlaygroundProvider;
  type?: "text" | "json";
  system_prompt?: string;
}

export interface ChatCompletionBody {
  user_prompt: string;
  model: PlaygroundModel;
  provider: PlaygroundProvider;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
}

export interface ChatbotBody {
  query: string;
  model: PlaygroundModel;
  provider: PlaygroundProvider;
  rag_limit?: number;
  rag_threshold?: number;
  // X-User-Id will usually come from frontend (localStorage or similar)
  userId?: string;
}

export interface VideoGenerationBody {
  prompt: string;
  model: PlaygroundModel;
  provider: PlaygroundProvider;
  aspect_ratio?: string;
  duration_seconds?: number;
  negative_prompt?: string;
  image?: File;
}

/* -------------------- Response Types -------------------- */
/** Adjust inner `data` types once you know the exact backend shape */

export type SummarizationResponse = ApiResponse<{
  summary?: string;
  [key: string]: any;
}>;

export type EmbeddingResponse = ApiResponse<{
  embedding?: number[];
  vector?: number[];
  [key: string]: any;
}>;

export type OcrResponse = ApiResponse<{
  text?: string;
  content?: string;
  [key: string]: any;
}>;

export type ChatCompletionResponse = ApiResponse<{
  answer?: string;
  content?: string;
  [key: string]: any;
}>;

export type ChatbotResponse = ApiResponse<{
  answer?: string;
  sources?: any[];
  [key: string]: any;
}>;

export type VideoGenerationResponse = ApiResponse<{
  job_id?: string;
  [key: string]: any;
}>;

export type VideoGenerationStatusResponse = ApiResponse<{
  status?: string;
  video_url?: string;
  [key: string]: any;
}>;

/* -------------------- Service -------------------- */

const playgroundService = {
  // /api/v1/summarization
  summarize: (body: SummarizationBody) =>
    callPostApi("/api/v1/summarization", body) as Promise<SummarizationResponse>,

  // /api/v1/embedding
  embed: (body: EmbeddingBody) =>
    callPostApi("/api/v1/embedding", body) as Promise<EmbeddingResponse>,

  // /api/v1/ocr  (multipart)
  ocr: (body: OcrBody) => {
    const formData = new FormData();
    formData.append("file", body.file);
    formData.append("file_type", body.file_type);
    formData.append("model", body.model);
    formData.append("provider", body.provider);
    if (body.type) formData.append("type", body.type);
    if (body.system_prompt) formData.append("system_prompt", body.system_prompt);

    return callPostApi("/api/v1/ocr", formData) as Promise<OcrResponse>;
  },

  // /api/v1/chat/completion
  chatCompletion: (body: ChatCompletionBody) =>
    callPostApi(
      "/api/v1/chat/completion",
      body
    ) as Promise<ChatCompletionResponse>,

  // /api/v1/chat  (chatbot / RAG)
  chatbot: (body: ChatbotBody) =>
    // If you need X-User-Id header, extend `callPostApi` to accept options
    callPostApi("/api/v1/chat", {
      query: body.query,
      model: body.model,
      provider: body.provider,
      rag_limit: body.rag_limit,
      rag_threshold: body.rag_threshold,
    }) as Promise<ChatbotResponse>,

  // /api/v1/video-generation/
  videoGeneration: (body: VideoGenerationBody) => {
    const formData = new FormData();
    formData.append("prompt", body.prompt);
    formData.append("model", body.model);
    formData.append("provider", body.provider);
    if (body.aspect_ratio) formData.append("aspect_ratio", body.aspect_ratio);
    if (body.duration_seconds != null) formData.append("duration_seconds", String(body.duration_seconds));
    if (body.negative_prompt) formData.append("negative_prompt", body.negative_prompt);
    if (body.image) formData.append("image", body.image);
    return callPostApi("/api/v1/video-generation/", formData) as Promise<VideoGenerationResponse>;
  },

  // /api/v1/video-generation/status/:job_id
  videoGenerationStatus: (jobId: string) =>
    callGetApi(`/api/v1/video-generation/status/${jobId}`) as Promise<VideoGenerationStatusResponse>,
};

export default playgroundService;
