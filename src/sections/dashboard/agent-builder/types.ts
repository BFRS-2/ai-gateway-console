export type WidgetConfig = Record<string, unknown>;

export type ServiceSetup = {
  serviceId: string;
  defaultModel: string;
  backupModel: string;
  defaultProvider: string;
  backupProvider: string;
  allowedModels: string[];
  temperature: number;
  limits: {
    daily: number;
    monthly: number;
  };
  serviceAlertLimit: {
    daily: number;
    monthly: number;
  };
};

export type ToolingConfig = {
  kb: {
    file: File | null;
    chunkingSize: number;
    overlappingSize: number;
    status?: "uploading" | "processing" | "ready" | "failed";
    collectionName: string;
    selection: "existing" | "new";
  };
  mcp: {
    url: string;
    status?: "checking" | "valid" | "invalid";
  };
};

export type AgentNodeConfig = {
  name: string;
  systemPrompt: string;
  reviewerPrompt: string;
  maxSteps: number;
};

export type AgentListItem = {
  id: string;
  name: string;
  raw: Record<string, unknown>;
};

export type BuilderConfig = {
  service: ServiceSetup;
  tools: ToolingConfig;
  agent: AgentNodeConfig;
};
