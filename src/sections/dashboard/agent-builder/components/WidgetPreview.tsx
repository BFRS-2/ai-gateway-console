import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { WidgetConfig } from "../types";
import {
  reactDomUmdUrl,
  reactUmdUrl,
  shouldLoadReactUmd,
  widgetScriptIsModule,
  widgetScriptUrl,
} from "../widgetConfig";

export default function WidgetPreview({
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
    'body { font-family: "Space Grotesk", "Avenir Next", "Segoe UI", sans-serif; color: #0b0f1a; }',
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
    `<div class="feature-item"><span>&bull;</span><span>One place to track orders, returns, and support status.</span></div>`,
    `<div class="feature-item"><span>&bull;</span><span>Proactive updates that keep customers informed.</span></div>`,
    `<div class="feature-item"><span>&bull;</span><span>AI assistant that answers common questions instantly.</span></div>`,
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
