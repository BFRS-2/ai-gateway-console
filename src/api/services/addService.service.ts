import urls from "../urls";
import { callPostApi } from "../callApi";

export interface AddProjectServiceBody {
  service: "summarization" | "inference" | "embedding" | "ocr" | string;
  config: {
    default_model?: string;
    backup_model?: string;
    default_provider?: string;
    backup_provider?: string;
    allowed_models?: string[];
    system_prompt?: string;
    temperature?: number;
    max_tokens?: number;
  };
  limits?: {
    daily?: number;
    monthly?: number;
  };
  enabled?: boolean;
}

const addService = {
  addToProject: (projectId: string, body: AddProjectServiceBody) =>
    callPostApi(`${urls.GET_PROJECTS}/${projectId}/services`, body),
};

export default addService;
