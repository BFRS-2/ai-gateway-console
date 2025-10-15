import urls from "../urls";
import { callPostApi } from "../callApi";

export interface InferenceRequest {
  user_prompt: string;
  system_prompt?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  model?: string;
  provider?: string;
  // additional context, messages, or conversation id if supported
  messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

export interface InferenceResponse {
  output?: string | any;
  // extend as per backend
}

const inferenceService = {
  runInference: (body: InferenceRequest) => callPostApi(urls.INFERENCE, body) as Promise<InferenceResponse>,
};

export default inferenceService;
