import urls from "../urls";
import { callDeleteApi, callGetApi, callPostApi, callPutApi } from "../callApi";
import objectToQueryString from "src/utils/objectToGetParams";

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

/* -------------------- Usage types (light) -------------------- */
export type MetricBlock = {
  requests: number;
  cost_used: number;
  tokens_used: number;
};

export type OrgUsageByProjectItem = {
  project_id: string;
  project_name: string;
  usage: Partial<MetricBlock>;
};

export type OrgUsageByServiceItem = {
  service_id: string;
  service: string;
  usage: Partial<MetricBlock>;
};

export type OrgDaywisePoint = {
  date: string; // YYYY-MM-DD
  requests?: number;
  cost_used?: number;
  tokens_used?: number;
};

export type ProjectUsageRange = {
  usage: Partial<MetricBlock>;
};

export type ProjectMTDPoint = {
  date: string; // YYYY-MM-DD
  requests?: number;
  cost_used?: number;
  tokens_used?: number;
};

/* -------------------- NEW: Settings/API Keys payloads -------------------- */
export type UpdateProjectPayload = {
  project_id: string;
  name: string;
  description?: string;
  status?: "active" | "inactive";
  cost_limits?: { daily?: number; monthly?: number };
  langfuse_project_name?: string;
};

export type ApiKeyGenerateResponse = {
  success: boolean;
  status_code: number;
  // backend returns the plain key once; key field name can vary, so keep it flexible
  data?: { api_key?: string; key?: string } | string;
};

export type ApiKeyDeleteResponse = {
  success: boolean;
  status_code: number;
};

export type GetProjectDetailsResponse = {
  success: boolean;
  status_code: number;
  data: Array<{
    id: string;
    name: string;
    organization_id: string;
    description?: string;
    cost_limits?: { daily?: number; monthly?: number };
    status?: "active" | "inactive";
    api_keys?: string[]; // masked keys like "6914****************ded3"
    langfuse_project_name?: string;
  }>;
};

/* -------------------- Base paths (NO fallbacks) -------------------- */
const ORG_USAGE_BASE = "/api/v1/usage/organization";
const USAGE_BASE = "/api/v1/usage";

/* -------------------- Service -------------------- */
const projectService = {
  // ----- existing -----
  create: (body: ProjectCreateBody) => callPostApi(urls.GET_PROJECTS, body),

  getAll: () =>
    callGetApi("/api/v1/projects") as Promise<{
      data: Project[];
      success: boolean;
      status_code: number;
      message?: string;
    }>,

  getByOrganization: (organizationId: string) =>
    callGetApi(
      `${urls.GET_PROJECTS}/by-organization?organization_id=${encodeURIComponent(
        organizationId
      )}`
    ) as Promise<Project[]>,

  /** Legacy generic usage (kept as-is) */
  getUsage: (body: {
    project_id?: string;
    organization_id?: string;
    start_date: string;
    end_date: string;
  }) => callGetApi(`${urls.PROJECT_USAGE}` + objectToQueryString(body)),

  getProjectServices: (projectId: string) =>
    callGetApi(`${urls.PROJECT_SERVICES}/${projectId}/services`),

  // ----- Usage APIs (no fallbacks) -----
  /** GET /api/v1/usage/organization/{org}?group_by=project&start_date=...&end_date=... */
  getOrgUsageGroupedByProject: (
    organization_id: string,
    start_date: string,
    end_date: string
  ) =>
    callGetApi(
      `${ORG_USAGE_BASE}/${encodeURIComponent(
        organization_id
      )}?group_by=project&start_date=${encodeURIComponent(
        start_date
      )}&end_date=${encodeURIComponent(end_date)}`
    ) as Promise<OrgUsageByProjectItem[]>,

  /** GET /api/v1/usage/organization/{org}?group_by=service&start_date=...&end_date=... */
  getOrgUsageGroupedByService: (
    organization_id: string,
    start_date: string,
    end_date: string
  ) =>
    callGetApi(
      `${ORG_USAGE_BASE}/${encodeURIComponent(
        organization_id
      )}?group_by=service&start_date=${encodeURIComponent(
        start_date
      )}&end_date=${encodeURIComponent(end_date)}`
    ) as Promise<OrgUsageByServiceItem[]>,

  /** GET /api/v1/usage/organization/{org}?project_id={project}&start_date=...&end_date=... */
  getProjectUsageViaOrg: (
    organization_id: string,
    project_id: string,
    start_date: string,
    end_date: string
  ) =>
    callGetApi(
      `${ORG_USAGE_BASE}/${encodeURIComponent(
        organization_id
      )}?project_id=${encodeURIComponent(
        project_id
      )}&start_date=${encodeURIComponent(
        start_date
      )}&end_date=${encodeURIComponent(end_date)}`
    ) as Promise<ProjectUsageRange>,

  /** GET /api/v1/usage?scope=org&organization_id=...&type=daywise&start_date=...&end_date=... */
  getOrgDaywise: (
    organization_id: string,
    start_date: string,
    end_date: string
  ) =>
    callGetApi(
      `${USAGE_BASE}?scope=org&organization_id=${encodeURIComponent(
        organization_id
      )}&type=daywise&start_date=${encodeURIComponent(
        start_date
      )}&end_date=${encodeURIComponent(end_date)}`
    ) as Promise<OrgDaywisePoint[]>,

  /** GET /api/v1/usage?scope=project&project_id=...&type=mtd */
  getProjectMTD: (project_id: string) =>
    callGetApi(
      `${USAGE_BASE}?scope=project&project_id=${encodeURIComponent(
        project_id
      )}&type=mtd`
    ) as Promise<ProjectMTDPoint[] | Record<string, any>>,

  /** GET /api/v1/projects?project_id={{project_id}} (used by UI to also read api_keys, limits, etc.) */
  getProjectDetails: (project_id: string) =>
    callGetApi(
      `/api/v1/projects?project_id=${encodeURIComponent(project_id)}`
    ) as Promise<GetProjectDetailsResponse>,

  // ----- NEW: Settings / API Keys (no fallbacks) -----

  /** POST /api/v1/projects/update */
  updatePoject: (payload: UpdateProjectPayload) =>
    callPutApi("/api/v1/projects/update", payload),

  /** POST /api/v1/projects/{{project_id}}/api-key/generate */
  addNewApiKey: (project_id: string, body?: Record<string, any>) =>
    callPostApi(
      `/api/v1/projects/${encodeURIComponent(project_id)}/api-key/generate`,
      body ?? {}
    ) as Promise<ApiKeyGenerateResponse>,

  /** POST /api/v1/projects/{{project_id}}/api-key/delete  (expects { api_key }) */
  deleteApiKey: (project_id: string, name: string) =>
    callDeleteApi(
      `/api/v1/projects/${encodeURIComponent(project_id)}/api-key/delete`,
      { name }
    ) as Promise<ApiKeyDeleteResponse>,

  getOrgMTDUsage: (
    organization_id: string,
    start_date: string,
    end_date: string
  ) =>
    callGetApi(
      `/api/v1/usage/?scope=org&organization_id=${encodeURIComponent(
        organization_id
      )}&type=mtd&start_date=${encodeURIComponent(
        start_date
      )}&end_date=${encodeURIComponent(end_date)}`
    ) as Promise<
      Array<{
        date: string;
        requests?: number;
        cost_used?: number;
        tokens_used?: number;
      }>
    >,

};

export default projectService;
