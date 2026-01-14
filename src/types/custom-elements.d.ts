import type React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "dockyard-widget-preview": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        config?: unknown;
      };
      "shiprocket-agent-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "agent-id"?: string;
        "api-key"?: string;
        "user-id"?: string;
        "x-auth-token"?: string;
        config?: unknown;
      };
    }
  }
}

export {};
