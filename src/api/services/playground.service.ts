// src/api/services/playground.service.ts

import { callPostApi } from "../callApi";

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

    // `callPostApi` should handle FormData payloads (no JSON stringify)
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
};

export default playgroundService;
