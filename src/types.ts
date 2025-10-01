type ProviderRow = {
  provider: string;
  model: string;
  requests: number;
  tokens: number;
  costINR: number;
  p95ms: number;
  errorRate: number; // 0..1
};

type TeamRow = {
  team: string;
  requests: number;
  costINR: number;
  budgetINR: number;
  burnRate: number; // 0..1
};

type PromptRow = {
  name: string;
  owner: string;
  runs: number;
  costPerRunINR: number;
  quality: number; // 1-5
  updatedAt: string;
};

type RagRow = {
  rag: string;
  docs: number;
  version: string;
  stalenessDays: number;
  lastSync: string;
  status: "healthy" | "syncing" | "stale" | "error";
};

type ErrorRow = {
  ts: string;
  route: string;
  status: number;
  provider: string;
  team: string;
  detail: string;
};
export type { ProviderRow, TeamRow, PromptRow, RagRow, ErrorRow };

// ----------------------------------------------------------------------