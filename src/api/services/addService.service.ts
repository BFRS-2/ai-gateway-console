import urls from "../urls";
import { callPostApi, callPutApi } from "../callApi";

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
    callPostApi(`${urls.PROJECTS}${projectId}/services`, body),

  updateService: (projectId: string, body: AddProjectServiceBody) =>
    callPutApi(`${urls.PROJECTS}${projectId}/services`, body),
};

export default addService;
