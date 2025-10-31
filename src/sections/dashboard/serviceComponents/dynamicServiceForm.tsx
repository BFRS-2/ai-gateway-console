// components/services/DynamicServiceForm.tsx
"use client";

import {
  Box, Stack, TextField, Typography, Switch, FormControlLabel,
  Slider, Button, MenuItem, Select, Chip, OutlinedInput
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { FieldSchema, Path, ServiceSchema } from "./serviceschema";
import { Scrollbar } from "src/components/scrollbar";

type JsonObj = Record<string, any>;

function getByPath(obj: JsonObj, path: Path) {
  return path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}
function setByPath(obj: JsonObj, path: Path, value: any) {
  const keys = path.split(".");
  const next = { ...obj };
  let cur: any = next;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value;
    else {
      cur[k] = { ...(cur[k] ?? {}) };
      cur = cur[k];
    }
  });
  return next;
}

export interface ModelRow {
  id: string;
  name: string;
  provider: string;
  allowed_services: string[];
  status: "active" | string;
}

export interface ProviderRow {
  id: string;
  name: string;   // "openai" | "gemini" | ...
  status: "active" | string;
}

export default function DynamicServiceForm({
  schema,
  serviceKey,             // "inference" | "embedding" | ...
  models,
  providers,              // <-- NEW: providers from API
  value,
  onChange,
  onSubmit,
  submitLabel = "Save & Activate",
}: {
  schema: ServiceSchema;
  serviceKey: string;
  models: ModelRow[];
  providers: ProviderRow[];    // <-- NEW
  value: JsonObj;
  onChange: (next: JsonObj) => void;
  onSubmit: () => void;
  submitLabel?: string;
}) {
  const [errors, setErrors] = useState<Record<Path, string>>({});

  // Active models filtered by service
  const allowedModels = useMemo(
    () =>
      (models || [])
        .filter(
          (m) =>
            m?.status === "active" &&
            Array.isArray(m.allowed_services) &&
            m.allowed_services.includes(serviceKey)
        )
        .map((m) => ({ label: m.name, value: m.name, provider: m.provider })), // using model "name" as value
    [models, serviceKey]
  );

  // Active providers straight from API
  const providerOptions = useMemo(
    () =>
      (providers || [])
        .filter((p) => p?.status === "active")
        .map((p) => ({ label: p.name, value: p.name })),
    [providers]
  );

  // Auto-fill provider when a model is picked and provider is empty
  useEffect(() => {
    const syncProvider = (modelPath: Path, providerPath: Path) => {
      const modelName = getByPath(value, modelPath);
      const providerName = getByPath(value, providerPath);
      if (!modelName) return;

      const model = allowedModels.find((m) => m.value === modelName);
      if (model && !providerName) {
        onChange(setByPath(value, providerPath, model.provider));
      }
    };

    syncProvider("config.default_model", "config.default_provider");
    syncProvider("config.backup_model", "config.backup_provider");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.config?.default_model, value?.config?.backup_model, allowedModels]);

  // Resolve field options
  const fieldOptions = (f: FieldSchema) => {
    if (f.options?.length) return f.options; // static override
    if (f.dynamic === "models") return allowedModels.map(({ label, value }) => ({ label, value }));
    if (f.dynamic === "providers") return providerOptions;
    return [];
  };

  // Validation (limits required + your other required fields)
  const validate = () => {
    const e: Record<Path, string> = {};
    Object.entries(schema.fields).forEach(([path, f]) => {
      const v = getByPath(value, path);

      if (f.required) {
        const isEmpty =
          v === undefined ||
          v === null ||
          v === "" ||
          (Array.isArray(v) && v.length === 0);
        if (isEmpty) e[path] = `${f.label || path} is required`;
      }

      if (f.type === "number" && v != null) {
        if (f.min != null && v < f.min) e[path] = `${f.label || path} must be ≥ ${f.min}`;
        if (f.max != null && v > f.max) e[path] = `${f.label || path} must be ≤ ${f.max}`;
      }

      if (f.type === "slider" && v != null) {
        if (f.min != null && v < f.min) e[path] = `${f.label || path} must be ≥ ${f.min}`;
        if (f.max != null && v > f.max) e[path] = `${f.label || path} must be ≤ ${f.max}`;
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit();
  };

  const renderField = (path: Path, f: FieldSchema) => {
    const v = getByPath(value, path);
    const label = f.label || path.split(".").slice(-1)[0];
    const opts = fieldOptions(f);

    switch (f.type) {
      case "text":
        return (
          <TextField fullWidth size="small" label={label} placeholder={f.placeholder}
            value={v ?? f.default ?? ""} onChange={(e) => onChange(setByPath(value, path, e.target.value))}
            error={!!errors[path]} helperText={errors[path]}
          />
        );
      case "textarea":
        return (
          <TextField fullWidth size="small" label={label} placeholder={f.placeholder}
            value={v ?? f.default ?? ""} onChange={(e) => onChange(setByPath(value, path, e.target.value))}
            error={!!errors[path]} helperText={errors[path]}
            multiline minRows={3}
          />
        );
      case "number":
        return (
          <TextField fullWidth size="small" label={label} type="number"
            inputProps={{ min: f.min, max: f.max, step: f.step ?? 1 }}
            value={v ?? f.default ?? ""} onChange={(e) => onChange(setByPath(value, path, Number(e.target.value)))}
            error={!!errors[path]} helperText={errors[path]}
          />
        );
      case "switch":
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(v ?? f.default ?? false)}
                onChange={(_, checked) => onChange(setByPath(value, path, checked))}
              />
            }
            label={label}
          />
        );
      case "slider":
        return (
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {label}: <b>{v ?? f.default ?? 0}</b>
            </Typography>
            <Slider size="small"
              value={Number(v ?? f.default ?? 0)}
              min={f.min ?? 0} max={f.max ?? 1} step={f.step ?? 0.1}
              onChange={(_, val) => onChange(setByPath(value, path, val as number))}
            />
            {errors[path] && <Typography variant="caption" color="error">{errors[path]}</Typography>}
          </Box>
        );
      case "dropdown":
        return (
          <TextField select fullWidth size="small" label={label}
            value={v ?? f.default ?? ""} onChange={(e) => onChange(setByPath(value, path, e.target.value))}
            error={!!errors[path]} helperText={errors[path]}
          >
            {opts.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        );
      case "multiselect":
        return (
          <Select multiple fullWidth displayEmpty
            value={(v as string[]) ?? (f.default as string[]) ?? []}
            input={<OutlinedInput size="small" />}
            onChange={(e) => onChange(setByPath(value, path, e.target.value))}
            renderValue={(selected) =>
              (selected as string[]).length === 0 ? (
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              ) : (
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {(selected as string[]).map((s) => <Chip key={s} label={s} size="small" />)}
                </Stack>
              )
            }
            size="small"
          >
            {opts.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        );
      case "chips":
        return (
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>{label}</Typography>
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ my: 1 }}>
              {(Array.isArray(v) ? v : (f.default as string[]) ?? []).map((s: string, i: number) => (
                <Chip key={`${s}-${i}`} label={s} onDelete={() => {
                  const next = (Array.isArray(v) ? v : []).filter((x) => x !== s);
                  onChange(setByPath(value, path, next));
                }} size="small" />
              ))}
            </Stack>
            <TextField
              size="small" placeholder="Type & press Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (!val) return;
                  const next = [...((Array.isArray(v) ? v : []) as string[]), val];
                  onChange(setByPath(value, path, next));
                  (e.target as HTMLInputElement).value = "";
                }
              }}
              fullWidth
            />
            {errors[path] && <Typography variant="caption" color="error">{errors[path]}</Typography>}
          </Box>
        );
      default:
        return (
          <TextField fullWidth size="small" label={label}
            value={v ?? f.default ?? ""} onChange={(e) => onChange(setByPath(value, path, e.target.value))}
          />
        );
    }
  };

  // group panels
  const groups = useMemo(() => {
    const g: Record<string, { path: Path; schema: FieldSchema }[]> = {};
    Object.entries(schema.fields).forEach(([path, fs]) => {
      const top = path.split(".")[0];
      g[top] ||= [];
      g[top].push({ path, schema: fs });
    });
    return g;
  }, [schema.fields]);

  return (
    <Scrollbar>
    <Stack spacing={3} sx={{ width: 640, maxWidth: "100%" }}>
      <Typography variant="h6">{schema.title}</Typography>

      {Object.entries(groups).map(([group, fields]) => (
        <Box key={group} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, textTransform: "capitalize" }}>
            {group}
          </Typography>
          <Stack spacing={2}>
            {fields.map(({ path, schema }) => (
              <Box key={path}>{renderField(path, schema)}</Box>
            ))}
          </Stack>
        </Box>
      ))}

      <Stack direction="row" gap={1} justifyContent="flex-end">
        <Button variant="contained" onClick={handleSubmit}>{submitLabel}</Button>
      </Stack>
    </Stack>
    </Scrollbar>
  );
}
