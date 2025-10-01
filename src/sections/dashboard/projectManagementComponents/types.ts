export type ServiceKind = 'ocr' | 'summarization' | 'embeddings' | 'voice' | 'chatbot';

export type ServiceConfig = {
  id: string;
  kind: ServiceKind;
  name: string;
  status: 'active' | 'paused';
  model?: string;
  language?: string;
  params?: Record<string, any>;
  metrics?: {
    calls30d: number;
    tokens30d?: number;
    costINR30d: number;
    p95ms?: number;
    errorRate?: number; // 0..1
  };
  onUpdate: VoidFunction
};

export type MemberRole = 'Admin' | 'Developer' | 'Viewer';

export type Member = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  lastActiveAt?: string;
};

export type Activity = {
  id: string;
  ts: string;
  actor: string;
  entity: 'service' | 'project' | 'document' | 'member';
  action: string; // e.g., "updated config", "ran OCR batch", "added doc"
  detail?: string;
};

export type DocumentAsset = {
  id: string;
  name: string;
  type: 'pdf' | 'csv' | 'sheet' | 'doc';
  sizeKB?: number;
  updatedAt: string;
  ragAttached?: boolean;
};

export type Project = {
  id: string;
  name: string;
  teamId: string;
  status: 'active' | 'paused' | 'archived';
  owners: string[]; // user ids or emails
  budgetINR?: number;
  spendINR30d?: number;
  services: ServiceConfig[];
  members: Member[];
  activity: Activity[];
  documents: DocumentAsset[];
};

export type Team = {
  id: string;
  name: string;
  projects: Project[];
};
