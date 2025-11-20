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
  // === CHAT COMPLETION (kept key as "inference" to avoid breaking callers) ===
  "chat completion": {
    service: "chat completion",
    title: "Configure Chat Completion",
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
          title: "Fallback Model",
          description: "A fallback used if the Model is unavailable.",
          fields: ["config.backup_model", "config.backup_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "allowed_models_block",
          title: "Allowed Models",
          description: "Restrict which models can be selected at runtime (Optionally leave empty to allow all).",
          fields: ["config.allowed_models"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "generation_prompt",
          title: "System Prompt",
          description: "Instruction injected on every request.",
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
        {
          id: "alerts",
          title: "Usage Alerts",
          description: "Send alerts when usage crosses a threshold.",
          fields: ["alerts.daily", "alerts.monthly"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
      ],
    },
    initial: {
      service: "inference",
      config: {
        ...COMMON_DEFAULTS,
        allowed_models: [],
        system_prompt: "You are a helpful assistant.",
        temperature: 0.7,
        max_tokens: 5000,
      },
      limits: { daily: 100, monthly: 300 },
      alerts: { daily: 80, monthly: 80 }, // percentage thresholds
      enabled: true,
    },
    fields: {
      "config.default_model": { label: "Model", type: "dropdown", required: true, dynamic: "models", helpText: "Primary model used for requests unless overridden." },
      "config.backup_model": { label: "Fallback Model", type: "dropdown", required: true, dynamic: "models", helpText: "Fallback model if the Model is unavailable." },
      "config.default_provider": { label: "Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the Model (e.g., OpenAI, Google)." },
      "config.backup_provider": { label: "Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the Fallback Model." },
      "config.allowed_models": { label: "Allowed Models", type: "multiselect", dynamic: "models", helpText: "Restrict which models can be selected at runtime (Optionally leave empty to allow all)." },
      "config.system_prompt": { label: "System Prompt", type: "textarea", required: true, helpText: "High-level instruction injected before user input." },
      "config.temperature": { label: "Temperature", type: "slider", min: 0, max: 1, step: 0.1, required: true, helpText: "Lower = deterministic, higher = creative. Range 0–1." },
      "config.max_tokens": { label: "Max Tokens", type: "number", min: 1, max: 200000, required: true, helpText: "Upper bound for generated tokens (response length)." },
      "limits.daily": { label: "Daily Limit", type: "number", min: 0, required: true, helpText: "Maximum requests/cost per day for this service." },
      "limits.monthly": { label: "Monthly Limit", type: "number", min: 0, required: true, helpText: "Maximum requests/cost per month for this service." },
      "alerts.daily": { label: "Daily Alert %", type: "number", min: 0, max: 100, step: 1, helpText: "Alert when daily usage crosses this percentage of the limit." },
      "alerts.monthly": { label: "Monthly Alert %", type: "number", min: 0, max: 100, step: 1, helpText: "Alert when monthly usage crosses this percentage of the limit." },
      enabled: { label: "Enabled", type: "switch", helpText: "Toggle this service on or off." },
    },
  },

  // === SUMMARIZATION ===
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
          title: "Fallback Model",
          description: "Used if the default summarization model fails or throttles.",
          fields: ["config.backup_model", "config.backup_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "allowed_models_block",
          title: "Allowed Models",
          description: "Restrict which models can be selected at runtime (Optionally leave empty to allow all).",
          fields: ["config.allowed_models"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "length_controls",
          title: "Length Controls",
          description: "Limit summary length by words or tokens.",
          fields: ["config.word_limit", "config.max_tokens"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "limits",
          title: "Usage Limits",
          description: "Daily/monthly quotas and availability.",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "alerts",
          title: "Usage Alerts",
          description: "Send alerts when usage crosses a threshold.",
          fields: ["alerts.daily", "alerts.monthly"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
      ],
    },
    initial: {
      service: "summarization",
      config: {
        ...COMMON_DEFAULTS,
        allowed_models: [],
        // No system_prompt / temperature by matrix
        word_limit: 300,       // NEW: present only for summarization
        max_tokens: 5000,
      },
      limits: { daily: 100, monthly: 300 },
      alerts: { daily: 80, monthly: 80 },
      enabled: true,
    },
    fields: {
      "config.default_model": { label: "Model", type: "dropdown", required: true, dynamic: "models", helpText: "Primary model for summarization jobs." },
      "config.backup_model": { label: "Model", type: "dropdown", required: true, dynamic: "models", helpText: "Used if Default Model fails or throttles." },
      "config.default_provider": { label: "Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the Model." },
      "config.backup_provider": { label: "Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the Fallback Model." },
      "config.allowed_models": { label: "Allowed Models", type: "multiselect", dynamic: "models", helpText: "Restrict which models can be selected at runtime (Optionally leave empty to allow all)." },
      "config.word_limit": { label: "Word Limit", type: "number", min: 1, max: 200000, required: true, helpText: "Maximum words allowed in the summary." },
      "config.max_tokens": { label: "Max Tokens", type: "number", min: 1, max: 200000, required: true, helpText: "Token cap for generated summary." },
      "limits.daily": { label: "Daily Limit", type: "number", min: 0, required: true, helpText: "Daily quota for this service." },
      "limits.monthly": { label: "Monthly Limit", type: "number", min: 0, required: true, helpText: "Monthly quota for this service." },
      "alerts.daily": { label: "Daily Alert %", type: "number", min: 0, max: 100, step: 1, helpText: "Alert when daily usage crosses this percentage." },
      "alerts.monthly": { label: "Monthly Alert %", type: "number", min: 0, max: 100, step: 1, helpText: "Alert when monthly usage crosses this percentage." },
      enabled: { label: "Enabled", type: "switch", helpText: "Enable/disable summarization service." },
    },
  },

  // === EMBEDDING ===
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
          title: "Fallback Model",
          description: "Fallback embedding model and provider.",
          fields: ["config.backup_model", "config.backup_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "allowed_models_block",
          title: "Allowed Models",
          description: "Restrict which models can be selected at runtime (Optionally leave empty to allow all).",
          fields: ["config.allowed_models"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "embedding",
          title: "Embedding Settings",
          description: "Token cap per request.",
          fields: ["config.max_tokens"],
          style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px" },
        },
        {
          id: "limits",
          title: "Usage Limits",
          description: "Daily/monthly quotas and availability.",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "alerts",
          title: "Usage Alerts",
          description: "Send alerts when usage crosses a threshold.",
          fields: ["alerts.daily", "alerts.monthly"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
      ],
    },
    initial: {
      service: "embedding",
      config: {
        ...COMMON_DEFAULTS,
        allowed_models: [],
        max_tokens: 5000,
      },
      limits: { daily: 1000, monthly: 10000 },
      alerts: { daily: 80, monthly: 80 },
      enabled: true,
    },
    fields: {
      "config.default_model": { label: "Model", type: "dropdown", required: true, dynamic: "models", helpText: "Primary model for embeddings." },
      "config.backup_model": { label: "Fallback Model", type: "dropdown", required: true, dynamic: "models", helpText: "Fallback model if primary fails." },
      "config.default_provider": { label: "Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the Model." },
      "config.backup_provider": { label: "Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the Fallback Model." },
      "config.allowed_models": { label: "Allowed Models", type: "multiselect", dynamic: "models", helpText: "Restrict which models can be selected at runtime (Optionally leave empty to allow all)." },
      "config.max_tokens": { label: "Max Tokens", type: "number", min: 1, max: 200000, required: true, helpText: "Maximum tokens processed per call." },
      "limits.daily": { label: "Daily Limit", type: "number", min: 0, required: true, helpText: "Daily quota for embedding calls." },
      "limits.monthly": { label: "Monthly Limit", type: "number", min: 0, required: true, helpText: "Monthly quota for embedding calls." },
      "alerts.daily": { label: "Daily Alert %", type: "number", min: 0, max: 100, step: 1, helpText: "Alert when daily usage crosses this percentage." },
      "alerts.monthly": { label: "Monthly Alert %", type: "number", min: 0, max: 100, step: 1, helpText: "Alert when monthly usage crosses this percentage." },
      enabled: { label: "Enabled", type: "switch", helpText: "Enable/disable embedding service." },
    },
  },

  // === OCR ===
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
          title: "Fallback Model",
          description: "Fallback OCR model and provider.",
          fields: ["config.backup_model", "config.backup_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "allowed_models_block",
          title: "Allowed Models",
          description: "Restrict which models can be selected at runtime (Optionally leave empty to allow all).",
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
        {
          id: "alerts",
          title: "Usage Alerts",
          description: "Send alerts when usage crosses a threshold.",
          fields: ["alerts.daily", "alerts.monthly"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
      ],
    },
    initial: {
      service: "ocr",
      config: {
        ...COMMON_DEFAULTS,
        allowed_models: [],
        max_tokens: 5000,
        supported_formats: ["image/jpeg", "image/png", "application/pdf"],
      },
      limits: { daily: 50, monthly: 1000 },
      alerts: { daily: 80, monthly: 80 },
      enabled: true,
    },
    fields: {
      "config.default_model": { label: "Model", type: "dropdown", required: true, dynamic: "models", helpText: "Primary OCR model." },
      "config.backup_model": { label: "Fallback Model", type: "dropdown", required: true, dynamic: "models", helpText: "Fallback OCR model." },
      "config.default_provider": { label: "Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the default OCR model." },
      "config.backup_provider": { label: "Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for the backup OCR model." },
      "config.allowed_models": { label: "Allowed Models", type: "multiselect", dynamic: "models", helpText: "Restrict which models can be selected at runtime (Optionally leave empty to allow all)." },
      "config.max_tokens": { label: "Max Tokens", type: "number", min: 1, max: 200000, required: true, helpText: "Token cap per OCR request." },
      "config.supported_formats": { label: "Supported Formats", type: "chips", helpText: "Acceptable MIME types for OCR input." },
      "limits.daily": { label: "Daily Limit", type: "number", min: 0, required: true, helpText: "Daily OCR quota." },
      "limits.monthly": { label: "Monthly Limit", type: "number", min: 0, required: true, helpText: "Monthly OCR quota." },
      "alerts.daily": { label: "Daily Alert %", type: "number", min: 0, max: 100, step: 1, helpText: "Alert when daily usage crosses this percentage." },
      "alerts.monthly": { label: "Monthly Alert %", type: "number", min: 0, max: 100, step: 1, helpText: "Alert when monthly usage crosses this percentage." },
      enabled: { label: "Enabled", type: "switch", helpText: "Enable/disable OCR service." },
    },
  },

  // === CHATBOT ===
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
          title: "Fallback Model",
          description: "Fallback chat model and provider.",
          fields: ["config.backup_model", "config.backup_provider"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
        {
          id: "allowed_models_block",
          title: "Allowed Models",
          description: "Restrict which models can be selected at runtime (Optionally leave empty to allow all).",
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
          title: "Behaviour & Length",
          description: "Adjust randomness and cap output length.",
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
        {
          id: "alerts",
          title: "Usage Alerts",
          description: "Send alerts when usage crosses a threshold.",
          fields: ["alerts.daily", "alerts.monthly"],
          style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
        },
      ],
    },
    initial: {
      service: "chatbot",
      config: {
        ...COMMON_DEFAULTS,
        allowed_models: [],
        system_prompt: "You are a helpful AI assistant for this application.",
        temperature: 0.7,
        max_tokens: 5000,
      },
      limits: { daily: 100, monthly: 300 },
      alerts: { daily: 80, monthly: 80 },
      enabled: true,
    },
    fields: {
      "config.default_model": { label: "Model", type: "dropdown", required: true, dynamic: "models", helpText: "Primary chat model." },
      "config.backup_model": { label: "Fallback Model", type: "dropdown", required: true, dynamic: "models", helpText: "Fallback chat model." },
      "config.default_provider": { label: "Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for default chat model." },
      "config.backup_provider": { label: "Provider", type: "dropdown", required: true, dynamic: "providers", helpText: "Provider for backup chat model." },
      "config.allowed_models": { label: "Allowed Models", type: "multiselect", dynamic: "models", helpText: "Restrict which models can be selected at runtime (Optionally leave empty to allow all)." },
      "config.system_prompt": { label: "System Prompt", type: "textarea", required: true, helpText: "Persona & guardrails for the chatbot." },
      "config.temperature": { label: "Temperature", type: "slider", min: 0, max: 1, step: 0.1, required: true, helpText: "Lower is focused; higher is creative. Range 0–1." },
      "config.max_tokens": { label: "Max Tokens", type: "number", min: 1, max: 200000, required: true, helpText: "Upper bound for generated tokens (response length)." },
      "limits.daily": { label: "Daily Limit", type: "number", min: 0, required: true, helpText: "Daily chat quota." },
      "limits.monthly": { label: "Monthly Limit", type: "number", min: 0, required: true, helpText: "Monthly chat quota." },
      "alerts.daily": { label: "Daily Alert %", type: "number", min: 0, max: 100, step: 1, helpText: "Alert when daily usage crosses this percentage." },
      "alerts.monthly": { label: "Monthly Alert %", type: "number", min: 0, max: 100, step: 1, helpText: "Alert when monthly usage crosses this percentage." },
      enabled: { label: "Enabled", type: "switch", helpText: "Enable/disable chatbot service." },
    },
  },
};
