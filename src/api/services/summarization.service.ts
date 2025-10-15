import urls from "../urls";
import { callPostApi } from "../callApi";

export interface SummarizationRequest {
  user_prompt: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  model?: string;     // optional override
  provider?: string;  // optional override
  // extend with other optional fields you support
}

export interface SummarizationResponse {
  summary?: string;
  usage?: any;
  // whatever your backend returns
}

const summarizationService = {
  summarizeText: (body: SummarizationRequest) => callPostApi(urls.SUMMARIZATION, body) as Promise<SummarizationResponse>,
};

export default summarizationService;
