export type ServiceKind = 'ocr' | 'summarization' | 'embeddings' | 'voice' | 'chatbot';

export type ModelInfo = {
  id: string;
  displayName: string;
  provider: 'openai' | 'google' | 'anthropic' | 'cohere' | 'internal';
  tier?: 'standard' | 'pro' | 'realtime' | 'experimental';
  context?: string; // eg 128k
  notes?: string;
};

export type ServiceDoc = {
  markdown: string; // overview/quickstart docs (can be rendered in MD viewer later)
  sampleCurl: string; // default curl example
  samples: {
    javascript: string;
    typescript: string;
    python: string;
    curl: string;
  };
};

export type Service = {
  id: string;
  kind: ServiceKind;
  title: string;
  description: string;
  enabled: boolean;
  versions?: string[];
  defaultVersion?: string;
  models: ModelInfo[];
  useCases: string[];
  doc: ServiceDoc;
};
