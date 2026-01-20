import { WidgetConfig } from "./types";

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

export const themeConfig: WidgetConfig = {
  mode: "dark",
  light: lightThemeVariant,
  dark: darkThemeVariant,
};

export const widgetScriptUrl = process.env.NEXT_PUBLIC_AGENT_WIDGET_URL || "";
export const widgetScriptIsModule =
  widgetScriptUrl.endsWith(".es.js") || widgetScriptUrl.endsWith(".mjs");
export const widgetScriptIsIife = widgetScriptUrl.endsWith(".iife.js");
export const shouldLoadReactUmd = !widgetScriptIsModule && !widgetScriptIsIife;
export const reactUmdUrl =
  process.env.NEXT_PUBLIC_REACT_UMD_URL ||
  "https://unpkg.com/react@18/umd/react.production.min.js";
export const reactDomUmdUrl =
  process.env.NEXT_PUBLIC_REACT_DOM_UMD_URL ||
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js";

export const buildIntegrationSnippet = (agentId: string) => {
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

export const devConfig: WidgetConfig = {
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

export const normalizeWidgetConfig = (
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
