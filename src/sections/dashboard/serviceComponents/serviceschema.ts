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

export interface ServiceSchema {
  service: string;                 // e.g., "inference"
  title: string;                   // UI title
  fields: Record<Path, FieldSchema>;
  // initial payload shape you want to send to your API on save
  initial: Record<string, any>;
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
    initial: {
      service: "inference",
      config: {
        ...COMMON_DEFAULTS,
        allowed_models: [],
        system_prompt:
          "You are a helpful assistant that provides accurate and helpful responses.",
        temperature: 0.7,
        max_tokens: 1000,
      },
      limits: { daily: 100, monthly: 300 },
      enabled: true,
    },
    fields: {
      "config.default_model":   { label: "Default Model",   type: "dropdown",   required: true, dynamic: "models" },
      "config.backup_model":    { label: "Backup Model",    type: "dropdown",   required: true, dynamic: "models" },
      "config.default_provider":{ label: "Default Provider",type: "dropdown",   required: true, dynamic: "providers" },
      "config.backup_provider": { label: "Backup Provider", type: "dropdown",   required: true, dynamic: "providers" },
      "config.allowed_models":  { label: "Allowed Models",  type: "multiselect",               dynamic: "models" },
      "config.system_prompt":   { label: "System Prompt",   type: "textarea" },
      "config.temperature":     { label: "Temperature",     type: "slider", min: 0, max: 2, step: 0.1, required: true },
      "config.max_tokens":      { label: "Max Tokens",      type: "number", min: 1, max: 200000, required: true },
      "limits.daily":           { label: "Daily Limit",     type: "number", min: 0, required: true },
      "limits.monthly":         { label: "Monthly Limit",   type: "number", min: 0, required: true },
      enabled:                  { label: "Enabled",         type: "switch" },
    },
  },

  summarization: {
    service: "summarization",
    title: "Configure Summarization",
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
      "config.default_model":   { label: "Default Model",   type: "dropdown",   required: true, dynamic: "models" },
      "config.backup_model":    { label: "Backup Model",    type: "dropdown",   required: true, dynamic: "models" },
      "config.default_provider":{ label: "Default Provider",type: "dropdown",   required: true, dynamic: "providers" },
      "config.backup_provider": { label: "Backup Provider", type: "dropdown",   required: true, dynamic: "providers" },
      "config.allowed_models":  { label: "Allowed Models",  type: "multiselect",               dynamic: "models" },
      "config.system_prompt":   { label: "System Prompt",   type: "textarea" },
      "config.temperature":     { label: "Temperature",     type: "slider", min: 0, max: 2, step: 0.1 },
      "config.max_tokens":      { label: "Max Tokens",      type: "number", min: 1, max: 200000 },
      "limits.daily":           { label: "Daily Limit",     type: "number", min: 0, required: true },
      "limits.monthly":         { label: "Monthly Limit",   type: "number", min: 0, required: true },
      enabled:                  { label: "Enabled",         type: "switch" },
    },
  },

  embedding: {
    service: "embedding",
    title: "Configure Embedding",
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
      "config.default_model":   { label: "Default Model",   type: "dropdown",   required: true, dynamic: "models" },
      "config.backup_model":    { label: "Backup Model",    type: "dropdown",   required: true, dynamic: "models" },
      "config.default_provider":{ label: "Default Provider",type: "dropdown",   required: true, dynamic: "providers" },
      "config.backup_provider": { label: "Backup Provider", type: "dropdown",   required: true, dynamic: "providers" },
      "config.allowed_models":  { label: "Allowed Models",  type: "multiselect",               dynamic: "models" },
      "config.max_tokens":      { label: "Max Tokens",      type: "number", min: 1, max: 200000 },
      "limits.daily":           { label: "Daily Limit",     type: "number", min: 0, required: true },
      "limits.monthly":         { label: "Monthly Limit",   type: "number", min: 0, required: true },
      enabled:                  { label: "Enabled",         type: "switch" },
    },
  },

  ocr: {
    service: "ocr",
    title: "Configure OCR",
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
      "config.default_model":   { label: "Default Model",   type: "dropdown",   required: true, dynamic: "models" },
      "config.backup_model":    { label: "Backup Model",    type: "dropdown",   required: true, dynamic: "models" },
      "config.default_provider":{ label: "Default Provider",type: "dropdown",   required: true, dynamic: "providers" },
      "config.backup_provider": { label: "Backup Provider", type: "dropdown",   required: true, dynamic: "providers" },
      "config.allowed_models":  { label: "Allowed Models",  type: "multiselect",               dynamic: "models" },
      "config.max_tokens":      { label: "Max Tokens",      type: "number", min: 1, max: 200000 },
      "config.supported_formats": { label: "Supported Formats", type: "chips" },
      "limits.daily":           { label: "Daily Limit",     type: "number", min: 0, required: true },
      "limits.monthly":         { label: "Monthly Limit",   type: "number", min: 0, required: true },
      enabled:                  { label: "Enabled",         type: "switch" },
    },
  },

  chatbot: {
    service: "chatbot",
    title: "Configure Chatbot",
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
      "config.default_model":   { label: "Default Model",   type: "dropdown",   required: true, dynamic: "models" },
      "config.backup_model":    { label: "Backup Model",    type: "dropdown",   required: true, dynamic: "models" },
      "config.default_provider":{ label: "Default Provider",type: "dropdown",   required: true, dynamic: "providers" },
      "config.backup_provider": { label: "Backup Provider", type: "dropdown",   required: true, dynamic: "providers" },
      "config.allowed_models":  { label: "Allowed Models",  type: "multiselect",               dynamic: "models" },
      "config.system_prompt":   { label: "System Prompt",   type: "textarea" },
      "config.temperature":     { label: "Temperature",     type: "slider", min: 0, max: 2, step: 0.1 },
      "limits.daily":           { label: "Daily Limit",     type: "number", min: 0, required: true },
      "limits.monthly":         { label: "Monthly Limit",   type: "number", min: 0, required: true },
      enabled:                  { label: "Enabled",         type: "switch" },
    },
  },
};
