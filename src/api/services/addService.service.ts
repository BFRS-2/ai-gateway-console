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


export interface ServiceLimits {
  daily: number;
  monthly: number;
}

export interface ServiceConfig {
  default_model: string;
  backup_model: string;
  default_provider: string;
  backup_provider: string;
  allowed_models: string[];
  system_prompt: string;
  temperature: number;
  max_tokens: number;
}

export interface SavedServiceConfig {
  id: string;
  project_id: string;
  organization_id: string;
  service: string;
  config: ServiceConfig;
  limits: ServiceLimits;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  service_id : string;
}
const addService = {
  addToProject: (projectId: string, body: AddProjectServiceBody) =>
    callPostApi(`${urls.PROJECTS}${projectId}/services`, body),

  updateService: (projectId: string, body: AddProjectServiceBody) =>
    callPutApi(`${urls.PROJECTS}${projectId}/services`, body),
};

export default addService;
