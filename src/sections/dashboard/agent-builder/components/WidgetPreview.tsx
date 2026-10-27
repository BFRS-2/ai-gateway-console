import { useCallback, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { WidgetConfig } from "../types";
import { STORAGE_KEY } from "src/auth/context/jwt";
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
  // Escape every "<" so no config string can open or close a tag inside the
  // inline <script> (a case-insensitive </script> or "</script " would
  // otherwise break out of the script context).
  const safeConfigJson = JSON.stringify(config, null, 2).replace(/</g, "\\u003c");
  // The widget element is created here instead of in the srcDoc markup, and
  // every attribute is set before it is inserted. A custom element boots on
  // insertion, so an element that is already in the markup starts its first
  // history load before the preview token can be attached - and that load
  // goes to the public visitor endpoints (/chat/sessions) as USER_ID.
  // Called from both the effect and the iframe's onLoad, because srcDoc is
  // not yet parsed when the effect first runs.
  const applyWidgetAttributes = useCallback(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    try {
      const targetWindow = frame.contentWindow;
      const doc = frame.contentDocument;
      if (!targetWindow || !doc) return;
      (targetWindow as any).ShiprocketAgentWidgetConfig = config;
      const host = doc.getElementById("widget-root");
      if (!host) return;
      const existing = doc.querySelector("shiprocket-agent-widget");
      const widgetElement =
        existing || doc.createElement("shiprocket-agent-widget");
      widgetElement.setAttribute("config", configPayload);
      widgetElement.setAttribute("agent-id", widgetAgentId);
      widgetElement.setAttribute("user-id", widgetUserId);
      // Preview chat runs as the logged-in panel user against
      // /agent/preview, because the plaintext agent key is shown only once
      // and the panel cannot read it back. Set here at runtime only - the
      // token must never reach the srcDoc HTML or the embed snippet.
      const previewToken =
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY) || ""
          : "";
      if (previewToken) {
        widgetElement.setAttribute("preview-token", previewToken);
      } else {
        widgetElement.removeAttribute("preview-token");
      }
      if (authToken) {
        widgetElement.setAttribute("x-auth-token", authToken);
      } else {
        widgetElement.removeAttribute("x-auth-token");
      }
      if (!existing) {
        host.appendChild(widgetElement);
      }
    } catch (error) {
      // Ignore cross-origin access errors for the preview iframe.
    }
  }, [
    authToken,
    config,
    configPayload,
    widgetAgentId,
    widgetUserId,
  ]);

  useEffect(() => {
    applyWidgetAttributes();
  }, [applyWidgetAttributes]);

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
        onLoad={applyWidgetAttributes}
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
