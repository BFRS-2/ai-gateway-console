"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Skeleton,
  Slider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LanIcon from "@mui/icons-material/Lan";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { DashboardContent } from "src/layouts/dashboard";
import kbService, { KBStatusData } from "src/api/services/kb.service";
import agentBuilderService, {
  AgentSetupPayload,
} from "src/api/services/agentBuilder.service";
import serviceManagementService from "src/api/services/serviceManagement.service";
import { RootState } from "src/stores/store";
import {
  ModelRow,
  ProviderRow,
} from "src/sections/dashboard/serviceComponents/dynamicServiceForm";
import { serviceSchemas } from "src/sections/dashboard/serviceComponents/serviceschema";

export type WidgetConfig = Record<string, unknown>;

const darkThemeVariant: WidgetConfig = {
  preset: "brand",
  colors: {
    primary: "#7720FF",
    accent: "#26D07C",
    background: "#050816",
    surface: "#0B1020",
    surfaceAlt: "#060814",
    text: "#F9FAFB",
    mutedText: "#9CA3AF",
    border: "rgba(148,163,184,0.35)",
    shadow: "rgba(15,23,42,0.75)",
    danger: "#EF4444",
    warning: "#F59E0B",
    success: "#22C55E",
  },
  gradient: {
    enabled: false,
    type: "linear",
    angle: 135,
    stops: ["#7720FF", "#26D07C"],
  },
  typography: {
    fontFamily:
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    baseFontSize: 14,
    scale: 1.0,
  },
  shape: {
    radius: 10,
    bubbleRadius: 999,
    borderWidth: 1,
  },
  density: "normal",
  effects: {
    blurGlass: true,
    shadow: "md",
    reducedMotionRespect: true,
  },
};

const lightThemeVariant: WidgetConfig = {
  preset: "brand",
  colors: {
    primary: "#7720FF",
    accent: "#26D07C",
    background: "#F5F5FA",
    surface: "#FFFFFF",
    surfaceAlt: "#F3F4F6",
    text: "#111827",
    mutedText: "#6B7280",
    border: "rgba(15,23,42,0.08)",
    shadow: "rgba(15,23,42,0.12)",
    danger: "#DC2626",
    warning: "#D97706",
    success: "#15803D",
  },
  gradient: {
    enabled: false,
    type: "linear",
    angle: 135,
    stops: ["#7720FF", "#26D07C"],
  },
  typography: {
    fontFamily:
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    baseFontSize: 14,
    scale: 1.0,
  },
  shape: {
    radius: 10,
    bubbleRadius: 999,
    borderWidth: 1,
  },
  density: "normal",
  effects: {
    blurGlass: false,
    shadow: "md",
    reducedMotionRespect: true,
  },
};

const themeConfig: WidgetConfig = {
  mode: "dark",
  light: lightThemeVariant,
  dark: darkThemeVariant,
};

const widgetScriptUrl = process.env.NEXT_PUBLIC_AGENT_WIDGET_URL || "";
const widgetScriptIsModule =
  widgetScriptUrl.endsWith(".es.js") || widgetScriptUrl.endsWith(".mjs");
const widgetScriptIsIife = widgetScriptUrl.endsWith(".iife.js");
const shouldLoadReactUmd = !widgetScriptIsModule && !widgetScriptIsIife;
const reactUmdUrl =
  process.env.NEXT_PUBLIC_REACT_UMD_URL ||
  "https://unpkg.com/react@18/umd/react.production.min.js";
const reactDomUmdUrl =
  process.env.NEXT_PUBLIC_REACT_DOM_UMD_URL ||
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js";

const buildIntegrationSnippet = (agentId: string) => {
  const widgetSnippet = `<shiprocket-agent-widget agent-id="${agentId}" user-id="USER_ID" x-auth-token="YOUR_AUTH_TOKEN"></shiprocket-agent-widget>`;
  return [
    shouldLoadReactUmd ? `<script src="${reactUmdUrl}"></script>` : "",
    shouldLoadReactUmd ? `<script src="${reactDomUmdUrl}"></script>` : "",
    widgetScriptUrl
      ? `<script${
          widgetScriptIsModule ? ' type="module"' : ""
        } src="${widgetScriptUrl}"></script>`
      : "",
    "",
    widgetSnippet,
  ]
    .filter(Boolean)
    .join("\n");
};

const devConfig: WidgetConfig = {
  widget: {
    enabled: true,
    type: "bubble",
    layouts: {
      bubble: {
        enabled: true,
        position: "bottom-right",
        offset: { x: 20, y: 20 },
        launcher: {
          variant: "bubble",
          showLabel: false,
          label: "Chat",
          icon: "spark",
          size: "md",
          pulse: true,
          badge: { enabled: false, text: "1" },
        },
        panel: {
          width: 380,
          height: 560,
          minWidth: 320,
          minHeight: 420,
          maxWidth: 440,
          maxHeight: 680,
          mobileBehavior: "fullscreen",
          backdrop: { enabled: false, blur: 0 },
        },
      },
      drawer: {
        enabled: false,
        side: "right",
        width: 380,
        maxWidth: 520,
        mobileWidth: "100%",
        backdrop: { enabled: true, blur: 6, closeOnClick: true },
        animation: { type: "slide", durationMs: 240 },
        btn_text: "Need help?",
        btn_styles: {},
      },
      fullscreen: {
        enabled: false,
        backdrop: { enabled: false, blur: 0, closeOnClick: false },
        animation: { type: "fade", durationMs: 200 },
      },
    },
    theme: themeConfig,
    header: {
      show: true,
      title: "Shiprocket Assistant",
      subtitle: "Ask about orders, shipping, and support",
      logo: { enabled: false, url: "" },
      actions: {
        showClose: true,
        showMinimize: true,
        showReset: true,
        showPopout: false,
      },
    },
    messages: {
      welcome: "Hi! 👋 How can I help you today?",
      placeholder: "Type your message…",
      emptyState: {
        title: "Start a conversation",
        description: "Ask questions or pick a suggestion below.",
      },
      suggestions: [
        "Track my order",
        "What are your shipping rates?",
        "How do I create a return?",
      ],
      timestamp: { enabled: true, format: "relative" },
      typingIndicator: { enabled: true, style: "dots" },
      readReceipts: { enabled: false },
      messageStyles: {
        assistant: { avatar: { enabled: true, type: "bot" } },
        user: { avatar: { enabled: false } },
      },
      richCards: {
        enabled: true,
        allowLinks: true,
        allowImages: true,
        allowButtons: true,
      },
    },
    composer: {
      enabled: true,
      multiline: true,
      maxChars: 2000,
      enterToSend: true,
      attachments: {
        enabled: false,
        maxFiles: 3,
        maxSizeMb: 10,
        allowedMimeTypes: ["image/png", "image/jpeg", "application/pdf"],
      },
      voice: {
        enabled: false,
        mode: "push-to-talk",
        autoStopSilenceMs: 1200,
      },
      buttons: {
        showSend: true,
        showStop: true,
        showMic: false,
        showAttach: false,
      },
    },
    behavior: {
      defaultOpen: false,
      autoOpen: {
        enabled: false,
        delayMs: 2500,
        oncePerSession: true,
      },
      closeOnEsc: true,
      closeOnOutsideClick: true,
      focusTrap: true,
      persistConversation: {
        enabled: true,
        storage: "localStorage",
        key: "sr_widget_conversation_v1",
        ttlDays: 30,
      },
      rateLimit: { enabled: true, maxMessagesPerMinute: 20 },
    },
    handoff: {
      enabled: false,
      provider: "custom",
      rules: {
        onIntent: ["talk_to_human", "agent", "support"],
        onSentiment: { enabled: false, threshold: -0.6 },
        onKeyword: ["refund", "complaint"],
      },
      contact: {
        email: "support@yourdomain.com",
        whatsapp: "",
        phone: "",
      },
    },
    analytics: {
      enabled: false,
      ga4: {
        enabled: false,
        measurementId: "G-XXXXXXXXXX",
        debug: false,
      },
      clarity: {
        enabled: false,
        projectId: "XXXXXXXX",
      },
      events: {
        trackOpenClose: true,
        trackMessageSent: true,
        trackMessageReceived: true,
        trackErrors: true,
        trackHandoff: true,
      },
    },
    security: {
      allowedOrigins: ["*"],
      sanitize: { enabled: true, allowBasicHtml: false },
    },
    i18n: {
      enabled: true,
      defaultLocale: "en",
      supportedLocales: ["en", "hi"],
      strings: {
        en: {
          title: "Shiprocket Assistant",
          inputPlaceholder: "Type your message…",
          send: "Send",
          close: "Close",
          reset: "Reset",
        },
        hi: {
          title: "शिपरॉकेट असिस्टेंट",
          inputPlaceholder: "अपना संदेश लिखें…",
          send: "भेजें",
          close: "बंद करें",
          reset: "रीसेट",
        },
      },
    },
  },
};

const normalizeWidgetConfig = (
  incoming: WidgetConfig | null | undefined
): WidgetConfig => {
  if (!incoming || typeof incoming !== "object") return devConfig;
  const base = devConfig as any;
  const next = incoming as any;
  const baseWidget = base.widget || {};
  const nextWidget = next.widget || {};
  const baseComposer = baseWidget.composer || {};
  const nextComposer = nextWidget.composer || {};
  const baseTheme = baseWidget.theme || {};
  const nextTheme = nextWidget.theme || {};
  const baseLayouts = baseWidget.layouts || {};
  const nextLayouts = nextWidget.layouts || {};
  const baseBubble = baseLayouts.bubble || {};
  const nextBubble = nextLayouts.bubble || {};
  const baseDrawer = baseLayouts.drawer || {};
  const nextDrawer = nextLayouts.drawer || {};
  const baseFullscreen = baseLayouts.fullscreen || {};
  const nextFullscreen = nextLayouts.fullscreen || {};

  return {
    ...base,
    ...next,
    widget: {
      ...baseWidget,
      ...nextWidget,
      theme: {
        ...baseTheme,
        ...nextTheme,
        light: {
          ...(baseTheme.light || {}),
          ...(nextTheme.light || {}),
        },
        dark: {
          ...(baseTheme.dark || {}),
          ...(nextTheme.dark || {}),
        },
      },
      layouts: {
        ...baseLayouts,
        ...nextLayouts,
        bubble: {
          ...baseBubble,
          ...nextBubble,
          offset: {
            ...(baseBubble.offset || {}),
            ...(nextBubble.offset || {}),
          },
          launcher: {
            ...(baseBubble.launcher || {}),
            ...(nextBubble.launcher || {}),
          },
          panel: {
            ...(baseBubble.panel || {}),
            ...(nextBubble.panel || {}),
            backdrop: {
              ...(baseBubble.panel?.backdrop || {}),
              ...(nextBubble.panel?.backdrop || {}),
            },
          },
        },
        drawer: {
          ...baseDrawer,
          ...nextDrawer,
          backdrop: {
            ...(baseDrawer.backdrop || {}),
            ...(nextDrawer.backdrop || {}),
          },
          animation: {
            ...(baseDrawer.animation || {}),
            ...(nextDrawer.animation || {}),
          },
        },
        fullscreen: {
          ...baseFullscreen,
          ...nextFullscreen,
          backdrop: {
            ...(baseFullscreen.backdrop || {}),
            ...(nextFullscreen.backdrop || {}),
          },
        },
      },
      composer: {
        ...baseComposer,
        ...nextComposer,
        multiline: true,
      },
    },
  };
};

const SERVICE_FIELD_ERROR_MAP: Record<string, string> = {
  default_model: "defaultModel",
  backup_model: "backupModel",
  default_provider: "defaultProvider",
  backup_provider: "backupProvider",
  allowed_models: "allowedModels",
  temperature: "temperature",
  "limits.daily": "dailyLimit",
  "limits.monthly": "monthlyLimit",
  "service_alert_limit.daily": "dailyAlert",
  "service_alert_limit.monthly": "monthlyAlert",
};

const mapServiceValidationErrors = (errors: Record<string, unknown>) => {
  const next: Record<string, string> = {};
  Object.entries(errors).forEach(([rawKey, value]) => {
    const key = rawKey.replace(/^config\./, "");
    const message = Array.isArray(value)
      ? value.filter(Boolean).join(", ")
      : value
      ? String(value)
      : "";
    if (!message) return;
    const mappedKey = SERVICE_FIELD_ERROR_MAP[key] || SERVICE_FIELD_ERROR_MAP[rawKey] || key;
    next[mappedKey] = message;
  });
  return next;
};

type ServiceSetup = {
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

type ToolingConfig = {
  kb: {
    file: File | null;
    chunkingSize: number;
    overlappingSize: number;
    status: "idle" | "uploading" | "processing" | "ready" | "failed";
    collectionName: string;
    selection: "existing" | "new";
  };
  mcp: {
    url: string;
    status: "idle" | "checking" | "valid" | "invalid";
  };
};

type AgentNodeConfig = {
  name: string;
  systemPrompt: string;
  reviewerPrompt: string;
  maxSteps: number;
};

type AgentListItem = {
  id: string;
  name: string;
  raw: Record<string, unknown>;
};

type BuilderConfig = {
  service: ServiceSetup;
  tools: ToolingConfig;
  agent: AgentNodeConfig;
};

const defaultConfig: BuilderConfig = {
  service: {
    serviceId: "69313811f2214e98ad240396",
    defaultModel: "gpt-4o",
    backupModel: "gpt-4o-mini",
    defaultProvider: "openai",
    backupProvider: "openai",
    allowedModels: ["gpt-4o", "gpt-4o-mini"],
    temperature: 0.7,
    limits: {
      daily: 100,
      monthly: 300,
    },
    serviceAlertLimit: {
      daily: 80,
      monthly: 80,
    },
  },
  tools: {
    kb: {
      file: null,
      chunkingSize: 1000,
      overlappingSize: 200,
      status: "idle",
      collectionName: "",
      selection: "new",
    },
    mcp: {
      url: "",
      status: "idle",
    },
  },
  agent: {
    name: "",
    systemPrompt:
      "You are an AI agent that helps users with their queries. Use the available tools to provide accurate responses.",
    reviewerPrompt:
      "Review tool call suggestions and ensure they are appropriate for the user's query.",
    maxSteps: 12,
  },
};

const steps = ["Basics", "Tools", "Preview"];
const agentBuilderHelpTexts = {
  defaultModel:
    serviceSchemas["chat completion"]?.fields?.["config.default_model"]
      ?.helpText || "",
  backupModel:
    serviceSchemas["chat completion"]?.fields?.["config.backup_model"]
      ?.helpText || "",
  defaultProvider:
    serviceSchemas["chat completion"]?.fields?.["config.default_provider"]
      ?.helpText || "",
  backupProvider:
    serviceSchemas["chat completion"]?.fields?.["config.backup_provider"]
      ?.helpText || "",
  temperature:
    serviceSchemas["chat completion"]?.fields?.["config.temperature"]
      ?.helpText || "",
  dailyLimit:
    serviceSchemas["chat completion"]?.fields?.["limits.daily"]?.helpText || "",
  monthlyLimit:
    "Maximum cost per month for this service",
  dailyAlert:
    serviceSchemas["chat completion"]?.fields?.["alerts.daily"]?.helpText || "",
  monthlyAlert:
    serviceSchemas["chat completion"]?.fields?.["alerts.monthly"]?.helpText ||
    "",
};

export function AgentBuilderPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const selectedOrg = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );
  const projectOptions = selectedOrg?.projects || [];
  const projectsLoaded = selectedOrg !== null;

  const [projectId, setProjectId] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<BuilderConfig>(defaultConfig);
  const [previewConfig, setPreviewConfig] = useState<WidgetConfig>(devConfig);
  const [agentId, setAgentId] = useState("");
  const [models, setModels] = useState<ModelRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceFieldErrors, setServiceFieldErrors] = useState<
    Record<string, string>
  >({});
  const [kbLoading, setKbLoading] = useState(false);
  const [kbStatus, setKbStatus] = useState<KBStatusData | null>(null);
  const [kbSelectionTouched, setKbSelectionTouched] = useState(false);
  const [mcpChecking, setMcpChecking] = useState(false);
  const [agentSaving, setAgentSaving] = useState(false);
  const [previewSubmitting, setPreviewSubmitting] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [showListView, setShowListView] = useState(true);
  const [agentList, setAgentList] = useState<AgentListItem[]>([]);
  const [agentConfigLoading, setAgentConfigLoading] = useState(false);
  const loadedAgentConfigRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectOptions.length) {
      setProjectId("");
      return;
    }
    const exists = projectOptions.some((project) => project.id === projectId);
    if (!exists) {
      setProjectId(projectOptions[0].id);
    }
  }, [projectId, projectOptions]);

  useEffect(() => {
    if (!projectId) {
      setAgentConfigLoading(false);
      return;
    }
    setKbStatus(null);
    setKbSelectionTouched(false);
    setShowListView(true);
    setAgentList([]);
    setAgentConfigLoading(false);
    setActiveStep(0);
    setAgentId("");
    setPreviewConfig(devConfig);
    setConfig(defaultConfig);
    setServiceFieldErrors({});
  }, [projectId]);

  const applyAgentConfig = useCallback((payload: Record<string, unknown>) => {
    if (!payload || typeof payload !== "object") {
      setConfig(defaultConfig);
      setPreviewConfig(devConfig);
      setAgentId("");
      setKbStatus(null);
      return;
    }

    const nextAgentId =
      (payload as any)?.id ||
      (payload as any)?.agent_id ||
      (payload as any)?.agentId ||
      "";
    const nextAgentName =
      (payload as any)?.name || (payload as any)?.agent_name || "";
    const nextSystemPrompt =
      (payload as any)?.system_prompt || (payload as any)?.systemPrompt || "";
    const nextReviewerPrompt =
      (payload as any)?.reviewer_prompt ||
      (payload as any)?.reviewerPrompt ||
      "";
    const nextMaxSteps =
      (payload as any)?.max_steps || (payload as any)?.maxSteps || 0;
    const nextMcpUrl =
      (payload as any)?.mcp_url || (payload as any)?.mcpUrl || "";
    const nextKbCollection =
      (payload as any)?.kb_collection || (payload as any)?.kbCollection || "";
    const nextUiConfig =
      (payload as any)?.ui_config || (payload as any)?.uiConfig || null;

    setConfig((prev) => ({
      ...prev,
      agent: {
        ...prev.agent,
        name: nextAgentName || prev.agent.name,
        systemPrompt: nextSystemPrompt || prev.agent.systemPrompt,
        reviewerPrompt:
          nextReviewerPrompt !== ""
            ? nextReviewerPrompt
            : prev.agent.reviewerPrompt,
        maxSteps:
          Number(nextMaxSteps) > 0 ? Number(nextMaxSteps) : prev.agent.maxSteps,
      },
      tools: {
        ...prev.tools,
        kb: {
          ...prev.tools.kb,
          file: null,
          collectionName: nextKbCollection || prev.tools.kb.collectionName,
          selection: nextKbCollection ? "existing" : prev.tools.kb.selection,
          status: nextKbCollection ? "ready" : prev.tools.kb.status,
        },
        mcp: {
          ...prev.tools.mcp,
          url: nextMcpUrl || prev.tools.mcp.url,
          status: nextMcpUrl ? "valid" : prev.tools.mcp.status,
        },
      },
    }));

    if (nextKbCollection) {
      setKbStatus({
        file_name: "",
        chunking_size: 0,
        overlapping_size: 0,
        status: "completed",
        collection_name: nextKbCollection,
        chunks_created: null,
        csv_rows_processed: null,
        csv_columns: null,
        jsonl_path: null,
        error: null,
      });
    } else {
      setKbStatus(null);
    }

    if (nextUiConfig) {
      setPreviewConfig(normalizeWidgetConfig(nextUiConfig));
    } else {
      setPreviewConfig(devConfig);
    }

    if (nextAgentId) {
      setAgentId(nextAgentId);
    } else {
      setAgentId("");
    }
  }, []);

  const buildAgentList = useCallback((payload: unknown) => {
    if (!payload || typeof payload !== "object") return [] as AgentListItem[];
    const items = Array.isArray(payload) ? payload : [payload];
    return items
      .map((item) => {
        const id =
          (item as any)?.id ||
          (item as any)?.agent_id ||
          (item as any)?.agentId ||
          "";
        const name =
          (item as any)?.name || (item as any)?.agent_name || "Untitled agent";
        if (!id && !name) return null;
        return {
          id: String(id),
          name: String(name),
          raw: item as Record<string, unknown>,
        };
      })
      .filter(Boolean) as AgentListItem[];
  }, []);

  useEffect(() => {
    if (!projectId || loadedAgentConfigRef.current === projectId) return;
    let isActive = true;

    const loadAgentConfig = async () => {
      setAgentConfigLoading(true);
      setShowListView(true);
      try {
        const res = await agentBuilderService.getAgentConfig(projectId);
        if (!isActive) return;
        const errorPayload = (res as any)?.error;
        if (errorPayload) {
          const errorStatus = errorPayload?.status;
          const errorMessage =
            errorPayload?.payload?.message ||
            errorPayload?.payload?.detail ||
            errorPayload?.payload?.error ||
            "";
          const notFound =
            errorStatus === 404 || /not found/i.test(String(errorMessage));
          if (notFound) {
            setConfig(defaultConfig);
            setPreviewConfig(devConfig);
            setAgentId("");
            setKbStatus(null);
            setAgentList([]);
            setShowListView(true);
            loadedAgentConfigRef.current = projectId;
            return;
          }
          enqueueSnackbar("Unable to load agent config", { variant: "error" });
          return;
        }

        const payload = (res as any)?.data ?? (res as any)?.config ?? res;
        const list = buildAgentList(payload);
        if (!list.length) {
          setConfig(defaultConfig);
          setPreviewConfig(devConfig);
          setAgentId("");
          setKbStatus(null);
          setAgentList([]);
          setShowListView(true);
          loadedAgentConfigRef.current = projectId;
          return;
        }

        setAgentList(list);
        setShowListView(true);
        applyAgentConfig(list[0].raw);
        loadedAgentConfigRef.current = projectId;
      } catch (error) {
        if (!isActive) return;
        enqueueSnackbar("Unable to load agent config", { variant: "error" });
      } finally {
        if (isActive) {
          setAgentConfigLoading(false);
        }
      }
    };

    loadAgentConfig();

    return () => {
      isActive = false;
    };
  }, [applyAgentConfig, buildAgentList, enqueueSnackbar, projectId]);

  useEffect(() => {
    let isActive = true;

    const loadModels = async () => {
      setModelsLoading(true);
      setModelsError(null);
      try {
        const res = await serviceManagementService.getAllModels();
       
          if (!isActive) return;
          if (res?.success) {
              const allowedModels = res.data?.filter((model: ModelRow) => {
                return model.allowed_services.includes("Agent Builder");
              })
            setModels(allowedModels || []);
          } else {
            setModels([]);
            setModelsError("Unable to load models");
          }
      } catch (error) {
        if (!isActive) return;
        setModels([]);
        setModelsError("Unable to load models");
      } finally {
        if (isActive) setModelsLoading(false);
      }
    };

    const loadProviders = async () => {
      setProvidersLoading(true);
      setProvidersError(null);
      try {
        const res = await serviceManagementService.getAllProviders();
        if (!isActive) return;
        if (res?.success) {
          setProviders(res.data || []);
        } else {
          setProviders([]);
          setProvidersError("Unable to load providers");
        }
      } catch (error) {
        if (!isActive) return;
        setProviders([]);
        setProvidersError("Unable to load providers");
      } finally {
        if (isActive) setProvidersLoading(false);
      }
    };

    loadModels();
    loadProviders();
    return () => {
      isActive = false;
    };
  }, [widgetScriptUrl]);

  const updateConfig = (updater: (prev: BuilderConfig) => BuilderConfig) => {
    setConfig((prev) => updater(prev));
  };

  const clearServiceFieldError = useCallback((fieldKey: string) => {
    setServiceFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  const refreshKbStatus = async () => {
    if (!projectId) return;
    setKbLoading(true);
    try {
      const res = await kbService.getKbStatus(projectId);
      if (res?.data) {
        setKbStatus(res.data);
        updateConfig((prev) => ({
          ...prev,
          tools: {
            ...prev.tools,
            kb: {
              ...prev.tools.kb,
              status:
                res?.data?.status === "completed"
                  ? "ready"
                  : res?.data?.status === "failed"
                  ? "failed"
                  : res?.data?.status === "pending" ||
                    res?.data?.status === "started"
                  ? "processing"
                  : "processing",
              collectionName:
                prev.tools.kb.selection === "new" &&
                prev.tools.kb.status !== "idle"
                  ? res?.data?.collection_name || prev.tools.kb.collectionName
                  : prev.tools.kb.collectionName,
              selection:
                res?.data?.collection_name && !kbSelectionTouched
                  ? "existing"
                  : prev.tools.kb.selection,
            },
          },
        }));
      }
    } catch (error) {
      enqueueSnackbar("Unable to fetch KB status", { variant: "error" });
    } finally {
      setKbLoading(false);
    }
  };

  useEffect(() => {
    if (activeStep !== 1 || !projectId) return;
    refreshKbStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, projectId]);

  const handleUploadKb = async () => {
    if (!projectId) {
      enqueueSnackbar("Select a project first", { variant: "warning" });
      return;
    }
    if (!config.tools.kb.file) {
      enqueueSnackbar("Select a file to upload", { variant: "warning" });
      return;
    }
    setKbLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", config.tools.kb.file);
      formData.append("project_id", projectId);
      formData.append("chunking_size", String(config.tools.kb.chunkingSize));
      formData.append(
        "overlapping_size",
        String(config.tools.kb.overlappingSize)
      );

      const res = await kbService.initKnowledgebase(formData);
      if ((res as any)?.error) {
        enqueueSnackbar("KB upload failed", { variant: "error" });
      } else {
        enqueueSnackbar("KB upload started", { variant: "success" });
        updateConfig((prev) => ({
          ...prev,
          tools: {
            ...prev.tools,
            kb: {
              ...prev.tools.kb,
              status: "processing",
            },
          },
        }));
        await refreshKbStatus();
      }
    } catch (error) {
      enqueueSnackbar("KB upload failed", { variant: "error" });
    } finally {
      setKbLoading(false);
    }
  };

  const handleKbSelectionChange = (
    selection: ToolingConfig["kb"]["selection"]
  ) => {
    setKbSelectionTouched(true);
    updateConfig((prev) => ({
      ...prev,
      tools: {
        ...prev.tools,
        kb: {
          ...prev.tools.kb,
          selection,
          collectionName:
            selection === "new" ? "" : prev.tools.kb.collectionName,
          status: selection === "new" ? "idle" : prev.tools.kb.status,
        },
      },
    }));
  };

  const handleCheckMcp = async () => {
    if (!config.tools.mcp.url.trim()) {
      enqueueSnackbar("Add a MCP URL to check", { variant: "warning" });
      return false;
    }
    setMcpChecking(true);
    updateConfig((prev) => ({
      ...prev,
      tools: {
        ...prev.tools,
        mcp: { ...prev.tools.mcp, status: "checking" },
      },
    }));
    try {
      const res = await agentBuilderService.checkMcpStatus({
        url: config.tools.mcp.url.trim(),
      });
      const ok = Boolean((res as any)?.success) || !(res as any)?.error;
      updateConfig((prev) => ({
        ...prev,
        tools: {
          ...prev.tools,
          mcp: {
            ...prev.tools.mcp,
            status: ok ? "valid" : "invalid",
          },
        },
      }));
      enqueueSnackbar(ok ? "MCP connection looks good" : "MCP check failed", {
        variant: ok ? "success" : "error",
      });
      return !!ok ;
    } catch (error) {
      updateConfig((prev) => ({
        ...prev,
        tools: {
          ...prev.tools,
          mcp: {
            ...prev.tools.mcp,
            status: "invalid",
          },
        },
      }));
      enqueueSnackbar("MCP check failed", { variant: "error" });
      return false;
    } finally {
      setMcpChecking(false);
    }
  };

  const existingKbCollection = kbStatus?.collection_name || "";
  const selectedKbCollection =
    config.tools.kb.selection === "existing"
      ? existingKbCollection
      : config.tools.kb.collectionName;
  const hasKbCollection = Boolean(selectedKbCollection);
  const hasValidMcp = config.tools.mcp.status === "valid";

  const submitServiceSetup = async (showToast = true) => {
    if (!projectId) {
      if (showToast) {
        enqueueSnackbar("Select a project first", { variant: "warning" });
      }
      return false;
    }
    setServiceSaving(true);
    setServiceFieldErrors({});
    try {
      const payload = {
        service_id: config.service.serviceId,
        config: {
          default_model: config.service.defaultModel,
          backup_model: config.service.backupModel,
          default_provider: config.service.defaultProvider,
          backup_provider: config.service.backupProvider,
          allowed_models: config.service.allowedModels,
          temperature: config.service.temperature,
        },
        limits: {
          daily: config.service.limits.daily,
          monthly: config.service.limits.monthly,
        },
        service_alert_limit: {
          daily: config.service.serviceAlertLimit.daily,
          monthly: config.service.serviceAlertLimit.monthly,
        },
        enabled: true,
      };

      const res = await agentBuilderService.addProjectService(
        projectId,
        payload
      );
      const errorPayload =
        (res as any)?.error?.payload ??
        (res as any)?.error ??
        (res as any)?.payload ??
        null;
      const validationErrors =
        (res as any)?.errors || errorPayload?.errors || null;
      if (validationErrors && typeof validationErrors === "object") {
        const mapped = mapServiceValidationErrors(
          validationErrors as Record<string, unknown>
        );
        if (Object.keys(mapped).length) {
          setServiceFieldErrors(mapped);
        }
      }
      const ok = Boolean((res as any)?.success) || !(res as any)?.error;
      if (showToast) {
        enqueueSnackbar(ok ? "Service config saved" : "Service config failed", {
          variant: ok ? "success" : "error",
        });
      }
      return ok;
    } catch (error) {
      if (showToast) {
        enqueueSnackbar("Service config failed", { variant: "error" });
      }
      return false;
    } finally {
      setServiceSaving(false);
    }
  };

  const submitAgentSetup = async (includeTools: boolean, showToast = true) => {
    if (!projectId) {
      if (showToast) {
        enqueueSnackbar("Select a project first", { variant: "warning" });
      }
      return false;
    }
    if (includeTools && hasValidMcp === false && hasKbCollection === false) {
      if (showToast) {
        enqueueSnackbar(
          "Add MCP or Knowledge Base before setting up the agent",
          {
            variant: "warning",
          }
        );
        return false;
      }
      return false;
    }

    const payload: any = buildAgentSetupPayload({
      includeUiConfig: false,
      includeTools,
      includeGraphJson: includeTools,
    });

    setAgentSaving(true);
    try {
      const res = await agentBuilderService.setupAgent(payload as any);
      const ok = Boolean((res as any)?.success) || !(res as any)?.error;
      const returnedAgentId =
        (res as any)?.data?.id ||
        (res as any)?.data?.agent_id ||
        (res as any)?.data?.agentId ||
        (res as any)?.id ||
        (res as any)?.agent_id ||
        (res as any)?.agentId ||
        "";
      if (returnedAgentId) {
        setAgentId(returnedAgentId);
      }
      if (showToast) {
        enqueueSnackbar(ok ? "Tool setup saved" : "Tool setup failed", {
          variant: ok ? "success" : "error",
        });
      }
      return ok;
    } catch (error) {
      if (showToast) {
        enqueueSnackbar("Tool setup failed", { variant: "error" });
      }
      return false;
    } finally {
      setAgentSaving(false);
    }
  };

  const buildAgentSetupPayload = ({
    includeUiConfig,
    includeTools,
    includeGraphJson = includeTools,
  }: {
    includeUiConfig: boolean;
    includeTools: boolean;
    includeGraphJson?: boolean;
  }) => {
    const payload: Record<string, unknown> = {
      project_id: projectId,
      name: config.agent.name,
      system_prompt: config.agent.systemPrompt,
      max_steps: config.agent.maxSteps,
    };

    if (includeGraphJson) {
      const graphJson = {
        nodes: [{ id: "agent", type: "agent", config: {} }],
        edges: [] as Array<{ from: string; to: string }>,
        entry_point: "agent",
        state_schema: {},
      };

      if (includeTools && hasValidMcp) {
        graphJson.nodes.push({ id: "tool", type: "tool", config: {} });
        graphJson.edges.push({ from: "agent", to: "tool" });
      }

      payload.graph_json = graphJson;
    }
    if (includeTools && hasValidMcp) {
      payload.mcp_url = config.tools.mcp.url.trim();
    }
    if (includeTools && hasKbCollection) {
      payload.kb_collection = selectedKbCollection;
    }
    if (includeUiConfig) {
      payload.ui_config = previewConfig;
    }

    return payload;
  };

  const submitPreviewConfig = async () => {
    if (!projectId) {
      enqueueSnackbar("Select a project first", { variant: "warning" });
      return;
    }
    setPreviewSubmitting(true);
    try {
      const payload = buildAgentSetupPayload({
        includeUiConfig: true,
        includeTools: true,
        includeGraphJson: true,
      });
      const res = await agentBuilderService.setupAgent(payload as any);
      const ok = Boolean((res as any)?.success) || !(res as any)?.error;
      const returnedAgentId =
        (res as any)?.data?.id ||
        (res as any)?.data?.agent_id ||
        (res as any)?.data?.agentId ||
        (res as any)?.id ||
        (res as any)?.agent_id ||
        (res as any)?.agentId ||
        "";
      if (returnedAgentId) {
        setAgentId(returnedAgentId);
      }
      if (ok) {
        const nextAgentId = returnedAgentId || agentId;
        if (nextAgentId) {
          const agentRaw = {
            id: nextAgentId,
            name: config.agent.name,
            system_prompt: config.agent.systemPrompt,
            reviewer_prompt: config.agent.reviewerPrompt,
            max_steps: config.agent.maxSteps,
            mcp_url: hasValidMcp ? config.tools.mcp.url.trim() : "",
            kb_collection: hasKbCollection ? selectedKbCollection : "",
            ui_config: previewConfig,
          };
          setAgentList((prev) => {
            const existingIndex = prev.findIndex(
              (item) => item.id === String(nextAgentId)
            );
            const nextItem = {
              id: String(nextAgentId),
              name: config.agent.name || "Agent",
              raw: agentRaw,
            };
            if (existingIndex >= 0) {
              const nextList = [...prev];
              nextList[existingIndex] = nextItem;
              return nextList;
            }
            return [...prev, nextItem];
          });
        }
      }
      enqueueSnackbar(
        ok ? "Preview config saved" : "Preview config save failed",
        {
          variant: ok ? "success" : "error",
        }
      );
      if (ok) {
        setDeployModalOpen(true);
      }
    } catch (error) {
      enqueueSnackbar("Preview config save failed", { variant: "error" });
    } finally {
      setPreviewSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      const ok = await submitServiceSetup(false);
      if (!ok) {
        enqueueSnackbar("Agent settings failed", { variant: "error" });
        return;
      }
      const agentOk = await submitAgentSetup(false, false);
      if (!agentOk) {
        enqueueSnackbar("Agent settings failed", { variant: "error" });
        return;
      }
      enqueueSnackbar("Agent settings saved", { variant: "success" });
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }
    if (activeStep === 1) {
      if (config.tools.mcp.url.trim()) {
        const ok = await handleCheckMcp();
        if (!ok) return;
      }
      if (!hasKbCollection && !hasValidMcp) {
        enqueueSnackbar("Add MCP or Knowledge Base to continue", {
          variant: "warning",
        });
        return;
      }
      const ok = await submitAgentSetup(true);
      if (!ok) return;
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }
    if (activeStep === 2) {
      await submitPreviewConfig();
    }
  };

  const stepIsValid = (stepIndex: number) => {
    if (stepIndex === 0) {
      return Boolean(
        projectId &&
          config.service.serviceId.trim() &&
          config.agent.name.trim() &&
          config.agent.systemPrompt.trim() &&
          config.agent.maxSteps > 0
      );
    }
    if (stepIndex === 1) {
      return hasKbCollection || Boolean(config.tools.mcp.url.trim());
    }
    return true;
  };

  const isLastStep = activeStep === steps.length - 1;
  const stepBusy =
    serviceSaving ||
    agentSaving ||
    previewSubmitting ||
    (activeStep === 1 && (kbLoading || mcpChecking));
  const isLoading = !projectsLoaded || agentConfigLoading;
  const deployedAgentId = agentId;
  const deploymentSnippet = useMemo(
    () => buildIntegrationSnippet(deployedAgentId),
    [deployedAgentId]
  );

  const handleCopyDeploySnippet = async () => {
    try {
      await navigator.clipboard.writeText(deploymentSnippet);
      enqueueSnackbar("Widget code copied", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Unable to copy widget code", { variant: "error" });
    }
  };

  const handleCloseDeployModal = () => {
    setDeployModalOpen(false);
    setActiveStep(0);
    setShowListView(true);
  };

  const handleEditAgent = (agent: AgentListItem) => {
    applyAgentConfig(agent.raw);
    setShowListView(false);
    setActiveStep(0);
  };

  const handleCreateAgent = () => {
    setConfig(defaultConfig);
    setPreviewConfig(devConfig);
    setAgentId("");
    setKbStatus(null);
    setServiceFieldErrors({});
    setShowListView(false);
    setActiveStep(0);
  };

  return (
    <>
      <DashboardContent maxWidth="xl">
        <Card
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            boxShadow: theme.customShadows?.z24,
            overflow: "visible",
          }}
        >
          <Stack spacing={3}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  Agent Builder
                </Typography>
                <Typography color="text.secondary">
                  Configure services, tools, and your agent graph in a few
                  steps.
                </Typography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="project-select-label">Project</InputLabel>
                  <Select
                    labelId="project-select-label"
                    label="Project"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value as string)}
                  >
                    {projectOptions.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            {!projectOptions.length && projectsLoaded && (
              <Alert severity="warning">
                Select an organization with at least one project to continue.
              </Alert>
            )}

            {showListView ? (
              <Card sx={{ p: 2.5, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Stack spacing={1.5}>
                    {isLoading ? (
                      <>
                        <Skeleton variant="rounded" height={72} />
                        <Skeleton variant="rounded" height={72} />
                      </>
                    ) : agentList.length === 0 ? (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px dashed ${alpha(
                            theme.palette.divider,
                            0.4
                          )}`,
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          justifyContent="space-between"
                        >
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle1">
                              No agent found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Start creating the agent to continue.
                            </Typography>
                          </Stack>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleCreateAgent}
                          >
                            Create agent
                          </Button>
                        </Stack>
                      </Box>
                    ) : (
                      agentList.map((agent, index) => (
                        <Box
                          key={agent.id || `${agent.name}-${index}`}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${alpha(
                              theme.palette.divider,
                              0.3
                            )}`,
                          }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            justifyContent="space-between"
                          >
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle1">
                                {agent.name}
                              </Typography>
                              {agent.id && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  ID: {agent.id}
                                </Typography>
                              )}
                            </Stack>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleEditAgent(agent)}
                            >
                              Edit
                            </Button>
                          </Stack>
                        </Box>
                      ))
                    )}
                  </Stack>
                </Stack>
              </Card>
            ) : (
              <>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label, index) => (
                    <Step key={label} completed={activeStep > index}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <Box>
                  {activeStep === 0 && (
                    <Stack spacing={2.5}>
                      <AgentNodeStep
                        config={config}
                        onChange={updateConfig}
                        hasKbCollection={hasKbCollection}
                        hasValidMcp={hasValidMcp}
                      />
                      <ServiceStep
                        config={config}
                        onChange={updateConfig}
                        projectId={projectId}
                        serviceSaving={serviceSaving}
                        models={models}
                        providers={providers}
                        modelsLoading={modelsLoading}
                        providersLoading={providersLoading}
                        modelsError={modelsError}
                        providersError={providersError}
                        fieldErrors={serviceFieldErrors}
                        onClearFieldError={clearServiceFieldError}
                      />
                    </Stack>
                  )}
                  {activeStep === 1 && (
                    <ToolsStep
                      config={config}
                      onChange={updateConfig}
                      kbStatus={kbStatus}
                      kbLoading={kbLoading}
                      existingKbCollection={existingKbCollection}
                      onSelectKb={handleKbSelectionChange}
                      onUploadKb={handleUploadKb}
                      onCheckKb={refreshKbStatus}
                      onCheckMcp={handleCheckMcp}
                      mcpChecking={mcpChecking}
                    />
                  )}
                  {activeStep === 2 && (
                    <PreviewStep
                      config={previewConfig}
                      onChange={setPreviewConfig}
                      agentId={agentId}
                      hasKbCollection={hasKbCollection}
                      hasValidMcp={hasValidMcp}
                    />
                  )}
                </Box>

                <Divider
                  sx={{ borderColor: alpha(theme.palette.divider, 0.3) }}
                />

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <Button
                    startIcon={<KeyboardArrowLeftIcon />}
                    variant="text"
                    onClick={() =>
                      setActiveStep((prev) => Math.max(0, prev - 1))
                    }
                    disabled={activeStep === 0}
                  >
                    Back
                  </Button>
                  <Button
                    endIcon={
                      isLastStep ? (
                        <RocketLaunchIcon />
                      ) : (
                        <KeyboardArrowRightIcon />
                      )
                    }
                    variant="contained"
                    onClick={handleNext}
                    disabled={!stepIsValid(activeStep) || stepBusy}
                  >
                    {isLastStep
                      ? previewSubmitting
                        ? "Submitting..."
                        : "Submit Widget Config"
                      : stepBusy
                      ? "Working..."
                      : "Next"}
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </Card>
      </DashboardContent>
      <Dialog
        open={deployModalOpen}
        onClose={handleCloseDeployModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agent deployed</DialogTitle>
        <DialogContent dividers sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="body1">
                Your agent has been deployed successfully.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can come back here again to edit the agent.
              </Typography>
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="subtitle2">Widget code</Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyDeploySnippet}
              >
                Copy code
              </Button>
            </Stack>
            <TextField
              value={deploymentSnippet}
              multiline
              minRows={6}
              fullWidth
              InputProps={{ readOnly: true, sx: { fontFamily: "monospace" } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeployModal} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

type ServiceStepProps = {
  config: BuilderConfig;
  onChange: (updater: (prev: BuilderConfig) => BuilderConfig) => void;
  projectId: string;
  serviceSaving: boolean;
  models: ModelRow[];
  providers: ProviderRow[];
  modelsLoading: boolean;
  providersLoading: boolean;
  modelsError: string | null;
  providersError: string | null;
  fieldErrors: Record<string, string>;
  onClearFieldError: (fieldKey: string) => void;
};

function LabelWithHelp({
  label,
  helpText,
}: {
  label: string;
  helpText?: string;
}) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      <span>{label}</span>
      {helpText ? (
        <Tooltip title={helpText} arrow>
          <IconButton
            size="small"
            sx={{ p: 0, ml: 0.25 }}
            aria-label={`${label} info`}
          >
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}

function ServiceStep({
  config,
  onChange,
  projectId,
  serviceSaving,
  models,
  providers,
  modelsLoading,
  providersLoading,
  modelsError,
  providersError,
  fieldErrors,
  onClearFieldError,
}: ServiceStepProps) {
  const modelOptions = models.filter((model) => {
    const isAgentBuilder = /agent builder/i.test(model.name);
    return model.status === "active" && !isAgentBuilder;
  });
  const providerOptions = providers.filter(
    (provider) => provider.status === "active"
  );
  const defaultProviderError = fieldErrors.defaultProvider || "";
  const defaultModelError = fieldErrors.defaultModel || "";
  const backupProviderError = fieldErrors.backupProvider || "";
  const backupModelError = fieldErrors.backupModel || "";
  const temperatureError = fieldErrors.temperature || "";
  const dailyLimitError = fieldErrors.dailyLimit || "";
  const monthlyLimitError = fieldErrors.monthlyLimit || "";
  const dailyAlertError = fieldErrors.dailyAlert || "";
  const monthlyAlertError = fieldErrors.monthlyAlert || "";
  const defaultModelOptions = config.service.defaultProvider
    ? modelOptions.filter(
        (model) => model.provider === config.service.defaultProvider
      )
    : modelOptions;
  const backupModelOptions = config.service.backupProvider
    ? modelOptions.filter(
        (model) => model.provider === config.service.backupProvider
      )
    : modelOptions;

  const handleDefaultProviderChange = (nextProvider: string) => {
    onChange((prev) => {
      const currentModel = prev.service.defaultModel;
      const currentProvider = modelOptions.find(
        (model) => model.name === currentModel
      )?.provider;
      const nextModel = modelOptions.find(
        (model) => model.provider === nextProvider
      )?.name;
      return {
        ...prev,
        service: {
          ...prev.service,
          defaultProvider: nextProvider,
          defaultModel:
            !currentModel || currentProvider !== nextProvider
              ? nextModel || ""
              : currentModel,
        },
      };
    });
  };

  const handleBackupProviderChange = (nextProvider: string) => {
    onChange((prev) => {
      const currentModel = prev.service.backupModel;
      const currentProvider = modelOptions.find(
        (model) => model.name === currentModel
      )?.provider;
      const nextModel = modelOptions.find(
        (model) => model.provider === nextProvider
      )?.name;
      return {
        ...prev,
        service: {
          ...prev.service,
          backupProvider: nextProvider,
          backupModel:
            !currentModel || currentProvider !== nextProvider
              ? nextModel || ""
              : currentModel,
        },
      };
    });
  };

  useEffect(() => {
    if (!modelOptions.length) return;
    const defaultModel = modelOptions.find(
      (model) => model.name === config.service.defaultModel
    );
    if (defaultModel && !config.service.defaultProvider) {
      onChange((prev) => ({
        ...prev,
        service: { ...prev.service, defaultProvider: defaultModel.provider },
      }));
    }
    const backupModel = modelOptions.find(
      (model) => model.name === config.service.backupModel
    );
    if (backupModel && !config.service.backupProvider) {
      onChange((prev) => ({
        ...prev,
        service: { ...prev.service, backupProvider: backupModel.provider },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modelOptions,
    config.service.defaultModel,
    config.service.backupModel,
    config.service.defaultProvider,
    config.service.backupProvider,
  ]);

  return (
    <Card sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack spacing={2.5}>

        {!projectId && (
          <Alert severity="warning">Select a project to continue.</Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(defaultProviderError)}>
              <InputLabel id="default-provider-label">
                <LabelWithHelp
                  label="Default provider"
                  helpText={agentBuilderHelpTexts.defaultProvider}
                />
              </InputLabel>
              <Select
                labelId="default-provider-label"
                label="Default provider"
                value={config.service.defaultProvider}
                onChange={(e) => {
                  onClearFieldError("defaultProvider");
                  onClearFieldError("defaultModel");
                  handleDefaultProviderChange(e.target.value as string);
                }}
                disabled={providersLoading || !providerOptions.length}
              >
                {providerOptions.map((provider) => (
                  <MenuItem key={provider.id} value={provider.name}>
                    {provider.name}
                  </MenuItem>
                ))}
              </Select>
              {defaultProviderError ? (
                <FormHelperText>{defaultProviderError}</FormHelperText>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(defaultModelError)}>
              <InputLabel id="default-model-label">
                <LabelWithHelp
                  label="Default model"
                  helpText={agentBuilderHelpTexts.defaultModel}
                />
              </InputLabel>
              <Select
                labelId="default-model-label"
                label="Default model"
                value={config.service.defaultModel}
                onChange={(e) => {
                  onClearFieldError("defaultModel");
                  onChange((prev) => ({
                    ...prev,
                    service: {
                      ...prev.service,
                      defaultModel: e.target.value as string,
                    },
                  }));
                }}
                disabled={modelsLoading || !defaultModelOptions.length}
              >
                {defaultModelOptions.map((model) => (
                  <MenuItem key={model.id} value={model.name}>
                    {model.name}
                  </MenuItem>
                ))}
              </Select>
              {defaultModelError ? (
                <FormHelperText>{defaultModelError}</FormHelperText>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(backupProviderError)}>
              <InputLabel id="backup-provider-label">
                <LabelWithHelp
                  label="Fallback provider"
                  helpText={agentBuilderHelpTexts.backupProvider}
                />
              </InputLabel>
              <Select
                labelId="backup-provider-label"
                label="Fallback provider"
                value={config.service.backupProvider}
                onChange={(e) => {
                  onClearFieldError("backupProvider");
                  onClearFieldError("backupModel");
                  handleBackupProviderChange(e.target.value as string);
                }}
                disabled={providersLoading || !providerOptions.length}
              >
                {providerOptions.map((provider) => (
                  <MenuItem key={provider.id} value={provider.name}>
                    {provider.name}
                  </MenuItem>
                ))}
              </Select>
              {backupProviderError ? (
                <FormHelperText>{backupProviderError}</FormHelperText>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(backupModelError)}>
              <InputLabel id="backup-model-label">
                <LabelWithHelp
                  label="Fallback model"
                  helpText={agentBuilderHelpTexts.backupModel}
                />
              </InputLabel>
              <Select
                labelId="backup-model-label"
                label="Fallback model"
                value={config.service.backupModel}
                onChange={(e) => {
                  onClearFieldError("backupModel");
                  onChange((prev) => ({
                    ...prev,
                    service: {
                      ...prev.service,
                      backupModel: e.target.value as string,
                    },
                  }));
                }}
                disabled={modelsLoading || !backupModelOptions.length}
              >
                {backupModelOptions.map((model) => (
                  <MenuItem key={model.id} value={model.name}>
                    {model.name}
                  </MenuItem>
                ))}
              </Select>
              {backupModelError ? (
                <FormHelperText>{backupModelError}</FormHelperText>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={12}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" component="div">
                <LabelWithHelp
                  label="Temperature"
                  helpText={agentBuilderHelpTexts.temperature}
                />
              </Typography>
              <Slider
                value={config.service.temperature}
                min={0}
                max={1}
                step={0.05}
                color={temperatureError ? "error" : "primary"}
                onChange={(_, value) => {
                  onClearFieldError("temperature");
                  onChange((prev) => ({
                    ...prev,
                    service: { ...prev.service, temperature: value as number },
                  }));
                }}
                valueLabelDisplay="auto"
              />
              {temperatureError ? (
                <Typography variant="caption" color="error">
                  {temperatureError}
                </Typography>
              ) : null}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Limits</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={
                      <LabelWithHelp
                        label="Daily limit (in $)"
                        helpText={agentBuilderHelpTexts.dailyLimit}
                      />
                    }
                    type="number"
                    value={config.service.limits.daily}
                    onChange={(e) => {
                      onClearFieldError("dailyLimit");
                      onChange((prev) => ({
                        ...prev,
                        service: {
                          ...prev.service,
                          limits: {
                            ...prev.service.limits,
                            daily: Number(e.target.value),
                          },
                        },
                      }));
                    }}
                    error={Boolean(dailyLimitError)}
                    helperText={dailyLimitError}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={
                      <LabelWithHelp
                        label="Monthly limit (in $)"
                        helpText={agentBuilderHelpTexts.monthlyLimit}
                      />
                    }
                    type="number"
                    value={config.service.limits.monthly}
                    onChange={(e) => {
                      onClearFieldError("monthlyLimit");
                      onChange((prev) => ({
                        ...prev,
                        service: {
                          ...prev.service,
                          limits: {
                            ...prev.service.limits,
                            monthly: Number(e.target.value),
                          },
                        },
                      }));
                    }}
                    error={Boolean(monthlyLimitError)}
                    helperText={monthlyLimitError}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Alert limits</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={
                      <LabelWithHelp
                        label="Daily alert limit (in %)"
                        helpText={agentBuilderHelpTexts.dailyAlert}
                      />
                    }
                    type="number"
                    value={config.service.serviceAlertLimit.daily}
                    onChange={(e) => {
                      onClearFieldError("dailyAlert");
                      onChange((prev) => ({
                        ...prev,
                        service: {
                          ...prev.service,
                          serviceAlertLimit: {
                            ...prev.service.serviceAlertLimit,
                            daily: Number(e.target.value),
                          },
                        },
                      }));
                    }}
                    error={Boolean(dailyAlertError)}
                    helperText={dailyAlertError}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={
                      <LabelWithHelp
                        label="Monthly alert limit (in %)"
                        helpText={agentBuilderHelpTexts.monthlyAlert}
                      />
                    }
                    type="number"
                    value={config.service.serviceAlertLimit.monthly}
                    onChange={(e) => {
                      onClearFieldError("monthlyAlert");
                      onChange((prev) => ({
                        ...prev,
                        service: {
                          ...prev.service,
                          serviceAlertLimit: {
                            ...prev.service.serviceAlertLimit,
                            monthly: Number(e.target.value),
                          },
                        },
                      }));
                    }}
                    error={Boolean(monthlyAlertError)}
                    helperText={monthlyAlertError}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Stack>
          </Grid>
        </Grid>

        {serviceSaving && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Saving service configuration...
            </Typography>
          </Stack>
        )}

        {(modelsLoading || providersLoading) && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Loading models and providers...
            </Typography>
          </Stack>
        )}

        {modelsError && <Alert severity="error">{modelsError}</Alert>}
        {providersError && <Alert severity="error">{providersError}</Alert>}

        {!modelsLoading && !modelOptions.length && (
          <Alert severity="warning">No active models available.</Alert>
        )}

        {!providersLoading && !providerOptions.length && (
          <Alert severity="warning">No active providers available.</Alert>
        )}
      </Stack>
    </Card>
  );
}

type ToolsStepProps = {
  config: BuilderConfig;
  onChange: (updater: (prev: BuilderConfig) => BuilderConfig) => void;
  kbStatus: KBStatusData | null;
  kbLoading: boolean;
  existingKbCollection: string;
  onSelectKb: (selection: ToolingConfig["kb"]["selection"]) => void;
  onUploadKb: () => void;
  onCheckKb: () => void;
  onCheckMcp: () => void;
  mcpChecking: boolean;
};

function ToolsStep({
  config,
  onChange,
  kbStatus,
  kbLoading,
  existingKbCollection,
  onSelectKb,
  onUploadKb,
  onCheckKb,
  onCheckMcp,
  mcpChecking,
}: ToolsStepProps) {
  const theme = useTheme();

  const kbStatusLabel = kbStatus?.status || "unknown";
  const kbChipColor =
    config.tools.kb.status === "ready"
      ? "success"
      : config.tools.kb.status === "failed"
      ? "error"
      : "default";
  const hasExistingKb = Boolean(existingKbCollection);
  const kbSelection = hasExistingKb ? "existing" : "new";
  const showKbStatusCheck =
    config.tools.kb.status !== "idle" &&
    config.tools.kb.status !== "ready" &&
    kbStatus?.status !== "completed";

  return (
    <Stack spacing={2.5}>
      <Card sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <UploadFileIcon color="primary" />
            <Typography variant="h6">Knowledge Base</Typography>
            {config.tools.kb.status !== "idle" && (
              <Chip
                label={config.tools.kb.status}
                color={kbChipColor}
                size="small"
              />
            )}
          </Stack>

          {kbSelection === "existing" && (
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: alpha(theme.palette.info.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">
                    Status: {kbStatusLabel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Collection: {existingKbCollection || "Pending"}
                  </Typography>
                </Stack>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  onClick={onCheckKb}
                  disabled={kbLoading}
                >
                  Refresh status
                </Button>
                {kbLoading && <CircularProgress size={20} />}
              </Stack>
            </Stack>
          )}

          {kbSelection === "new" && (
            <Stack spacing={2}>
              <PaperInput
                label="Upload CSV"
                file={config.tools.kb.file}
                accept=".csv,text/csv"
                onSelect={(file) =>
                  onChange((prev) => ({
                    ...prev,
                    tools: {
                      ...prev.tools,
                      kb: { ...prev.tools.kb, file },
                    },
                  }))
                }
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Chunking size"
                    type="number"
                    value={config.tools.kb.chunkingSize}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        tools: {
                          ...prev.tools,
                          kb: {
                            ...prev.tools.kb,
                            chunkingSize: Number(e.target.value),
                          },
                        },
                      }))
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Overlapping size"
                    type="number"
                    value={config.tools.kb.overlappingSize}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        tools: {
                          ...prev.tools,
                          kb: {
                            ...prev.tools.kb,
                            overlappingSize: Number(e.target.value),
                          },
                        },
                      }))
                    }
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  variant="contained"
                  onClick={onUploadKb}
                  disabled={kbLoading}
                >
                  {kbLoading ? "Uploading..." : "Upload KB"}
                </Button>
                {showKbStatusCheck && (
                  <Button
                    variant="outlined"
                    onClick={onCheckKb}
                    disabled={kbLoading}
                  >
                    Check status
                  </Button>
                )}
                {kbLoading && <CircularProgress size={20} />}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Card>

      <Card sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LanIcon color="info" />
            <Typography variant="h6">MCP Tools</Typography>
            {config.tools.mcp.status !== "idle" && (
              <Chip
                size="small"
                label={config.tools.mcp.status}
                color={
                  config.tools.mcp.status === "valid" ? "success" : "default"
                }
              />
            )}
          </Stack>

          <TextField
            label="MCP URL"
            placeholder="https://shiprocket-mcp.shiprocket.in/mcp"
            value={config.tools.mcp.url}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                tools: {
                  ...prev.tools,
                  mcp: {
                    ...prev.tools.mcp,
                    url: e.target.value,
                    status: "idle",
                  },
                },
              }))
            }
            fullWidth
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="contained"
              onClick={onCheckMcp}
              disabled={mcpChecking}
            >
              {mcpChecking ? "Checking..." : "Check MCP"}
            </Button>
            {mcpChecking && <CircularProgress size={20} />}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            We validate the MCP URL before moving to the next step.
          </Typography>
        </Stack>
      </Card>
    </Stack>
  );
}

type AgentNodeStepProps = {
  config: BuilderConfig;
  onChange: (updater: (prev: BuilderConfig) => BuilderConfig) => void;
  hasKbCollection: boolean;
  hasValidMcp: boolean;
};

function AgentNodeStep({
  config,
  onChange,
  hasKbCollection,
  hasValidMcp,
}: AgentNodeStepProps) {
  return (
    <Card sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Basic Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Define the system prompt and execution limits for your agent.
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Agent name"
              value={config.agent.name}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  agent: { ...prev.agent, name: e.target.value },
                }))
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Max steps"
              type="number"
              value={config.agent.maxSteps}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  agent: { ...prev.agent, maxSteps: Number(e.target.value) },
                }))
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="System prompt"
              value={config.agent.systemPrompt}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  agent: { ...prev.agent, systemPrompt: e.target.value },
                }))
              }
              fullWidth
              multiline
              minRows={4}
            />
          </Grid>
          {/*
          <Grid item xs={12}>
            <TextField
              label="Reviewer prompt (optional)"
              value={config.agent.reviewerPrompt}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  agent: { ...prev.agent, reviewerPrompt: e.target.value },
                }))
              }
              fullWidth
              multiline
              minRows={3}
            />
          </Grid>
          */}
        </Grid>
      </Stack>
    </Card>
  );
}

type PreviewStepProps = {
  config: WidgetConfig;
  onChange: Dispatch<SetStateAction<WidgetConfig>>;
  agentId: string;
  hasKbCollection: boolean;
  hasValidMcp: boolean;
};

function PreviewStep({
  config,
  onChange,
  agentId,
  hasKbCollection,
  hasValidMcp,
}: PreviewStepProps) {
  const { enqueueSnackbar } = useSnackbar();
  const widgetAgentId = agentId;
  const widgetConfig = useMemo(() => {
    const nextConfig = config as any;
    return {
      ...nextConfig,
      widget: {
        ...(nextConfig?.widget || {}),
        enabled: nextConfig?.widget?.enabled ?? true,
      },
    };
  }, [config]);
  const widgetLayouts = widgetConfig?.widget?.layouts || {};
  const integrationSnippet = buildIntegrationSnippet(widgetAgentId);

  const handleCopySnippet = async (snippet: string, label: string) => {
    try {
      await navigator.clipboard.writeText(snippet);
      enqueueSnackbar(`${label} copied`, { variant: "success" });
    } catch (error) {
      enqueueSnackbar(`Unable to copy ${label}`, { variant: "error" });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).ShiprocketAgentWidgetConfig = widgetConfig;
  }, [widgetConfig]);

  const setLayout = (layout: "bubble" | "drawer" | "fullscreen") => {
    onChange((prev) => {
      const next = prev as any;
      return {
        ...next,
        widget: {
          ...next.widget,
          type: layout,
          layouts: {
            ...next.widget.layouts,
            bubble: {
              ...next.widget.layouts.bubble,
              enabled: layout === "bubble",
            },
            drawer: {
              ...next.widget.layouts.drawer,
              enabled: layout === "drawer",
            },
            fullscreen: {
              ...next.widget.layouts.fullscreen,
              enabled: layout === "fullscreen",
            },
          },
        },
      };
    });
  };

  const updateThemeVariant = (updater: (variant: any) => any) => {
    onChange((prev) => {
      const next = prev as any;
      const currentTheme = next.widget.theme || {};
      const light = currentTheme.light || {};
      const dark = currentTheme.dark || {};
      return {
        ...next,
        widget: {
          ...next.widget,
          theme: {
            ...currentTheme,
            light: updater(light),
            dark: updater(dark),
          },
        },
      };
    });
  };

  const updateThemeColor = (key: string, value: string) => {
    updateThemeVariant((variant) => ({
      ...variant,
      colors: { ...(variant.colors || {}), [key]: value },
    }));
  };

  const suggestionsValue =
    widgetConfig?.widget?.messages?.suggestions?.join(", ") || "";
  const supportedLocalesValue =
    widgetConfig?.widget?.i18n?.supportedLocales?.join(", ") || "";
  const gradientStopsValue =
    widgetConfig?.widget?.theme?.dark?.gradient?.stops?.join(", ") || "";
  const themeColors = widgetConfig?.widget?.theme?.dark?.colors || {};
  const themeGradient = widgetConfig?.widget?.theme?.dark?.gradient || {};
  const themeTypography = widgetConfig?.widget?.theme?.dark?.typography || {};
  const themeShape = widgetConfig?.widget?.theme?.dark?.shape || {};
  const themeEffects = widgetConfig?.widget?.theme?.dark?.effects || {};
  const themeDensity = widgetConfig?.widget?.theme?.dark?.density || "normal";
  const i18nDefaultLocale = widgetConfig?.widget?.i18n?.defaultLocale || "en";
  const i18nStrings =
    widgetConfig?.widget?.i18n?.strings?.[i18nDefaultLocale] || {};
  const supportedLocalesList =
    widgetConfig?.widget?.i18n?.supportedLocales?.length > 0
      ? widgetConfig.widget.i18n.supportedLocales
      : ["en"];

  return (
    <Grid container spacing={2} alignItems="stretch">
      <Grid item xs={12} md={5}>
        <Card sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Widget settings</Typography>
            <Typography variant="body2" color="text.secondary">
              Update the configuration and watch the widget update in real time.
            </Typography>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Important settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Layout</Typography>
                    <FormControl fullWidth>
                      <InputLabel id="layout-type-label">
                        Layout type
                      </InputLabel>
                      <Select
                        labelId="layout-type-label"
                        label="Layout type"
                        value={widgetConfig?.widget?.type || "bubble"}
                        onChange={(e) =>
                          setLayout(
                            e.target.value as "bubble" | "drawer" | "fullscreen"
                          )
                        }
                      >
                        <MenuItem value="bubble">Bubble</MenuItem>
                        <MenuItem value="drawer">Drawer</MenuItem>
                        <MenuItem value="fullscreen">Fullscreen</MenuItem>
                      </Select>
                    </FormControl>
                    {widgetConfig?.widget?.type === "bubble" && (
                      <Stack spacing={1.5}>
                        <FormControl fullWidth>
                          <InputLabel id="bubble-position-label">
                            Bubble position
                          </InputLabel>
                          <Select
                            labelId="bubble-position-label"
                            label="Bubble position"
                            value={
                              widgetLayouts?.bubble?.position || "bottom-right"
                            }
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      bubble: {
                                        ...next.widget.layouts.bubble,
                                        position: e.target.value,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          >
                            <MenuItem value="bottom-right">
                              Bottom right
                            </MenuItem>
                            <MenuItem value="bottom-left">Bottom left</MenuItem>
                          </Select>
                        </FormControl>
                        <Stack direction="row" spacing={2}>
                          <TextField
                            label="Offset X"
                            type="number"
                            value={widgetLayouts?.bubble?.offset?.x ?? 20}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      bubble: {
                                        ...next.widget.layouts.bubble,
                                        offset: {
                                          ...next.widget.layouts.bubble.offset,
                                          x: Number(e.target.value),
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                          <TextField
                            label="Offset Y"
                            type="number"
                            value={widgetLayouts?.bubble?.offset?.y ?? 20}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      bubble: {
                                        ...next.widget.layouts.bubble,
                                        offset: {
                                          ...next.widget.layouts.bubble.offset,
                                          y: Number(e.target.value),
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                        </Stack>
                      </Stack>
                    )}
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Theme</Typography>
                    <FormControl fullWidth>
                      <InputLabel id="theme-mode-label">Theme mode</InputLabel>
                      <Select
                        labelId="theme-mode-label"
                        label="Theme mode"
                        value={widgetConfig?.widget?.theme?.mode || "dark"}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                theme: {
                                  ...next.widget.theme,
                                  mode: e.target.value,
                                },
                              },
                            };
                          })
                        }
                      >
                        <MenuItem value="auto">Auto</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="light">Light</MenuItem>
                      </Select>
                    </FormControl>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Primary color"
                        value={themeColors.primary || ""}
                        onChange={(e) =>
                          updateThemeColor("primary", e.target.value)
                        }
                        type="color"
                        InputLabelProps={{ shrink: true }}
                        sx={{ maxWidth: 180 }}
                        fullWidth
                      />
                      <TextField
                        label="Accent color"
                        value={themeColors.accent || ""}
                        onChange={(e) =>
                          updateThemeColor("accent", e.target.value)
                        }
                        type="color"
                        InputLabelProps={{ shrink: true }}
                        sx={{ maxWidth: 180 }}
                        fullWidth
                      />
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Header</Typography>
                    <TextField
                      label="Title"
                      value={widgetConfig?.widget?.header?.title || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              header: {
                                ...next.widget.header,
                                title: e.target.value,
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <TextField
                      label="Subtitle"
                      value={widgetConfig?.widget?.header?.subtitle || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              header: {
                                ...next.widget.header,
                                subtitle: e.target.value,
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Messages</Typography>
                    <TextField
                      label="Welcome message"
                      value={widgetConfig?.widget?.messages?.welcome || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              messages: {
                                ...next.widget.messages,
                                welcome: e.target.value,
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <TextField
                      label="Placeholder"
                      value={widgetConfig?.widget?.messages?.placeholder || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              messages: {
                                ...next.widget.messages,
                                placeholder: e.target.value,
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <TextField
                      label="Suggestions"
                      helperText="Comma-separated suggestions."
                      value={suggestionsValue}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              messages: {
                                ...next.widget.messages,
                                suggestions: e.target.value
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Message input</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.composer?.enterToSend
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  composer: {
                                    ...next.widget.composer,
                                    enterToSend: e.target.checked,
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Enter to send"
                    />
                    <TextField
                      label="Max chars"
                      type="number"
                      value={widgetConfig?.widget?.composer?.maxChars || 0}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              composer: {
                                ...next.widget.composer,
                                maxChars: Number(e.target.value),
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Behavior</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.behavior?.defaultOpen
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  behavior: {
                                    ...next.widget.behavior,
                                    defaultOpen: e.target.checked,
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Open by default"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.behavior?.autoOpen?.enabled
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  behavior: {
                                    ...next.widget.behavior,
                                    autoOpen: {
                                      ...next.widget.behavior.autoOpen,
                                      enabled: e.target.checked,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Auto open"
                    />
                    <TextField
                      label="Auto open delay (ms)"
                      type="number"
                      value={
                        widgetConfig?.widget?.behavior?.autoOpen?.delayMs || 0
                      }
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              behavior: {
                                ...next.widget.behavior,
                                autoOpen: {
                                  ...next.widget.behavior.autoOpen,
                                  delayMs: Number(e.target.value),
                                },
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Advanced settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Layout details</Typography>
                    {widgetConfig?.widget?.type === "bubble" && (
                      <Stack spacing={2}>
                        <Stack spacing={1}>
                          <Typography variant="subtitle2">Launcher</Typography>
                          <FormControl fullWidth>
                            <InputLabel id="launcher-variant-label">
                              Variant
                            </InputLabel>
                            <Select
                              labelId="launcher-variant-label"
                              label="Variant"
                              value={
                                widgetLayouts?.bubble?.launcher?.variant ||
                                "bubble"
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          launcher: {
                                            ...next.widget.layouts.bubble
                                              .launcher,
                                            variant: e.target.value,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            >
                              <MenuItem value="bubble">Bubble</MenuItem>
                              <MenuItem value="button">Button</MenuItem>
                            </Select>
                          </FormControl>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={Boolean(
                                  widgetLayouts?.bubble?.launcher?.showLabel
                                )}
                                onChange={(e) =>
                                  onChange((prev) => {
                                    const next = prev as any;
                                    return {
                                      ...next,
                                      widget: {
                                        ...next.widget,
                                        layouts: {
                                          ...next.widget.layouts,
                                          bubble: {
                                            ...next.widget.layouts.bubble,
                                            launcher: {
                                              ...next.widget.layouts.bubble
                                                .launcher,
                                              showLabel: e.target.checked,
                                            },
                                          },
                                        },
                                      },
                                    };
                                  })
                                }
                              />
                            }
                            label="Show label"
                          />
                          <TextField
                            label="Label"
                            value={widgetLayouts?.bubble?.launcher?.label || ""}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      bubble: {
                                        ...next.widget.layouts.bubble,
                                        launcher: {
                                          ...next.widget.layouts.bubble
                                            .launcher,
                                          label: e.target.value,
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Icon"
                              value={
                                widgetLayouts?.bubble?.launcher?.icon || ""
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          launcher: {
                                            ...next.widget.layouts.bubble
                                              .launcher,
                                            icon: e.target.value,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                            <FormControl fullWidth>
                              <InputLabel id="launcher-size-label">
                                Size
                              </InputLabel>
                              <Select
                                labelId="launcher-size-label"
                                label="Size"
                                value={
                                  widgetLayouts?.bubble?.launcher?.size || "md"
                                }
                                onChange={(e) =>
                                  onChange((prev) => {
                                    const next = prev as any;
                                    return {
                                      ...next,
                                      widget: {
                                        ...next.widget,
                                        layouts: {
                                          ...next.widget.layouts,
                                          bubble: {
                                            ...next.widget.layouts.bubble,
                                            launcher: {
                                              ...next.widget.layouts.bubble
                                                .launcher,
                                              size: e.target.value,
                                            },
                                          },
                                        },
                                      },
                                    };
                                  })
                                }
                              >
                                <MenuItem value="sm">Small</MenuItem>
                                <MenuItem value="md">Medium</MenuItem>
                                <MenuItem value="lg">Large</MenuItem>
                              </Select>
                            </FormControl>
                          </Stack>
                        </Stack>

                        <Stack spacing={1}>
                          <Typography variant="subtitle2">Panel</Typography>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Panel width"
                              type="number"
                              value={widgetLayouts?.bubble?.panel?.width || 0}
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            width: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                            <TextField
                              label="Panel height"
                              type="number"
                              value={widgetLayouts?.bubble?.panel?.height || 0}
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            height: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                          </Stack>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Min width"
                              type="number"
                              value={
                                widgetLayouts?.bubble?.panel?.minWidth || 0
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            minWidth: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                            <TextField
                              label="Min height"
                              type="number"
                              value={
                                widgetLayouts?.bubble?.panel?.minHeight || 0
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            minHeight: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                          </Stack>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Max width"
                              type="number"
                              value={
                                widgetLayouts?.bubble?.panel?.maxWidth || 0
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            maxWidth: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                            <TextField
                              label="Max height"
                              type="number"
                              value={
                                widgetLayouts?.bubble?.panel?.maxHeight || 0
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            maxHeight: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                          </Stack>
                          <FormControl fullWidth>
                            <InputLabel id="mobile-behavior-label">
                              Mobile behavior
                            </InputLabel>
                            <Select
                              labelId="mobile-behavior-label"
                              label="Mobile behavior"
                              value={
                                widgetLayouts?.bubble?.panel?.mobileBehavior ||
                                "fullscreen"
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            mobileBehavior: e.target.value,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            >
                              <MenuItem value="fullscreen">Fullscreen</MenuItem>
                              <MenuItem value="inline">Inline</MenuItem>
                            </Select>
                          </FormControl>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={Boolean(
                                  widgetLayouts?.bubble?.panel?.backdrop
                                    ?.enabled
                                )}
                                onChange={(e) =>
                                  onChange((prev) => {
                                    const next = prev as any;
                                    return {
                                      ...next,
                                      widget: {
                                        ...next.widget,
                                        layouts: {
                                          ...next.widget.layouts,
                                          bubble: {
                                            ...next.widget.layouts.bubble,
                                            panel: {
                                              ...next.widget.layouts.bubble
                                                .panel,
                                              backdrop: {
                                                ...next.widget.layouts.bubble
                                                  .panel.backdrop,
                                                enabled: e.target.checked,
                                              },
                                            },
                                          },
                                        },
                                      },
                                    };
                                  })
                                }
                              />
                            }
                            label="Backdrop"
                          />
                          {widgetLayouts?.bubble?.panel?.backdrop?.enabled && (
                            <TextField
                              label="Backdrop blur"
                              type="number"
                              value={
                                widgetLayouts?.bubble?.panel?.backdrop?.blur ??
                                0
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            backdrop: {
                                              ...next.widget.layouts.bubble
                                                .panel.backdrop,
                                              blur: Number(e.target.value),
                                            },
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                          )}
                        </Stack>
                      </Stack>
                    )}
                    {widgetConfig?.widget?.type === "drawer" && (
                      <Stack spacing={1.5}>
                        <FormControl fullWidth>
                          <InputLabel id="drawer-side-label">Side</InputLabel>
                          <Select
                            labelId="drawer-side-label"
                            label="Side"
                            value={widgetLayouts?.drawer?.side || "right"}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      drawer: {
                                        ...next.widget.layouts.drawer,
                                        side: e.target.value,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          >
                            <MenuItem value="right">Right</MenuItem>
                            <MenuItem value="left">Left</MenuItem>
                          </Select>
                        </FormControl>
                        <Stack direction="row" spacing={2}>
                          <TextField
                            label="Width"
                            type="number"
                            value={widgetLayouts?.drawer?.width || 0}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      drawer: {
                                        ...next.widget.layouts.drawer,
                                        width: Number(e.target.value),
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                          <TextField
                            label="Max width"
                            type="number"
                            value={widgetLayouts?.drawer?.maxWidth || 0}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      drawer: {
                                        ...next.widget.layouts.drawer,
                                        maxWidth: Number(e.target.value),
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                        </Stack>
                        <TextField
                          label="Mobile width"
                          value={widgetLayouts?.drawer?.mobileWidth || "100%"}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  layouts: {
                                    ...next.widget.layouts,
                                    drawer: {
                                      ...next.widget.layouts.drawer,
                                      mobileWidth: e.target.value,
                                    },
                                  },
                                },
                              };
                            })
                          }
                          fullWidth
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={Boolean(
                                widgetLayouts?.drawer?.backdrop?.enabled
                              )}
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        drawer: {
                                          ...next.widget.layouts.drawer,
                                          backdrop: {
                                            ...next.widget.layouts.drawer
                                              .backdrop,
                                            enabled: e.target.checked,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            />
                          }
                          label="Backdrop"
                        />
                        {widgetLayouts?.drawer?.backdrop?.enabled && (
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Backdrop blur"
                              type="number"
                              value={widgetLayouts?.drawer?.backdrop?.blur ?? 0}
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        drawer: {
                                          ...next.widget.layouts.drawer,
                                          backdrop: {
                                            ...next.widget.layouts.drawer
                                              .backdrop,
                                            blur: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={Boolean(
                                    widgetLayouts?.drawer?.backdrop
                                      ?.closeOnClick
                                  )}
                                  onChange={(e) =>
                                    onChange((prev) => {
                                      const next = prev as any;
                                      return {
                                        ...next,
                                        widget: {
                                          ...next.widget,
                                          layouts: {
                                            ...next.widget.layouts,
                                            drawer: {
                                              ...next.widget.layouts.drawer,
                                              backdrop: {
                                                ...next.widget.layouts.drawer
                                                  .backdrop,
                                                closeOnClick: e.target.checked,
                                              },
                                            },
                                          },
                                        },
                                      };
                                    })
                                  }
                                />
                              }
                              label="Close on click"
                            />
                          </Stack>
                        )}
                        <Stack direction="row" spacing={2}>
                          <FormControl fullWidth>
                            <InputLabel id="drawer-animation-label">
                              Animation
                            </InputLabel>
                            <Select
                              labelId="drawer-animation-label"
                              label="Animation"
                              value={
                                widgetLayouts?.drawer?.animation?.type ||
                                "slide"
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        drawer: {
                                          ...next.widget.layouts.drawer,
                                          animation: {
                                            ...next.widget.layouts.drawer
                                              .animation,
                                            type: e.target.value,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            >
                              <MenuItem value="slide">Slide</MenuItem>
                              <MenuItem value="fade">Fade</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                            label="Duration (ms)"
                            type="number"
                            value={
                              widgetLayouts?.drawer?.animation?.durationMs ?? 0
                            }
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      drawer: {
                                        ...next.widget.layouts.drawer,
                                        animation: {
                                          ...next.widget.layouts.drawer
                                            .animation,
                                          durationMs: Number(e.target.value),
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                        </Stack>
                        <TextField
                          label="Trigger button text"
                          value={widgetLayouts?.drawer?.btn_text || ""}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  layouts: {
                                    ...next.widget.layouts,
                                    drawer: {
                                      ...next.widget.layouts.drawer,
                                      btn_text: e.target.value,
                                    },
                                  },
                                },
                              };
                            })
                          }
                          fullWidth
                        />
                      </Stack>
                    )}
                    {widgetConfig?.widget?.type === "fullscreen" && (
                      <Stack spacing={1.5}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={Boolean(
                                widgetLayouts?.fullscreen?.backdrop?.enabled
                              )}
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        fullscreen: {
                                          ...next.widget.layouts.fullscreen,
                                          backdrop: {
                                            ...next.widget.layouts.fullscreen
                                              .backdrop,
                                            enabled: e.target.checked,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            />
                          }
                          label="Backdrop"
                        />
                        <Stack direction="row" spacing={2}>
                          <TextField
                            label="Backdrop blur"
                            type="number"
                            value={
                              widgetLayouts?.fullscreen?.backdrop?.blur ?? 0
                            }
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      fullscreen: {
                                        ...next.widget.layouts.fullscreen,
                                        backdrop: {
                                          ...next.widget.layouts.fullscreen
                                            .backdrop,
                                          blur: Number(e.target.value),
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={Boolean(
                                  widgetLayouts?.fullscreen?.backdrop
                                    ?.closeOnClick
                                )}
                                onChange={(e) =>
                                  onChange((prev) => {
                                    const next = prev as any;
                                    return {
                                      ...next,
                                      widget: {
                                        ...next.widget,
                                        layouts: {
                                          ...next.widget.layouts,
                                          fullscreen: {
                                            ...next.widget.layouts.fullscreen,
                                            backdrop: {
                                              ...next.widget.layouts.fullscreen
                                                .backdrop,
                                              closeOnClick: e.target.checked,
                                            },
                                          },
                                        },
                                      },
                                    };
                                  })
                                }
                              />
                            }
                            label="Close on click"
                          />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                          <FormControl fullWidth>
                            <InputLabel id="fullscreen-animation-label">
                              Animation
                            </InputLabel>
                            <Select
                              labelId="fullscreen-animation-label"
                              label="Animation"
                              value={
                                widgetLayouts?.fullscreen?.animation?.type ||
                                "fade"
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        fullscreen: {
                                          ...next.widget.layouts.fullscreen,
                                          animation: {
                                            ...next.widget.layouts.fullscreen
                                              .animation,
                                            type: e.target.value,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            >
                              <MenuItem value="fade">Fade</MenuItem>
                              <MenuItem value="slide">Slide</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                            label="Duration (ms)"
                            type="number"
                            value={
                              widgetLayouts?.fullscreen?.animation
                                ?.durationMs ?? 0
                            }
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      fullscreen: {
                                        ...next.widget.layouts.fullscreen,
                                        animation: {
                                          ...next.widget.layouts.fullscreen
                                            .animation,
                                          durationMs: Number(e.target.value),
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                        </Stack>
                      </Stack>
                    )}
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Theme details</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Updates apply to both light and dark palettes.
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="Background"
                        type="color"
                        value={themeColors.background || ""}
                        onChange={(e) =>
                          updateThemeColor("background", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Surface"
                        type="color"
                        value={themeColors.surface || ""}
                        onChange={(e) =>
                          updateThemeColor("surface", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Surface alt"
                        type="color"
                        value={themeColors.surfaceAlt || ""}
                        onChange={(e) =>
                          updateThemeColor("surfaceAlt", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Text"
                        type="color"
                        value={themeColors.text || ""}
                        onChange={(e) =>
                          updateThemeColor("text", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Muted text"
                        type="color"
                        value={themeColors.mutedText || ""}
                        onChange={(e) =>
                          updateThemeColor("mutedText", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Border"
                        type="color"
                        value={themeColors.border || ""}
                        onChange={(e) =>
                          updateThemeColor("border", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Danger"
                        type="color"
                        value={themeColors.danger || ""}
                        onChange={(e) =>
                          updateThemeColor("danger", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Warning"
                        type="color"
                        value={themeColors.warning || ""}
                        onChange={(e) =>
                          updateThemeColor("warning", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Success"
                        type="color"
                        value={themeColors.success || ""}
                        onChange={(e) =>
                          updateThemeColor("success", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(themeGradient?.enabled)}
                          onChange={(e) =>
                            updateThemeVariant((variant) => ({
                              ...variant,
                              gradient: {
                                ...(variant.gradient || {}),
                                enabled: e.target.checked,
                              },
                            }))
                          }
                        />
                      }
                      label="Enable gradient"
                    />
                    <Stack direction="row" spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel id="gradient-type-label">
                          Gradient type
                        </InputLabel>
                        <Select
                          labelId="gradient-type-label"
                          label="Gradient type"
                          value={themeGradient?.type || "linear"}
                          onChange={(e) =>
                            updateThemeVariant((variant) => ({
                              ...variant,
                              gradient: {
                                ...(variant.gradient || {}),
                                type: e.target.value,
                              },
                            }))
                          }
                        >
                          <MenuItem value="linear">Linear</MenuItem>
                          <MenuItem value="radial">Radial</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Angle"
                        type="number"
                        value={themeGradient?.angle ?? 0}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            gradient: {
                              ...(variant.gradient || {}),
                              angle: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                    </Stack>
                    <TextField
                      label="Gradient stops"
                      helperText="Comma-separated colors."
                      value={gradientStopsValue}
                      onChange={(e) =>
                        updateThemeVariant((variant) => ({
                          ...variant,
                          gradient: {
                            ...(variant.gradient || {}),
                            stops: e.target.value
                              .split(",")
                              .map((stop: string) => stop.trim())
                              .filter(Boolean),
                          },
                        }))
                      }
                      fullWidth
                    />

                    <TextField
                      label="Font family"
                      value={themeTypography?.fontFamily || ""}
                      onChange={(e) =>
                        updateThemeVariant((variant) => ({
                          ...variant,
                          typography: {
                            ...(variant.typography || {}),
                            fontFamily: e.target.value,
                          },
                        }))
                      }
                      fullWidth
                    />
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Base font size"
                        type="number"
                        value={themeTypography?.baseFontSize ?? 0}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            typography: {
                              ...(variant.typography || {}),
                              baseFontSize: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                      <TextField
                        label="Scale"
                        type="number"
                        value={themeTypography?.scale ?? 1}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            typography: {
                              ...(variant.typography || {}),
                              scale: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Radius"
                        type="number"
                        value={themeShape?.radius ?? 0}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            shape: {
                              ...(variant.shape || {}),
                              radius: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                      <TextField
                        label="Bubble radius"
                        type="number"
                        value={themeShape?.bubbleRadius ?? 0}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            shape: {
                              ...(variant.shape || {}),
                              bubbleRadius: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                      <TextField
                        label="Border width"
                        type="number"
                        value={themeShape?.borderWidth ?? 0}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            shape: {
                              ...(variant.shape || {}),
                              borderWidth: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                    </Stack>
                    <FormControl fullWidth>
                      <InputLabel id="density-label">Density</InputLabel>
                      <Select
                        labelId="density-label"
                        label="Density"
                        value={themeDensity}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            density: e.target.value,
                          }))
                        }
                      >
                        <MenuItem value="compact">Compact</MenuItem>
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="comfortable">Comfortable</MenuItem>
                      </Select>
                    </FormControl>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(themeEffects?.blurGlass)}
                            onChange={(e) =>
                              updateThemeVariant((variant) => ({
                                ...variant,
                                effects: {
                                  ...(variant.effects || {}),
                                  blurGlass: e.target.checked,
                                },
                              }))
                            }
                          />
                        }
                        label="Blur glass"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              themeEffects?.reducedMotionRespect
                            )}
                            onChange={(e) =>
                              updateThemeVariant((variant) => ({
                                ...variant,
                                effects: {
                                  ...(variant.effects || {}),
                                  reducedMotionRespect: e.target.checked,
                                },
                              }))
                            }
                          />
                        }
                        label="Respect reduced motion"
                      />
                      <FormControl sx={{ minWidth: 160 }}>
                        <InputLabel id="shadow-label">Shadow</InputLabel>
                        <Select
                          labelId="shadow-label"
                          label="Shadow"
                          value={themeEffects?.shadow || "md"}
                          onChange={(e) =>
                            updateThemeVariant((variant) => ({
                              ...variant,
                              effects: {
                                ...(variant.effects || {}),
                                shadow: e.target.value,
                              },
                            }))
                          }
                        >
                          <MenuItem value="sm">Small</MenuItem>
                          <MenuItem value="md">Medium</MenuItem>
                          <MenuItem value="lg">Large</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Header actions</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.header?.logo?.enabled
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  header: {
                                    ...next.widget.header,
                                    logo: {
                                      ...next.widget.header.logo,
                                      enabled: e.target.checked,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Show logo"
                    />
                    <TextField
                      label="Logo URL"
                      value={widgetConfig?.widget?.header?.logo?.url || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              header: {
                                ...next.widget.header,
                                logo: {
                                  ...next.widget.header.logo,
                                  url: e.target.value,
                                },
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.header?.actions?.showClose
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    header: {
                                      ...next.widget.header,
                                      actions: {
                                        ...next.widget.header.actions,
                                        showClose: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Close"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.header?.actions
                                ?.showMinimize
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    header: {
                                      ...next.widget.header,
                                      actions: {
                                        ...next.widget.header.actions,
                                        showMinimize: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Minimize"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.header?.actions?.showReset
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    header: {
                                      ...next.widget.header,
                                      actions: {
                                        ...next.widget.header.actions,
                                        showReset: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Reset"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.header?.actions?.showPopout
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    header: {
                                      ...next.widget.header,
                                      actions: {
                                        ...next.widget.header.actions,
                                        showPopout: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Popout"
                      />
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Message details</Typography>
                    <Stack direction="row" spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel id="timestamp-format-label">
                          Timestamp format
                        </InputLabel>
                        <Select
                          labelId="timestamp-format-label"
                          label="Timestamp format"
                          value={
                            widgetConfig?.widget?.messages?.timestamp?.format ||
                            "relative"
                          }
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  messages: {
                                    ...next.widget.messages,
                                    timestamp: {
                                      ...next.widget.messages.timestamp,
                                      format: e.target.value,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        >
                          <MenuItem value="relative">Relative</MenuItem>
                          <MenuItem value="absolute">Absolute</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl fullWidth>
                        <InputLabel id="typing-style-label">
                          Typing style
                        </InputLabel>
                        <Select
                          labelId="typing-style-label"
                          label="Typing style"
                          value={
                            widgetConfig?.widget?.messages?.typingIndicator
                              ?.style || "dots"
                          }
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  messages: {
                                    ...next.widget.messages,
                                    typingIndicator: {
                                      ...next.widget.messages.typingIndicator,
                                      style: e.target.value,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        >
                          <MenuItem value="dots">Dots</MenuItem>
                          <MenuItem value="bar">Bar</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.messages?.timestamp?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    messages: {
                                      ...next.widget.messages,
                                      timestamp: {
                                        ...next.widget.messages.timestamp,
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Timestamps"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.messages?.typingIndicator
                                ?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    messages: {
                                      ...next.widget.messages,
                                      typingIndicator: {
                                        ...next.widget.messages.typingIndicator,
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Typing indicator"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.messages?.readReceipts
                                ?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    messages: {
                                      ...next.widget.messages,
                                      readReceipts: {
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Read receipts"
                      />
                    </Stack>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.messages?.messageStyles
                                ?.user?.avatar?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    messages: {
                                      ...next.widget.messages,
                                      messageStyles: {
                                        ...(next.widget.messages
                                          .messageStyles || {}),
                                        user: {
                                          ...(next.widget.messages.messageStyles
                                            ?.user || {}),
                                          avatar: {
                                            ...(next.widget.messages
                                              .messageStyles?.user?.avatar ||
                                              {}),
                                            enabled: e.target.checked,
                                          },
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="User avatar"
                      />
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">
                      Behavior details
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.behavior?.closeOnEsc
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    behavior: {
                                      ...next.widget.behavior,
                                      closeOnEsc: e.target.checked,
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Close on Esc"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.behavior
                                ?.closeOnOutsideClick
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    behavior: {
                                      ...next.widget.behavior,
                                      closeOnOutsideClick: e.target.checked,
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Close on outside"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.behavior?.focusTrap
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    behavior: {
                                      ...next.widget.behavior,
                                      focusTrap: e.target.checked,
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Focus trap"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.behavior?.autoOpen
                                ?.oncePerSession
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    behavior: {
                                      ...next.widget.behavior,
                                      autoOpen: {
                                        ...next.widget.behavior.autoOpen,
                                        oncePerSession: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Auto open once"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.behavior
                                ?.persistConversation?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    behavior: {
                                      ...next.widget.behavior,
                                      persistConversation: {
                                        ...next.widget.behavior
                                          .persistConversation,
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Persist conversation"
                      />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel id="persist-storage-label">
                          Storage
                        </InputLabel>
                        <Select
                          labelId="persist-storage-label"
                          label="Storage"
                          value={
                            widgetConfig?.widget?.behavior?.persistConversation
                              ?.storage || "localStorage"
                          }
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  behavior: {
                                    ...next.widget.behavior,
                                    persistConversation: {
                                      ...next.widget.behavior
                                        .persistConversation,
                                      storage: e.target.value,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        >
                          <MenuItem value="localStorage">
                            Local storage
                          </MenuItem>
                          <MenuItem value="sessionStorage">
                            Session storage
                          </MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Storage key"
                        value={
                          widgetConfig?.widget?.behavior?.persistConversation
                            ?.key || ""
                        }
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                behavior: {
                                  ...next.widget.behavior,
                                  persistConversation: {
                                    ...next.widget.behavior.persistConversation,
                                    key: e.target.value,
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="TTL (days)"
                        type="number"
                        value={
                          widgetConfig?.widget?.behavior?.persistConversation
                            ?.ttlDays || 0
                        }
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                behavior: {
                                  ...next.widget.behavior,
                                  persistConversation: {
                                    ...next.widget.behavior.persistConversation,
                                    ttlDays: Number(e.target.value),
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                      <TextField
                        label="Rate limit (per min)"
                        type="number"
                        value={
                          widgetConfig?.widget?.behavior?.rateLimit
                            ?.maxMessagesPerMinute || 0
                        }
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                behavior: {
                                  ...next.widget.behavior,
                                  rateLimit: {
                                    ...next.widget.behavior.rateLimit,
                                    maxMessagesPerMinute: Number(
                                      e.target.value
                                    ),
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                    </Stack>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.behavior?.rateLimit?.enabled
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  behavior: {
                                    ...next.widget.behavior,
                                    rateLimit: {
                                      ...next.widget.behavior.rateLimit,
                                      enabled: e.target.checked,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Enable rate limit"
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Analytics</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.analytics?.enabled
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  analytics: {
                                    ...next.widget.analytics,
                                    enabled: e.target.checked,
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Enable analytics"
                    />
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.analytics?.ga4?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    analytics: {
                                      ...next.widget.analytics,
                                      ga4: {
                                        ...next.widget.analytics.ga4,
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="GA4 enabled"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.analytics?.ga4?.debug
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    analytics: {
                                      ...next.widget.analytics,
                                      ga4: {
                                        ...next.widget.analytics.ga4,
                                        debug: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="GA4 debug"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.analytics?.clarity?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    analytics: {
                                      ...next.widget.analytics,
                                      clarity: {
                                        ...next.widget.analytics.clarity,
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Clarity enabled"
                      />
                    </Stack>
                    <TextField
                      label="GA4 measurement ID"
                      value={
                        widgetConfig?.widget?.analytics?.ga4?.measurementId ||
                        ""
                      }
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              analytics: {
                                ...next.widget.analytics,
                                ga4: {
                                  ...next.widget.analytics.ga4,
                                  measurementId: e.target.value,
                                },
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <TextField
                      label="Clarity project ID"
                      value={
                        widgetConfig?.widget?.analytics?.clarity?.projectId ||
                        ""
                      }
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              analytics: {
                                ...next.widget.analytics,
                                clarity: {
                                  ...next.widget.analytics.clarity,
                                  projectId: e.target.value,
                                },
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">
                      Internationalization
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(widgetConfig?.widget?.i18n?.enabled)}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  i18n: {
                                    ...next.widget.i18n,
                                    enabled: e.target.checked,
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Enable i18n"
                    />
                    <TextField
                      label="Supported locales"
                      helperText="Comma-separated locales."
                      value={supportedLocalesValue}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              i18n: {
                                ...next.widget.i18n,
                                supportedLocales: e.target.value
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <FormControl fullWidth>
                      <InputLabel id="default-locale-label">
                        Default locale
                      </InputLabel>
                      <Select
                        labelId="default-locale-label"
                        label="Default locale"
                        value={i18nDefaultLocale}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                i18n: {
                                  ...next.widget.i18n,
                                  defaultLocale: e.target.value,
                                },
                              },
                            };
                          })
                        }
                      >
                        {supportedLocalesList.map((locale: string) => (
                          <MenuItem key={locale} value={locale}>
                            {locale}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Title"
                      value={i18nStrings.title || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              i18n: {
                                ...next.widget.i18n,
                                strings: {
                                  ...next.widget.i18n.strings,
                                  [i18nDefaultLocale]: {
                                    ...next.widget.i18n.strings?.[
                                      i18nDefaultLocale
                                    ],
                                    title: e.target.value,
                                  },
                                },
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Input placeholder"
                        value={i18nStrings.inputPlaceholder || ""}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                i18n: {
                                  ...next.widget.i18n,
                                  strings: {
                                    ...next.widget.i18n.strings,
                                    [i18nDefaultLocale]: {
                                      ...next.widget.i18n.strings?.[
                                        i18nDefaultLocale
                                      ],
                                      inputPlaceholder: e.target.value,
                                    },
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                      <TextField
                        label="Send label"
                        value={i18nStrings.send || ""}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                i18n: {
                                  ...next.widget.i18n,
                                  strings: {
                                    ...next.widget.i18n.strings,
                                    [i18nDefaultLocale]: {
                                      ...next.widget.i18n.strings?.[
                                        i18nDefaultLocale
                                      ],
                                      send: e.target.value,
                                    },
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Close label"
                        value={i18nStrings.close || ""}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                i18n: {
                                  ...next.widget.i18n,
                                  strings: {
                                    ...next.widget.i18n.strings,
                                    [i18nDefaultLocale]: {
                                      ...next.widget.i18n.strings?.[
                                        i18nDefaultLocale
                                      ],
                                      close: e.target.value,
                                    },
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                      <TextField
                        label="Reset label"
                        value={i18nStrings.reset || ""}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                i18n: {
                                  ...next.widget.i18n,
                                  strings: {
                                    ...next.widget.i18n.strings,
                                    [i18nDefaultLocale]: {
                                      ...next.widget.i18n.strings?.[
                                        i18nDefaultLocale
                                      ],
                                      reset: e.target.value,
                                    },
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5, borderRadius: 2, mt: 2 }}>
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1">Integration code</Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() =>
                  handleCopySnippet(integrationSnippet, "Integration code")
                }
              >
                Copy code
              </Button>
            </Stack>
            <TextField
              value={integrationSnippet}
              multiline
              minRows={10}
              fullWidth
              InputProps={{ readOnly: true, sx: { fontFamily: "monospace" } }}
            />
             <Typography variant="caption" color="text.secondary">
              Note: For the widget’s full-screen mode, use a separate page URL for the implementation.
            </Typography>
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={7}>
        <Box sx={{ position: "sticky", top: "60px" }}>
          <WidgetPreview
            config={widgetConfig}
            agentId={widgetAgentId}
            apiKey=""
            userId=""
            authToken=""
          />
        </Box>
      </Grid>
    </Grid>
  );
}

type PaperInputProps = {
  label: string;
  file: File | null;
  onSelect: (file: File | null) => void;
  accept?: string;
};

function PaperInput({ label, file, onSelect, accept }: PaperInputProps) {
  return (
    <Stack spacing={1}>
      <input
        type="file"
        id="kb-upload"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => onSelect(e.target.files?.[0] || null)}
      />
      <label htmlFor="kb-upload">
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          component="span"
        >
          {label}
        </Button>
      </label>
      {file && (
        <Typography variant="body2" color="text.secondary">
          Selected: {file.name}
        </Typography>
      )}
    </Stack>
  );
}

function WidgetPreview({
  config,
  agentId,
  apiKey,
  userId,
  authToken,
}: {
  config: WidgetConfig;
  agentId: string;
  apiKey: string;
  userId: string;
  authToken: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetAgentId = agentId;
  const widgetApiKey = apiKey || "YOUR_API_KEY";
  const widgetUserId = userId || "USER_ID";
  const widgetAuth = authToken ? ` x-auth-token="${authToken}"` : "";
  const configPayload = JSON.stringify(config);
  const safeConfigJson = JSON.stringify(config, null, 2).replace(
    /<\/script>/g,
    "<\\/script>"
  );

  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    try {
      const targetWindow = frame.contentWindow;
      if (!targetWindow) return;
      (targetWindow as any).ShiprocketAgentWidgetConfig = config;
      const widgetElement = frame.contentDocument?.querySelector(
        "shiprocket-agent-widget"
      );
      if (widgetElement) {
        widgetElement.setAttribute("config", configPayload);
        widgetElement.setAttribute("agent-id", widgetAgentId);
        widgetElement.setAttribute("api-key", widgetApiKey);
        widgetElement.setAttribute("user-id", widgetUserId);
        if (authToken) {
          widgetElement.setAttribute("x-auth-token", authToken);
        } else {
          widgetElement.removeAttribute("x-auth-token");
        }
      }
    } catch (error) {
      // Ignore cross-origin access errors for the preview iframe.
    }
  }, [
    authToken,
    config,
    configPayload,
    widgetAgentId,
    widgetApiKey,
    widgetUserId,
  ]);
  const iframeHtml = [
    "<!doctype html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8" />',
    "<style>",
    "* { box-sizing: border-box; }",
    "html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }",
    "body { font-family: \"Space Grotesk\", \"Avenir Next\", \"Segoe UI\", sans-serif; color: #0b0f1a; }",
    "#widget-root { width: 100%; height: 100%; position: relative; }",
    "#sample-site { position: absolute; inset: 0; padding: 22px; background: radial-gradient(circle at 15% 10%, rgba(80, 120, 255, 0.18), transparent 55%), radial-gradient(circle at 80% 30%, rgba(255, 140, 90, 0.18), transparent 55%), linear-gradient(160deg, #f6f7fb 0%, #eef1f7 35%, #f9fafc 100%); }",
    ".site-shell { height: 100%; display: flex; flex-direction: column; gap: 20px; }",
    ".hero { display: flex; flex-direction: column; gap: 10px; padding-top: 8px; }",
    ".eyebrow { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #0b0f1a; margin: 0; }",
    ".headline { font-size: 30px; line-height: 1.15; margin: 0; color: #0b0f1a; }",
    ".subtext { font-size: 13px; color: #0b0f1a; margin: 0; max-width: 520px; }",
    ".section { display: grid; gap: 8px; }",
    ".section h3 { margin: 0; font-size: 14px; }",
    ".section p { margin: 0; font-size: 12px; color: #0b0f1a; }",
    ".feature-list { display: grid; gap: 6px; font-size: 12px; color: #0b0f1a; }",
    ".feature-item { display: flex; gap: 6px; align-items: baseline; }",
    "shiprocket-agent-widget { position: relative; z-index: 2; }",
    "@media (max-width: 900px) { .headline { font-size: 26px; } }",
    "</style>",
    "</head>",
    "<body>",
    "<script>",
    `window.ShiprocketAgentWidgetConfig = ${safeConfigJson};`,
    "</script>",
    shouldLoadReactUmd ? `<script src="${reactUmdUrl}"></script>` : "",
    shouldLoadReactUmd ? `<script src="${reactDomUmdUrl}"></script>` : "",
    widgetScriptUrl
      ? `<script${
          widgetScriptIsModule ? ' type="module"' : ""
        } src="${widgetScriptUrl}"></script>`
      : "",
    `<div id="widget-root">`,
    `<div id="sample-site">`,
    `<div class="site-shell">`,
    `<section class="hero">`,
    `<p class="eyebrow">Logistics intelligence</p>`,
    `<h1 class="headline">This is a sample website making widget preview easy.</h1>`,
    `<p class="subtext">The widget is visible in this page.</p>`,
    `</section>`,
    `<section class="section">`,
    `<h3 style="color: #0b0f1a">Why teams choose Dockyard</h3>`,
    `<div class="feature-list">`,
    `<div class="feature-item"><span>•</span><span>One place to track orders, returns, and support status.</span></div>`,
    `<div class="feature-item"><span>•</span><span>Proactive updates that keep customers informed.</span></div>`,
    `<div class="feature-item"><span>•</span><span>AI assistant that answers common questions instantly.</span></div>`,
    `</div>`,
    `</section>`,
    `</div>`,
    `</div>`,
    `<shiprocket-agent-widget agent-id="${widgetAgentId}" user-id="${widgetUserId}" x-auth-token="YOUR_AUTH_TOKEN"></shiprocket-agent-widget>`,
    "</div>",
    "</body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Box
      sx={{
        height: "calc(100vh - 60px)",
        minHeight: 520,
        borderRadius: 2,
        border: (theme) => `1px dashed ${alpha(theme.palette.divider, 0.6)}`,
        background: (theme) => alpha(theme.palette.background.default, 0.6),
        position: "relative",
        overflow: "hidden",
        p: 2,
      }}
    >
      <iframe
        ref={iframeRef}
        title="Widget preview"
        srcDoc={iframeHtml}
        sandbox="allow-scripts allow-same-origin"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
      />
    </Box>
  );
}

export default AgentBuilderPage;
