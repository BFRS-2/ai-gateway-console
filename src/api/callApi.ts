import FE_Error from "./errors/fe_error";
import API_Error from "./errors/api_error";
import { STORAGE_KEY } from "src/auth/context/jwt";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function isFormData(body: any): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function buildHeaders(body: any) {
  const headers = new Headers();

  // Only set JSON content-type when NOT sending FormData.
  if (!isFormData(body)) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("ngrok-skip-browser-warning", "43534");
  // Auth header — add only if we actually have a token
  const token = localStorage.getItem(STORAGE_KEY);
  
  if (token) headers.set("authorization", `Bearer ${token}`);
  headers.set("x-api-key", "693171099f3d11b57d7ef2e4");

  // Misc headers
  // headers.set("ngrok-skip-browser-warning", "69420");

  return headers;
}

async function parseResponse(response: Response) {
  // Try JSON first if content-type hints so; otherwise fall back to text/empty
  const ct = response.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      // Some endpoints return 204/empty with JSON header; return null to avoid throw
      return null;
    }
  }
  // If not JSON, return raw text (you can adapt as needed)
  try {
    return await response.text();
  } catch {
    return null;
  }
}

async function callAPI(url: string, body: any, method: HttpMethod) {
  try {
    const fullUrl = (process.env.NEXT_PUBLIC_BASE_API_URL || "") + url;

    const fetchInit: RequestInit = {
      method,
      headers: buildHeaders(body),
      // For POST/PUT/PATCH: if FormData, pass as-is; else JSON.stringify
      body:
        method === "GET"
          ? undefined
          : isFormData(body)
          ? body
          : body != null
          ? JSON.stringify(body)
          : undefined,
      // credentials: "include", // enable if your API needs cookies
    };

    const response = await fetch(fullUrl, fetchInit);

    // Handle explicit auth failure
    if (response.status === 401) {
      localStorage.removeItem("_user");
      localStorage.removeItem("jwt_access_token");
      if (!window.location.pathname.includes("login"))
        window.location.href = "/login";
      return; // stop processing
    }
    if (response.status === 422) {
      const payload = await parseResponse(response); // should be your JSON

      const errorsObj: Record<string, unknown> = (payload as any)?.errors ?? {};

      // Build a single error message string from `errors`
      // e.g. "langfuse_project_name can only be updated when ...".
      const messages = Object.values(errorsObj).filter(
        (v) => typeof v === "string"
      ) as string[];

      const message =
        messages[0] || (payload as any)?.message || "Validation error occurred";

      // Emit custom event (browser only)
      if (
        typeof window !== "undefined" &&
        typeof window.dispatchEvent === "function"
      ) {
        window.dispatchEvent(
          new CustomEvent("api-validation-error", {
            detail: {
              status: 422,
              message,
              errors: errorsObj,
              raw: payload,
            },
          })
        );
      }

      // Also return an API_Error instance (so callers can handle it too)
      return new API_Error({ status: response.status, payload });
    }

    // Treat non-2xx as API errors
    if (!response.ok) {
      // Attempt to include parsed error payload
      const errPayload = await parseResponse(response);
      return new API_Error({ status: response.status, payload: errPayload });
    }

    // Success
    return await parseResponse(response);
  } catch (e) {
    console.log("🚀 ~ callAPI ~ e:", e);
    return new FE_Error(e);
  }
}

export async function callGithubApi(path: string = "RP/docs.md") {
  try {
    const api_res = await fetch("/docs/" + path, {
      headers: {
        Accept: "text/plain",
      },
    });

    if (!api_res.ok) {
      return new API_Error({
        status: api_res.status,
        payload: await api_res.text(),
      });
    }

    return await api_res.text();
  } catch (e) {
    return new FE_Error(e);
  }
}

export function callGetApi(url: string) {
  return callAPI(url, undefined, "GET");
}
export function callDeleteApi(url: string, body: any = undefined) {
  return callAPI(url, body, "DELETE");
}

export function callPostApi(url: string, body: any) {
  return callAPI(url, body, "POST");
}

export function callPutApi(url: string, body: any) {
  return callAPI(url, body, "PUT");
}

export function callPatchApi(url: string, body: any) {
  return callAPI(url, body, "PATCH");
}
