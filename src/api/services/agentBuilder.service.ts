import { callGetApi, callPostApi } from "../callApi";

export interface ProjectServiceSetupBody {
  service_id: string;
  config: {
    default_model: string;
    backup_model: string;
    default_provider: string;
    backup_provider: string;
    allowed_models: string[];
    temperature: number;
  };
  limits?: {
    daily?: number;
    monthly?: number;
  };
  service_alert_limit?: {
    daily?: number;
    monthly?: number;
  };
  enabled?: boolean;
}

export interface MCPStatusPayload {
  url: string;
}

export interface AgentGraphPayload {
  nodes: Array<{ id: string; type: string; config: Record<string, unknown> }>;
  edges: Array<{ from: string; to: string }>;
  entry_point: string;
  state_schema: Record<string, unknown>;
}

export interface AgentSetupPayload {
  project_id: string;
  name: string;
  graph_json: AgentGraphPayload;
  mcp_url?: string;
  system_prompt: string;
  kb_collection?: string;
  max_steps: number;
}

export interface WidgetConfigPayload {
  project_id: string;
  config: Record<string, unknown>;
}

const agentBuilderService = {
  addProjectService: (projectId: string, body: ProjectServiceSetupBody) =>
    callPostApi(`/api/v1/projects/${encodeURIComponent(projectId)}/services`, body),

  checkMcpStatus: (payload: MCPStatusPayload) =>
    callPostApi("/api/v1/mcp/status", payload),

  getAgentConfig: (projectId: string) =>
    callGetApi(`/api/v1/agent/config?project_id=${encodeURIComponent(projectId)}`),

  setupAgent: (payload: AgentSetupPayload) =>
    callPostApi("/api/v1/agent/setup", payload),

  submitWidgetConfig: (payload: WidgetConfigPayload) =>
    callPostApi("/api/v1/agent/preview", payload),
};

export default agentBuilderService;
