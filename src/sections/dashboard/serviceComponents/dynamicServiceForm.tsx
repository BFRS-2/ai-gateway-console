// components/services/DynamicServiceForm.tsx
"use client";

import {
  Box,
  Stack,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  MenuItem,
  Select,
  Chip,
  OutlinedInput,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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
  name: string;
  status: "active" | string;
}

/** Inline label with optional help tooltip */
function LabelWithHelp({
  label,
  helpText,
  variant = "caption",
}: {
  label: string;
  helpText?: string;
  variant?: "body2" | "caption" | "subtitle2";
}) {
  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      <Typography variant={variant} sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      {helpText ? (
        <Tooltip title={helpText} placement="top" arrow>
          <IconButton size="small" sx={{ p: 0.25 }}>
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Stack>
  );
}

export default function DynamicServiceForm({
  schema,
  serviceKey,
  models,
  providers,
  value,
  onChange,
  onSubmit,
  submitLabel = "Save",
}: {
  schema: ServiceSchema;
  serviceKey: string;
  models: ModelRow[];
  providers: ProviderRow[];
  value: JsonObj;
  onChange: (next: JsonObj) => void;
  onSubmit: () => void;
  submitLabel?: string;
}) {
  const [errors, setErrors] = useState<Record<Path, string>>({});

  // models filtered by service
  const allowedModels = useMemo(
    () =>
      (models || [])
        .filter(
          (m) =>
          {
            const normalizedVals = m.allowed_services.map((items) =>
            items.toLowerCase()
          );
          return normalizedVals.includes(serviceKey) && m?.status === "active";
        }
        )
        .map((m) => ({ label: m.name, value: m.name, provider: m.provider })),
    [models, serviceKey]
  );

  // providers active
  const providerOptions = useMemo(
    () =>
      (providers || [])
        .filter((p) => p?.status === "active")
        .map((p) => ({ label: p.name, value: p.name })),
    [providers]
  );

  // auto sync provider
  useEffect(() => {
    const syncProvider = (modelPath: Path, providerPath: Path) => {
      const modelName: any = getByPath(value, modelPath);
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
  }, [
    value?.config?.default_model,
    value?.config?.backup_model,
    allowedModels,
  ]);

  const fieldOptions = (fieldPath: Path, f: FieldSchema) => {
    if (f.options?.length) return f.options;
    if (f.dynamic === "models") {
      const providerPath = modelProviderMap[fieldPath];
      const providerValue = providerPath ? getByPath(value, providerPath) : "";
      const filteredModels = providerValue
        ? allowedModels.filter((m) => m.provider === providerValue.toString())
        : allowedModels;
      return filteredModels.map(({ label, value }) => ({ label, value }));
    }
    if (f.dynamic === "providers") return providerOptions;
    return [];
  };

  const providerModelMap: Record<Path, Path> = {
    "config.default_provider": "config.default_model",
    "config.backup_provider": "config.backup_model",
  };
  const modelProviderMap: Record<Path, Path> = {
    "config.default_model": "config.default_provider",
    "config.backup_model": "config.backup_provider",
  };

  const handleProviderChange = (providerPath: Path, providerValue: string) => {
    const modelPath = providerModelMap[providerPath];
    let next = setByPath(value, providerPath, providerValue);

    if (!modelPath) {
      onChange(next);
      return;
    }

    const currentModel = getByPath(value, modelPath);
    const currentModelProvider = allowedModels.find(
      (m) => m.value === currentModel.toString()
    )?.provider;
    const nextModel = allowedModels.find(
      (m) => m.provider === providerValue
    )?.value;

    if (!currentModel || currentModelProvider !== providerValue) {
      next = setByPath(next, modelPath, nextModel ?? "");
    }

    onChange(next);
  };

  const validate = () => {
    const e: Record<Path, string> = {};
    Object.entries(schema.fields).forEach(([path, f]) => {
      const v: any = getByPath(value, path);

      if (f.required) {
        const isEmpty =
          v === undefined ||
          v === null ||
          v === "" ||
          (Array.isArray(v) && v.length === 0);
        if (isEmpty) e[path] = `${f.label || path} is required`;
      }

      if ((f.type === "number" || f.type === "slider") && v != null) {
        if (f.min != null && v < f.min)
          e[path] = `${f.label || path} must be ≥ ${f.min}`;
        if (f.max != null && v > f.max)
          e[path] = `${f.label || path} must be ≤ ${f.max}`;
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit();
  };

  const helper = (path: Path, f: FieldSchema) => errors[path] ?? f.helpText ?? "";

  const renderField = (path: Path, f: FieldSchema) => {
    const v = getByPath(value, path);
    const label = f.label || path.split(".").slice(-1)[0];
    const opts = fieldOptions(path, f);

    switch (f.type) {
      case "text":
        return (
          <TextField
            fullWidth
            size="small"
            label={
              <LabelWithHelp
                label={label}
                helpText={f.helpText}
                variant="body2"
              />
            }
            placeholder={f.placeholder}
            value={v ?? f.default ?? ""}
            onChange={(e) => onChange(setByPath(value, path, e.target.value))}
            error={!!errors[path]}
            helperText={helper(path, f)}
          />
        );

      case "textarea":
        return (
          <Box sx={{ gridColumn: "1 / -1" }}>
            <TextField
              fullWidth
              size="small"
              label={
                <LabelWithHelp
                  label={label}
                  helpText={f.helpText}
                  variant="body2"
                />
              }
              placeholder={f.placeholder}
              value={v ?? f.default ?? ""}
              onChange={(e) => onChange(setByPath(value, path, e.target.value))}
              error={!!errors[path]}
              helperText={helper(path, f)}
              multiline
              minRows={3}
            />
          </Box>
        );

      case "number":
        return (
          <TextField
            fullWidth
            size="small"
            label={
              <LabelWithHelp
                label={label}
                helpText={f.helpText}
                variant="body2"
              />
            }
            type="number"
            inputProps={{ min: f.min, max: f.max, step: f.step ?? 1 }}
            value={v ?? f.default ?? ""}
            onChange={(e) =>
              onChange(setByPath(value, path, Number(e.target.value)))
            }
            error={!!errors[path]}
            helperText={helper(path, f)}
          />
        );

      case "switch":
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(v ?? f.default ?? false)}
                onChange={(_, checked) =>
                  onChange(setByPath(value, path, checked))
                }
              />
            }
            label={
              <LabelWithHelp
                label={label}
                helpText={f.helpText}
                variant="body2"
              />
            }
          />
        );

      case "slider": {
        // force 0–1 for temperature (even if schema forgets)
        const isTemperature = path.includes("temperature");
        const min = isTemperature ? 0 : f.min ?? 0;
        const max = isTemperature ? 1 : f.max ?? 1;
        const step = f.step ?? (isTemperature ? 0.01 : 0.1);
        const current = Number(v ?? f.default ?? 0);

        return (
          <Box>
            <LabelWithHelp
              label={`${label}: ${current}`}
              helpText={f.helpText}
            />
            <Slider
              size="small"
              value={current}
              min={min}
              max={max}
              step={step}
              onChange={(_, val) =>
                onChange(setByPath(value, path, val as number))
              }
            />
            {helper(path, f) && !errors[path] && (
              <Typography variant="caption" color="text.secondary">
                {f.helpText}
              </Typography>
            )}
            {errors[path] && (
              <Typography variant="caption" color="error">
                {errors[path]}
              </Typography>
            )}
          </Box>
        );
      }

      case "dropdown":
        const isModelDropdown = f.dynamic === "models";
        const noModelAvailable = isModelDropdown && opts.length === 0;
        return (
          <TextField
            select
            fullWidth
            size="small"
            label={
              <LabelWithHelp
                label={label}
                helpText={f.helpText}
                variant="body2"
              />
            }
            value={v ?? f.default ?? ""}
            onChange={(e) => {
              const nextValue = e.target.value;
              if (f.dynamic === "providers") {
                handleProviderChange(path, String(nextValue));
                return;
              }
              onChange(setByPath(value, path, nextValue));
            }}
            disabled={noModelAvailable}
            SelectProps={
              isModelDropdown
                ? {
                    displayEmpty: true,
                    renderValue: (selected) => {
                      if (!selected) {
                        return noModelAvailable
                          ? "No model available"
                          : "Select…";
                      }
                      return selected as string;
                    },
                  }
                : undefined
            }
            error={!!errors[path]}
            helperText={helper(path, f)}
          >
            {opts.length ? (
              opts.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                No model available
              </MenuItem>
            )}
          </TextField>
        );

      case "multiselect":
        return (
          <Box>
            <LabelWithHelp label={label} helpText={f.helpText} />
            <Select
              multiple
              fullWidth
              displayEmpty
              value={(v as string[]) ?? (f.default as string[]) ?? []}
              input={<OutlinedInput size="small" />}
              onChange={(e) => onChange(setByPath(value, path, e.target.value))}
              renderValue={(selected) =>
                (selected as string[]).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Select…
                  </Typography>
                ) : (
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {(selected as string[]).map((s) => (
                      <Chip key={s} label={s} size="small" />
                    ))}
                  </Stack>
                )
              }
              size="small"
            >
              {opts.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            {helper(path, f) && (
              <Typography
                variant="caption"
                color={errors[path] ? "error" : "text.secondary"}
              >
                {helper(path, f)}
              </Typography>
            )}
          </Box>
        );

      case "chips":
        return (
          <Box>
            <LabelWithHelp label={label} helpText={f.helpText} />
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ my: 1 }}>
              {(Array.isArray(v) ? v : (f.default as string[]) ?? []).map(
                (s: string, i: number) => (
                  <Chip
                    key={`${s}-${i}`}
                    label={s}
                    onDelete={() => {
                      const next = (Array.isArray(v) ? v : []).filter(
                        (x) => x !== s
                      );
                      onChange(setByPath(value, path, next));
                    }}
                    size="small"
                  />
                )
              )}
            </Stack>
            <TextField
              size="small"
              placeholder="Type & press Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (!val) return;
                  const next = [
                    ...((Array.isArray(v) ? v : []) as string[]),
                    val,
                  ];
                  onChange(setByPath(value, path, next));
                  (e.target as HTMLInputElement).value = "";
                }
              }}
              fullWidth
            />
            {helper(path, f) && (
              <Typography
                variant="caption"
                color={errors[path] ? "error" : "text.secondary"}
              >
                {helper(path, f)}
              </Typography>
            )}
          </Box>
        );

      default:
        return (
          <TextField
            fullWidth
            size="small"
            label={
              <LabelWithHelp
                label={label}
                helpText={f.helpText}
                variant="body2"
              />
            }
            value={v ?? f.default ?? ""}
            onChange={(e) => onChange(setByPath(value, path, e.target.value))}
            error={!!errors[path]}
            helperText={helper(path, f)}
          />
        );
    }
  };

  // groups from schema.ui
  const uiGroups = schema.ui?.groups ?? [];
  const groupedFieldPaths = new Set<string>();
  uiGroups.forEach((g) => g.fields.forEach((p) => groupedFieldPaths.add(p)));

  const leftoverFields = Object.entries(schema.fields).filter(
    ([path]) => !groupedFieldPaths.has(path)
  );

  const containerStyle = schema.ui?.containerStyle ?? {
    width: "70vw",
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "16px 0 24px",
  };

  return (
    <Scrollbar>
      <Box sx={containerStyle}>
        <Stack spacing={1.5}>
          {/* groups */}
          {uiGroups.length > 0 &&
            uiGroups.map((group) => (
              <Box
                key={group.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {/* Group header with tooltip from description */}
                {(group.title || group.description) && (
                  <Stack direction="row" alignItems="center" gap={1}>
                    {group.title ? (
                      <Typography variant="subtitle1" sx={{ mb: 0.25 }}>
                        {group.title}
                      </Typography>
                    ) : null}
                    {group.description ? (
                      <Tooltip title={group.description} arrow placement="top">
                        <IconButton size="small" sx={{ p: 0.25 }}>
                          <InfoOutlinedIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Stack>
                )}

                {/* Optional visible subtext */}
                {group.description ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: -0.5 }}
                  >
                    {group.description}
                  </Typography>
                ) : null}

                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(260px, 1fr))",
                    ...(group.style || {}),
                  }}
                >
                  {group.fields.map((path) => {
                    const fs = schema.fields[path];
                    if (!fs) return null;
                    return (
                      <Box key={path} sx={{ minWidth: 0 }}>
                        {renderField(path, fs)}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}

          {/* leftovers */}
          {leftoverFields.length > 0 && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "background.paper",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                gap={1}
                sx={{ mb: 0.75 }}
              >
                <Typography variant="subtitle1">Other settings</Typography>
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",
                }}
              >
                {leftoverFields.map(([path, fs]) => (
                  <Box key={path}>{renderField(path, fs)}</Box>
                ))}
              </Box>
            </Box>
          )}

          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" onClick={handleSubmit}>
              {submitLabel}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Scrollbar>
  );
}
