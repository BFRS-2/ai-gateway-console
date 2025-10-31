import urls from "../urls";
import { callGetApi, callPostApi } from "../callApi";

export type ProviderName = "openai" | "gemini" | "pytesseract" | string;

export interface ServiceConfig {
  default_model?: string;
  backup_model?: string;
  default_provider?: ProviderName;
  backup_provider?: ProviderName;
  allowed_models?: string[];
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ProjectServicePayload {
  service: "summarization" | "inference" | "embedding" | "ocr" | string;
  config: ServiceConfig;
  limits?: {
    daily?: number;
    monthly?: number;
  };
  enabled?: boolean;
}

export interface ProjectCreateBody {
  name: string;
  organization_id: string;
  description?: string;
  cost_limits?: {
    daily?: number;
    monthly?: number;
  };
  active?: boolean;
  services?: ProjectServicePayload[];
}

export interface Project {
  id: string;
  name: string;
  organization_id: string;
  description?: string;
  active: boolean;
  services: ProjectServicePayload[];
  created_at?: string;
  updated_at?: string;
}

const projectService = {
  create: (body: ProjectCreateBody) => callPostApi(urls.GET_PROJECTS, body),
  getAll: () =>
    callGetApi(urls.PROJECTS) as Promise<{
      data: { projects: Project[] };
      success: boolean;
      status_code: number;
      message?: string;
    }>,
  getByOrganization: (organizationId: string) =>
    callGetApi(
      `${
        urls.GET_PROJECTS
      }/by-organization?organization_id=${encodeURIComponent(organizationId)}`
    ) as Promise<Project[]>,
  getUsage: (projectId: string) =>
    callGetApi(`${urls.PROJECT_USAGE}/${projectId}/usage`),

  getProjectServices: (projectId: string) =>
    callGetApi(`${urls.PROJECT_SERVICES}/${projectId}/services`),
};

export default projectService;
