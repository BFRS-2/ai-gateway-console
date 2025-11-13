export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "switch"
  | "dropdown"
  | "multiselect"
  | "slider"
  | "chips";

export type Path = string; // dot-path like "config.default_model", "limits.daily"

export interface FieldSchema {
  label?: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  default?: any;
  min?: number;
  max?: number;
  step?: number;

  // Static options (if present)
  options?: { label: string; value: string }[];

  // Dynamic options populated at runtime (from models API)
  dynamic?: "models" | "providers";
}

export interface ServiceUI {
  // page-level styles
  containerStyle?: React.CSSProperties;
  formStyle?: React.CSSProperties;

  // groups to render in order
  groups?: {
    id: string;
    title?: string;
    description?: string;
    // list of field paths in this group
    fields: Path[];
    // layout for fields inside this group
    style?: React.CSSProperties;
  }[];

  // default field style (can be used as grid item style)
  fieldStyle?: React.CSSProperties;
}

export interface ServiceSchema {
  service: string;
  title: string;
  fields: Record<Path, FieldSchema>;
  initial: Record<string, any>;

  // NEW
  ui?: ServiceUI;
}

export type ServiceSchemas = Record<string, ServiceSchema>;

const COMMON_DEFAULTS = {
  default_model: "gpt-4o",
  backup_model: "gpt-4o-mini",
  default_provider: "openai",
  backup_provider: "openai",
};

export const serviceSchemas: ServiceSchemas = {
  inference: {
    service: "inference",
    title: "Configure Inference",
    ui: {
      containerStyle: { width: "70vw", maxWidth: "1100px", margin: "0 auto", padding: "16px 0 32px" },
      formStyle: { display: "flex", flexDirection: "column", gap: "20px" },
      fieldStyle: { minWidth: 0 },
      groups: [
        {
          id: "default_model_block",
          title: "Default Model",
          description: "Select the primary model and its provider.",
          fields: ["config.default_model", "config.default_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "backup_model_block",
          title: "Backup Model",
          description: "A fallback used if the default model is unavailable.",
          fields: ["config.backup_model", "config.backup_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "allowed_models_block",
          title: "Allowed Models",
          description: "Restrict what models can be chosen at runtime.",
          fields: ["config.allowed_models"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "generation_prompt",
          title: "Generation Settings",
          description: "System Prompt is sent on every request and defines assistant behavior.",
          fields: ["config.system_prompt"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "generation_tunables",
          title: "Controls",
          description: "Temperature controls randomness (0–1). Max Tokens limits output length.",
          fields: ["config.temperature", "config.max_tokens"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "limits",
          title: "Usage Limits",
          description: "Set service-level daily/monthly caps and toggle availability.",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" },
        },
      ],
    },
    initial: {
      service: "inference",
      config: {
        ...COMMON_DEFAULTS,
        allowed_models: [],
        system_prompt: "You are a helpful assistant that provides accurate and helpful responses.",
        temperature: 0.7,
        max_tokens: 1000,
      },
      limits: { daily: 100, monthly: 300 },
      enabled: true,
    },
    fields: {
      "config.default_model": { label: "Default Model", type: "dropdown", required: true, dynamic: "models", helpText: "Primary model used for requests unless overridden." },
      "config.backup_model": { label: "Backup Model", type: "dropdown", required: true, dynamic: "models", helpText: "Fallback model if the default model is unavailable." },
      "config.default_provider": { label: "Default Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the default model (e.g., OpenAI, Google)." },
      "config.backup_provider": { label: "Backup Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the backup model." },
      "config.allowed_models": { label: "Allowed Models", type: "multiselect", dynamic: "models", helpText: "Whitelist of models users can choose at runtime." },
      "config.system_prompt": { label: "System Prompt", type: "textarea", helpText: "High-level instruction injected before user input." },
      "config.temperature": { label: "Temperature", type: "slider", min: 0, max: 1, step: 0.1, required: true, helpText: "Lower = deterministic, higher = creative. Range 0–1." },
      "config.max_tokens": { label: "Max Tokens", type: "number", min: 1, max: 200000, required: true, helpText: "Upper bound for generated tokens (response length)." },
      "limits.daily": { label: "Daily Limit", type: "number", min: 0, required: true, helpText: "Maximum requests/cost per day for this service." },
      "limits.monthly": { label: "Monthly Limit", type: "number", min: 0, required: true, helpText: "Maximum requests/cost per month for this service." },
      enabled: { label: "Enabled", type: "switch", helpText: "Toggle this service on or off." },
    },
  },

  summarization: {
    service: "summarization",
    title: "Configure Summarization",
    ui: {
      containerStyle: { width: "70vw", maxWidth: "1100px", margin: "0 auto", padding: "16px 0 32px" },
      formStyle: { display: "flex", flexDirection: "column", gap: "20px" },
      groups: [
        {
          id: "default_model_block",
          title: "Default Model",
          description: "Primary model and provider for summarization.",
          fields: ["config.default_model", "config.default_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "backup_model_block",
          title: "Backup Model",
          description: "Used if the default summarization model fails or throttles.",
          fields: ["config.backup_model", "config.backup_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "allowed_models_block",
          title: "Allowed Models",
          description: "Runtime allow-list for summarization.",
          fields: ["config.allowed_models"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "generation",
          title: "Summarization Prompt",
          description: "Define tone and constraints for summaries.",
          fields: ["config.system_prompt"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "generation_variables",
          title: "Controls",
          description: "Randomness and output length settings.",
          fields: ["config.temperature", "config.max_tokens"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "limits",
          title: "Usage Limits",
          description: "Daily/monthly quotas and availability.",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" },
        },
      ],
    },
    initial: {
      service: "summarization",
      config: {
        ...COMMON_DEFAULTS,
        allowed_models: [],
        system_prompt: "You are a helpful assistant that creates concise summaries.",
        temperature: 0.7,
        max_tokens: 1000,
      },
      limits: { daily: 100, monthly: 300 },
      enabled: true,
    },
    fields: {
      "config.default_model": { label: "Default Model", type: "dropdown", required: true, dynamic: "models", helpText: "Primary model for summarization jobs." },
      "config.backup_model": { label: "Backup Model", type: "dropdown", required: true, dynamic: "models", helpText: "Used if default model fails or throttles." },
      "config.default_provider": { label: "Default Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the default model." },
      "config.backup_provider": { label: "Backup Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the backup model." },
      "config.allowed_models": { label: "Allowed Models", type: "multiselect", dynamic: "models", helpText: "Runtime model allow-list." },
      "config.system_prompt": { label: "System Prompt", type: "textarea", helpText: "Guidance for style/format/length of summaries." },
      "config.temperature": { label: "Temperature", type: "slider", min: 0, max: 1, step: 0.1, helpText: "Creativity vs determinism (0–1)." },
      "config.max_tokens": { label: "Max Tokens", type: "number", min: 1, max: 200000, helpText: "Maximum tokens to generate per summary." },
      "limits.daily": { label: "Daily Limit", type: "number", min: 0, required: true, helpText: "Daily quota for this service." },
      "limits.monthly": { label: "Monthly Limit", type: "number", min: 0, required: true, helpText: "Monthly quota for this service." },
      enabled: { label: "Enabled", type: "switch", helpText: "Enable/disable summarization service." },
    },
  },

  embedding: {
    service: "embedding",
    title: "Configure Embedding",
    ui: {
      containerStyle: { width: "70vw", maxWidth: "1100px", margin: "0 auto", padding: "16px 0 32px" },
      formStyle: { display: "flex", flexDirection: "column", gap: "20px" },
      groups: [
        {
          id: "default_model_block",
          title: "Default Model",
          description: "Primary embedding model and provider.",
          fields: ["config.default_model", "config.default_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "backup_model_block",
          title: "Backup Model",
          description: "Fallback embedding model and provider.",
          fields: ["config.backup_model", "config.backup_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "allowed_models_block",
          title: "Allowed Models",
          description: "Restrict which embedding models are selectable.",
          fields: ["config.allowed_models"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "embedding",
          title: "Embedding Settings",
          description: "Tune token constraints for embedding requests.",
          fields: ["config.max_tokens"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "limits",
          title: "Usage Limits",
          description: "Daily/monthly quotas and availability.",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" },
        },
      ],
    },
    initial: {
      service: "embedding",
      config: {
        ...COMMON_DEFAULTS,
        allowed_models: [],
        max_tokens: 8191,
      },
      limits: { daily: 1000, monthly: 10000 },
      enabled: true,
    },
    fields: {
      "config.default_model": { label: "Default Model", type: "dropdown", required: true, dynamic: "models", helpText: "Primary model for embeddings." },
      "config.backup_model": { label: "Backup Model", type: "dropdown", required: true, dynamic: "models", helpText: "Fallback model if primary fails." },
      "config.default_provider": { label: "Default Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the default model." },
      "config.backup_provider": { label: "Backup Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the backup model." },
      "config.allowed_models": { label: "Allowed Models", type: "multiselect", dynamic: "models", helpText: "Limit which models can be requested." },
      "config.max_tokens": { label: "Max Tokens", type: "number", min: 1, max: 200000, helpText: "Maximum tokens processed per embedding call." },
      "limits.daily": { label: "Daily Limit", type: "number", min: 0, required: true, helpText: "Daily quota for embedding calls." },
      "limits.monthly": { label: "Monthly Limit", type: "number", min: 0, required: true, helpText: "Monthly quota for embedding calls." },
      enabled: { label: "Enabled", type: "switch", helpText: "Enable/disable embedding service." },
    },
  },

  ocr: {
    service: "ocr",
    title: "Configure OCR",
    ui: {
      containerStyle: { width: "70vw", maxWidth: "1100px", margin: "0 auto", padding: "16px 0 32px" },
      formStyle: { display: "flex", flexDirection: "column", gap: "20px" },
      groups: [
        {
          id: "default_model_block",
          title: "Default Model",
          description: "Primary OCR model and provider.",
          fields: ["config.default_model", "config.default_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "backup_model_block",
          title: "Backup Model",
          description: "Fallback OCR model and provider.",
          fields: ["config.backup_model", "config.backup_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "allowed_models_block",
          title: "Allowed Models",
          description: "Restrict selectable OCR models.",
          fields: ["config.allowed_models"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "ocr",
          title: "OCR Settings",
          description: "Token cap and supported MIME formats for OCR input.",
          fields: ["config.max_tokens", "config.supported_formats"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "limits",
          title: "Usage Limits",
          description: "Daily/monthly quotas and availability.",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" },
        },
      ],
    },
    initial: {
      service: "ocr",
      config: {
        ...COMMON_DEFAULTS,
        allowed_models: [],
        max_tokens: 4096,
        supported_formats: ["image/jpeg", "image/png", "application/pdf"],
      },
      limits: { daily: 50, monthly: 1000 },
      enabled: true,
    },
    fields: {
      "config.default_model": { label: "Default Model", type: "dropdown", required: true, dynamic: "models", helpText: "Primary OCR model." },
      "config.backup_model": { label: "Backup Model", type: "dropdown", required: true, dynamic: "models", helpText: "Fallback OCR model." },
      "config.default_provider": { label: "Default Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the default OCR model." },
      "config.backup_provider": { label: "Backup Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the backup OCR model." },
      "config.allowed_models": { label: "Allowed Models", type: "multiselect", dynamic: "models", helpText: "Restrict selectable OCR models." },
      "config.max_tokens": { label: "Max Tokens", type: "number", min: 1, max: 200000, helpText: "Token cap per OCR request." },
      "config.supported_formats": { label: "Supported Formats", type: "chips", helpText: "Acceptable MIME types for OCR input." },
      "limits.daily": { label: "Daily Limit", type: "number", min: 0, required: true, helpText: "Daily OCR quota." },
      "limits.monthly": { label: "Monthly Limit", type: "number", min: 0, required: true, helpText: "Monthly OCR quota." },
      enabled: { label: "Enabled", type: "switch", helpText: "Enable/disable OCR service." },
    },
  },

  chatbot: {
    service: "chatbot",
    title: "Configure Chatbot",
    ui: {
      containerStyle: { width: "70vw", maxWidth: "1100px", margin: "0 auto", padding: "16px 0 32px" },
      formStyle: { display: "flex", flexDirection: "column", gap: "20px" },
      groups: [
        {
          id: "default_model_block",
          title: "Default Model",
          description: "Primary chat model and provider.",
          fields: ["config.default_model", "config.default_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "backup_model_block",
          title: "Backup Model",
          description: "Fallback chat model and provider.",
          fields: ["config.backup_model", "config.backup_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "allowed_models_block",
          title: "Allowed Models",
          description: "Limit which chat models are selectable.",
          fields: ["config.allowed_models"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "bot_prompt",
          title: "Bot Prompt",
          description: "System instruction that defines the chatbot’s persona and rules.",
          fields: ["config.system_prompt"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "bot_behaviour",
          title: "Bot Behaviour",
          description: "Adjust randomness for responses.",
          fields: ["config.temperature"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "limits",
          title: "Usage Limits",
          description: "Daily/monthly quotas and availability.",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" },
        },
      ],
    },
    initial: {
      service: "chatbot",
      config: {
        ...COMMON_DEFAULTS,
        allowed_models: [],
        system_prompt:
          "You are a helpful AI assistant that provides accurate and helpful responses based on the knowledge base.",
        temperature: 0.7,
      },
      limits: { daily: 100, monthly: 300 },
      enabled: true,
    },
    fields: {
      "config.default_model": { label: "Default Model", type: "dropdown", required: true, dynamic: "models", helpText: "Primary chat model." },
      "config.backup_model": { label: "Backup Model", type: "dropdown", required: true, dynamic: "models", helpText: "Fallback chat model." },
      "config.default_provider": { label: "Default Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for default chat model." },
      "config.backup_provider": { label: "Backup Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for backup chat model." },
      "config.allowed_models": { label: "Allowed Models", type: "multiselect", dynamic: "models", helpText: "Limit which chat models are selectable." },
      "config.system_prompt": { label: "System Prompt", type: "textarea", helpText: "Persona & guardrails for the chatbot." },
      "config.temperature": { label: "Temperature", type: "slider", min: 0, max: 1, step: 0.1, helpText: "Lower is focused; higher is creative. Range 0–1." },
      "limits.daily": { label: "Daily Limit", type: "number", min: 0, required: true, helpText: "Daily chat quota." },
      "limits.monthly": { label: "Monthly Limit", type: "number", min: 0, required: true, helpText: "Monthly chat quota." },
      enabled: { label: "Enabled", type: "switch", helpText: "Enable/disable chatbot service." },
    },
  },
};


