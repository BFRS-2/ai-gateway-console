import { useCallback, useState } from "react";

export default function useServiceFieldErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = useCallback((fieldKey: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  return {
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    resetFieldErrors: () => setFieldErrors({}),
  };
}
