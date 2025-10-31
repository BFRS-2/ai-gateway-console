// src/api/urls.ts
const urls = {
  // Core endpoints
  SUMMARIZATION: "/api/v1/summarization",
  INFERENCE: "/api/v1/inference",
  EMBEDDING: "/api/v1/embedding",
  OCR: "/api/v1/ocr",

  // Auth
  LOGIN: "/api/v1/auth/login",
  USER_INFO: "/api/v1/auth/user",

  // Organization
  GET_ORGANIZATIONS: "/api/v1/organizations/",
  CREATE_ORGANIZATION: "/api/v1/organizations/",
  UPDATE_ORGANIZATION: "/api/v1/organizations/",
  DELETE_ORGANIZATION: "/api/v1/organizations",
  GET_ORGANIZATION_BY_ID: "/api/v1/organizations",
  USER_ORGANIZATIONS : "/api/v1/user/organizations",

  // Project (both old and new keys included for compatibility)
  GET_PROJECTS: "/api/v1/projects/setup/",              // <-- your requested key (list & create)
  PROJECTS: "/api/v1/projects/",                 // alternate name used in examples
  PROJECT_BY_ORGANIZATION: "/api/v1/projects/by-organization",
  PROJECT_USAGE: "/api/v1/projects",            // use with `${PROJECTS}/${projectId}/usage`
  PROJECT_SERVICES: "/api/v1/projects",         // use with `${PROJECT_SERVICES}/${projectId}/services`
  USER_PROJECTS : "/api/v1/user/projects",

  // Service Management
  GET_ALL_SERVICES: "/api/v1/services",
  GET_ALL_MODELS: "/api/v1/models",
  GET_ALL_PROVIDERS: "/api/v1/providers",
  GET_MODELS_BY_PROVIDER: "/api/v1/models/by-provider",
} as const;

export default urls;
