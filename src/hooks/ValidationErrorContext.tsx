"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { enqueueSnackbar, useSnackbar } from "notistack";

export type ApiValidationErrorDetail = {
  status: number;
  message: string;
  errors: Record<string, string>;
  raw?: any;
};

type ValidationErrorContextValue = {
  lastError: ApiValidationErrorDetail | null;
  clearLastError: () => void;
};

const ValidationErrorContext = createContext<
  ValidationErrorContextValue | undefined
>(undefined);

type ProviderProps = {
  children: ReactNode;
};

export function ValidationErrorProvider({ children }: ProviderProps) {
  // const { enqueueSnackbar } = useSnackbar();
  const [lastError, setLastError] = useState<ApiValidationErrorDetail | null>(
    null
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const { detail } = event as CustomEvent<ApiValidationErrorDetail>;
      if (!detail) return;

      console.log("🚀 ~ handler ~ event:", event);
      setLastError(detail);

      const errors = detail.errors || {};

      // Show a snackbar for each error value
      Object.values(errors).forEach((value) => {
        if (!value) return;

        // If backend ever sends an array (e.g. ["msg1", "msg2"])
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (typeof v === "string") {
              enqueueSnackbar(v, { variant: "error" });
            }
          });
          return;
        }

        // Normal case: a single string per field
        if (typeof value === "string") {
          enqueueSnackbar(value, { variant: "error" });
          return;
        }

        // Fallback: object or anything else → stringify
        enqueueSnackbar(String(value), { variant: "error" });
      });
    };

    window.addEventListener("api-validation-error", handler as EventListener);

    return () => {
      window.removeEventListener(
        "api-validation-error",
        handler as EventListener
      );
    };
  }, [enqueueSnackbar]);

  const clearLastError = () => setLastError(null);

  return (
    <ValidationErrorContext.Provider value={{ lastError, clearLastError }}>
      {children}
    </ValidationErrorContext.Provider>
  );
}

export function useValidationError() {
  const ctx = useContext(ValidationErrorContext);
  if (!ctx) {
    throw new Error(
      "useValidationError must be used within a ValidationErrorProvider"
    );
  }
  return ctx;
}
