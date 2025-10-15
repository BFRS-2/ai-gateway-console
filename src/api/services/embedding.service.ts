import urls from "../urls";
import { callPostApi } from "../callApi";

export interface EmbeddingRequest {
  input: string | string[]; // single string or array
  model?: string;           // e.g. "text-embedding-3-small"
  provider?: string;
}

export interface EmbeddingItem {
  embedding: number[];
  index?: number;
  metadata?: Record<string, any>;
}

export interface EmbeddingResponse {
  data: EmbeddingItem[];
  model?: string;
  usage?: any;
}

const embeddingService = {
  generateEmbeddings: (body: EmbeddingRequest) => callPostApi(urls.EMBEDDING, body) as Promise<EmbeddingResponse>,
};

export default embeddingService;
