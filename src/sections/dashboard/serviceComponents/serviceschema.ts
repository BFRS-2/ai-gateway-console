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
      containerStyle: {
        width: "70vw",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "16px 0 32px",
      },
      formStyle: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      },
      fieldStyle: {
        // default field width inside a 2-col grid
        minWidth: 0,
      },
      groups: [
        {
          id: "models",
          title: "Model & Provider",
          description: "Choose primary, backup and allowed models.",
          fields: [
            "config.default_model",
            "config.backup_model",
            "config.default_provider",
            "config.backup_provider",
            "config.allowed_models",
          ],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          },
        },
        {
          id: "generation",
          title: "Generation Settings",
          description: "Control output style.",
          fields: ["config.system_prompt", "config.temperature", "config.max_tokens"],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          },
        },
        {
          id: "limits",
          title: "Usage Limits",
          description: "Rate-limit this service.",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "16px",
          },
        },
      ],
    },
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
      "config.default_model": {
        label: "Default Model",
        type: "dropdown",
        required: true,
        dynamic: "models",
      },
      "config.backup_model": {
        label: "Backup Model",
        type: "dropdown",
        required: true,
        dynamic: "models",
      },
      "config.default_provider": {
        label: "Default Provider",
        type: "dropdown",
        required: true,
        dynamic: "providers",
      },
      "config.backup_provider": {
        label: "Backup Provider",
        type: "dropdown",
        required: true,
        dynamic: "providers",
      },
      "config.allowed_models": {
        label: "Allowed Models",
        type: "multiselect",
        dynamic: "models",
      },
      "config.system_prompt": {
        label: "System Prompt",
        type: "textarea",
      },
      "config.temperature": {
        label: "Temperature",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        required: true,
      },
      "config.max_tokens": {
        label: "Max Tokens",
        type: "number",
        min: 1,
        max: 200000,
        required: true,
      },
      "limits.daily": {
        label: "Daily Limit",
        type: "number",
        min: 0,
        required: true,
      },
      "limits.monthly": {
        label: "Monthly Limit",
        type: "number",
        min: 0,
        required: true,
      },
      enabled: { label: "Enabled", type: "switch" },
    },
  },

  summarization: {
    service: "summarization",
    title: "Configure Summarization",
    ui: {
      containerStyle: {
        width: "70vw",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "16px 0 32px",
      },
      formStyle: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      },
      groups: [
        {
          id: "models",
          title: "Model & Provider",
          fields: [
            "config.default_model",
            "config.backup_model",
            "config.default_provider",
            "config.backup_provider",
            "config.allowed_models",
          ],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          },
        },
        {
          id: "generation",
          title: "Summarization Settings",
          fields: ["config.system_prompt", "config.temperature", "config.max_tokens"],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          },
        },
        {
          id: "limits",
          title: "Usage Limits",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "16px",
          },
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
      "config.default_model": {
        label: "Default Model",
        type: "dropdown",
        required: true,
        dynamic: "models",
      },
      "config.backup_model": {
        label: "Backup Model",
        type: "dropdown",
        required: true,
        dynamic: "models",
      },
      "config.default_provider": {
        label: "Default Provider",
        type: "dropdown",
        required: true,
        dynamic: "providers",
      },
      "config.backup_provider": {
        label: "Backup Provider",
        type: "dropdown",
        required: true,
        dynamic: "providers",
      },
      "config.allowed_models": {
        label: "Allowed Models",
        type: "multiselect",
        dynamic: "models",
      },
      "config.system_prompt": {
        label: "System Prompt",
        type: "textarea",
      },
      "config.temperature": {
        label: "Temperature",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
      },
      "config.max_tokens": {
        label: "Max Tokens",
        type: "number",
        min: 1,
        max: 200000,
      },
      "limits.daily": {
        label: "Daily Limit",
        type: "number",
        min: 0,
        required: true,
      },
      "limits.monthly": {
        label: "Monthly Limit",
        type: "number",
        min: 0,
        required: true,
      },
      enabled: { label: "Enabled", type: "switch" },
    },
  },

  embedding: {
    service: "embedding",
    title: "Configure Embedding",
    ui: {
      containerStyle: {
        width: "70vw",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "16px 0 32px",
      },
      formStyle: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      },
      groups: [
        {
          id: "models",
          title: "Model & Provider",
          fields: [
            "config.default_model",
            "config.backup_model",
            "config.default_provider",
            "config.backup_provider",
            "config.allowed_models",
          ],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          },
        },
        {
          id: "embedding",
          title: "Embedding Settings",
          fields: ["config.max_tokens"],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          },
        },
        {
          id: "limits",
          title: "Usage Limits",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "16px",
          },
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
      "config.default_model": {
        label: "Default Model",
        type: "dropdown",
        required: true,
        dynamic: "models",
      },
      "config.backup_model": {
        label: "Backup Model",
        type: "dropdown",
        required: true,
        dynamic: "models",
      },
      "config.default_provider": {
        label: "Default Provider",
        type: "dropdown",
        required: true,
        dynamic: "providers",
      },
      "config.backup_provider": {
        label: "Backup Provider",
        type: "dropdown",
        required: true,
        dynamic: "providers",
      },
      "config.allowed_models": {
        label: "Allowed Models",
        type: "multiselect",
        dynamic: "models",
      },
      "config.max_tokens": {
        label: "Max Tokens",
        type: "number",
        min: 1,
        max: 200000,
      },
      "limits.daily": {
        label: "Daily Limit",
        type: "number",
        min: 0,
        required: true,
      },
      "limits.monthly": {
        label: "Monthly Limit",
        type: "number",
        min: 0,
        required: true,
      },
      enabled: { label: "Enabled", type: "switch" },
    },
  },

  ocr: {
    service: "ocr",
    title: "Configure OCR",
    ui: {
      containerStyle: {
        width: "70vw",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "16px 0 32px",
      },
      formStyle: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      },
      groups: [
        {
          id: "models",
          title: "Model & Provider",
          fields: [
            "config.default_model",
            "config.backup_model",
            "config.default_provider",
            "config.backup_provider",
            "config.allowed_models",
          ],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          },
        },
        {
          id: "ocr",
          title: "OCR Settings",
          fields: ["config.max_tokens", "config.supported_formats"],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          },
        },
        {
          id: "limits",
          title: "Usage Limits",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "16px",
          },
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
      "config.default_model": {
        label: "Default Model",
        type: "dropdown",
        required: true,
        dynamic: "models",
      },
      "config.backup_model": {
        label: "Backup Model",
        type: "dropdown",
        required: true,
        dynamic: "models",
      },
      "config.default_provider": {
        label: "Default Provider",
        type: "dropdown",
        required: true,
        dynamic: "providers",
      },
      "config.backup_provider": {
        label: "Backup Provider",
        type: "dropdown",
        required: true,
        dynamic: "providers",
      },
      "config.allowed_models": {
        label: "Allowed Models",
        type: "multiselect",
        dynamic: "models",
      },
      "config.max_tokens": {
        label: "Max Tokens",
        type: "number",
        min: 1,
        max: 200000,
      },
      "config.supported_formats": {
        label: "Supported Formats",
        type: "chips",
      },
      "limits.daily": {
        label: "Daily Limit",
        type: "number",
        min: 0,
        required: true,
      },
      "limits.monthly": {
        label: "Monthly Limit",
        type: "number",
        min: 0,
        required: true,
      },
      enabled: { label: "Enabled", type: "switch" },
    },
  },

  chatbot: {
    service: "chatbot",
    title: "Configure Chatbot",
    ui: {
      containerStyle: {
        width: "70vw",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "16px 0 32px",
      },
      formStyle: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      },
      groups: [
        {
          id: "models",
          title: "Model & Provider",
          fields: [
            "config.default_model",
            "config.backup_model",
            "config.default_provider",
            "config.backup_provider",
            "config.allowed_models",
          ],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          },
        },
        {
          id: "bot",
          title: "Bot Behaviour",
          fields: ["config.system_prompt", "config.temperature"],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          },
        },
        {
          id: "limits",
          title: "Usage Limits",
          fields: ["limits.daily", "limits.monthly", "enabled"],
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "16px",
          },
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
      "config.default_model": {
        label: "Default Model",
        type: "dropdown",
        required: true,
        dynamic: "models",
      },
      "config.backup_model": {
        label: "Backup Model",
        type: "dropdown",
        required: true,
        dynamic: "models",
      },
      "config.default_provider": {
        label: "Default Provider",
        type: "dropdown",
        required: true,
        dynamic: "providers",
      },
      "config.backup_provider": {
        label: "Backup Provider",
        type: "dropdown",
        required: true,
        dynamic: "providers",
      },
      "config.allowed_models": {
        label: "Allowed Models",
        type: "multiselect",
        dynamic: "models",
      },
      "config.system_prompt": {
        label: "System Prompt",
        type: "textarea",
      },
      "config.temperature": {
        label: "Temperature",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
      },
      "limits.daily": {
        label: "Daily Limit",
        type: "number",
        min: 0,
        required: true,
      },
      "limits.monthly": {
        label: "Monthly Limit",
        type: "number",
        min: 0,
        required: true,
      },
      enabled: { label: "Enabled", type: "switch" },
    },
  },
};
