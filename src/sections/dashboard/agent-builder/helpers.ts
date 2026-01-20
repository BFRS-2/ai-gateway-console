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

export const mapServiceValidationErrors = (
  errors: Record<string, unknown>
): Record<string, string> => {
  const next: Record<string, string> = {};
  Object.entries(errors).forEach(([rawKey, value]) => {
    const key = rawKey.replace(/^config\./, "");
    const message = Array.isArray(value)
      ? value.filter(Boolean).join(", ")
      : value
      ? String(value)
      : "";
    if (!message) return;
    const mappedKey = SERVICE_FIELD_ERROR_MAP[key] ||
      SERVICE_FIELD_ERROR_MAP[rawKey] ||
      key;
    next[mappedKey] = message;
  });
  return next;
};
