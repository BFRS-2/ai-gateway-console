import { useEffect } from "react";
import {
  Alert,
  Card,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BuilderConfig } from "../types";
import { ModelRow, ProviderRow } from "src/sections/dashboard/serviceComponents/dynamicServiceForm";
import LabelWithHelp from "./LabelWithHelp";
import { agentBuilderHelpTexts } from "../constants";

export default function ServiceStep({
  config,
  onChange,
  projectId,
  serviceSaving,
  models,
  providers,
  modelsLoading,
  providersLoading,
  modelsError,
  providersError,
  fieldErrors,
  onClearFieldError,
}: {
  config: BuilderConfig;
  onChange: (updater: (prev: BuilderConfig) => BuilderConfig) => void;
  projectId: string;
  serviceSaving: boolean;
  models: ModelRow[];
  providers: ProviderRow[];
  modelsLoading: boolean;
  providersLoading: boolean;
  modelsError: string | null;
  providersError: string | null;
  fieldErrors: Record<string, string>;
  onClearFieldError: (fieldKey: string) => void;
}) {
  const modelOptions = models.filter((model) => {
    const isAgentBuilder = /agent builder/i.test(model.name);
    return model.status === "active" && !isAgentBuilder;
  });
  const providerOptions = providers.filter(
    (provider) => provider.status === "active"
  );
  const defaultProviderError = fieldErrors.defaultProvider || "";
  const defaultModelError = fieldErrors.defaultModel || "";
  const backupProviderError = fieldErrors.backupProvider || "";
  const backupModelError = fieldErrors.backupModel || "";
  const temperatureError = fieldErrors.temperature || "";
  const dailyLimitError = fieldErrors.dailyLimit || "";
  const monthlyLimitError = fieldErrors.monthlyLimit || "";
  const dailyAlertError = fieldErrors.dailyAlert || "";
  const monthlyAlertError = fieldErrors.monthlyAlert || "";
  const defaultModelOptions = config.service.defaultProvider
    ? modelOptions.filter(
        (model) => model.provider === config.service.defaultProvider
      )
    : modelOptions;
  const backupModelOptions = config.service.backupProvider
    ? modelOptions.filter(
        (model) => model.provider === config.service.backupProvider
      )
    : modelOptions;
  const defaultModelShrink =
    Boolean(config.service.defaultModel) || !defaultModelOptions.length;
  const backupModelShrink =
    Boolean(config.service.backupModel) || !backupModelOptions.length;

  const handleDefaultProviderChange = (nextProvider: string) => {
    onChange((prev) => {
      const currentModel = prev.service.defaultModel;
      const currentProvider = modelOptions.find(
        (model) => model.name === currentModel
      )?.provider;
      const nextModel = modelOptions.find(
        (model) => model.provider === nextProvider
      )?.name;
      return {
        ...prev,
        service: {
          ...prev.service,
          defaultProvider: nextProvider,
          defaultModel:
            !currentModel || currentProvider !== nextProvider
              ? nextModel || ""
              : currentModel,
        },
      };
    });
  };

  const handleBackupProviderChange = (nextProvider: string) => {
    onChange((prev) => {
      const currentModel = prev.service.backupModel;
      const currentProvider = modelOptions.find(
        (model) => model.name === currentModel
      )?.provider;
      const nextModel = modelOptions.find(
        (model) => model.provider === nextProvider
      )?.name;
      return {
        ...prev,
        service: {
          ...prev.service,
          backupProvider: nextProvider,
          backupModel:
            !currentModel || currentProvider !== nextProvider
              ? nextModel || ""
              : currentModel,
        },
      };
    });
  };

  useEffect(() => {
    if (!modelOptions.length) return;
    const defaultModel = modelOptions.find(
      (model) => model.name === config.service.defaultModel
    );
    if (defaultModel && !config.service.defaultProvider) {
      onChange((prev) => ({
        ...prev,
        service: { ...prev.service, defaultProvider: defaultModel.provider },
      }));
    }
    const backupModel = modelOptions.find(
      (model) => model.name === config.service.backupModel
    );
    if (backupModel && !config.service.backupProvider) {
      onChange((prev) => ({
        ...prev,
        service: { ...prev.service, backupProvider: backupModel.provider },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modelOptions,
    config.service.defaultModel,
    config.service.backupModel,
    config.service.defaultProvider,
    config.service.backupProvider,
  ]);

  return (
    <Card sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack spacing={2.5}>
        {!projectId && (
          <Alert severity="warning">Select a project to continue.</Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(defaultProviderError)}>
              <InputLabel id="default-provider-label">
                <LabelWithHelp
                  label="Default provider"
                  helpText={agentBuilderHelpTexts.defaultProvider}
                />
              </InputLabel>
              <Select
                labelId="default-provider-label"
                label="Default provider"
                value={config.service.defaultProvider}
                onChange={(e) => {
                  onClearFieldError("defaultProvider");
                  onClearFieldError("defaultModel");
                  handleDefaultProviderChange(e.target.value as string);
                }}
                disabled={providersLoading || !providerOptions.length}
              >
                {providerOptions.map((provider) => (
                  <MenuItem key={provider.id} value={provider.name}>
                    {provider.name}
                  </MenuItem>
                ))}
              </Select>
              {defaultProviderError ? (
                <FormHelperText>{defaultProviderError}</FormHelperText>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(defaultModelError)}>
              <InputLabel id="default-model-label" shrink={defaultModelShrink}>
                <LabelWithHelp
                  label="Default model"
                  helpText={agentBuilderHelpTexts.defaultModel}
                />
              </InputLabel>
              <Select
                labelId="default-model-label"
                label="Default model"
                value={config.service.defaultModel}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return defaultModelOptions.length ? "" : "No model available";
                  }
                  return selected;
                }}
                onChange={(e) => {
                  onClearFieldError("defaultModel");
                  onChange((prev) => ({
                    ...prev,
                    service: {
                      ...prev.service,
                      defaultModel: e.target.value as string,
                    },
                  }));
                }}
                disabled={modelsLoading || !defaultModelOptions.length}
              >
                {defaultModelOptions.length ? (
                  defaultModelOptions.map((model) => (
                    <MenuItem key={model.id} value={model.name}>
                      {model.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No model available
                  </MenuItem>
                )}
              </Select>
              {defaultModelError ? (
                <FormHelperText>{defaultModelError}</FormHelperText>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(backupProviderError)}>
              <InputLabel id="backup-provider-label">
                <LabelWithHelp
                  label="Fallback provider"
                  helpText={agentBuilderHelpTexts.backupProvider}
                />
              </InputLabel>
              <Select
                labelId="backup-provider-label"
                label="Fallback provider"
                value={config.service.backupProvider}
                onChange={(e) => {
                  onClearFieldError("backupProvider");
                  onClearFieldError("backupModel");
                  handleBackupProviderChange(e.target.value as string);
                }}
                disabled={providersLoading || !providerOptions.length}
              >
                {providerOptions.map((provider) => (
                  <MenuItem key={provider.id} value={provider.name}>
                    {provider.name}
                  </MenuItem>
                ))}
              </Select>
              {backupProviderError ? (
                <FormHelperText>{backupProviderError}</FormHelperText>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(backupModelError)}>
              <InputLabel id="backup-model-label" shrink={backupModelShrink}>
                <LabelWithHelp
                  label="Fallback model"
                  helpText={agentBuilderHelpTexts.backupModel}
                />
              </InputLabel>
              <Select
                labelId="backup-model-label"
                label="Fallback model"
                value={config.service.backupModel}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return backupModelOptions.length ? "" : "No model available";
                  }
                  return selected;
                }}
                onChange={(e) => {
                  onClearFieldError("backupModel");
                  onChange((prev) => ({
                    ...prev,
                    service: {
                      ...prev.service,
                      backupModel: e.target.value as string,
                    },
                  }));
                }}
                disabled={modelsLoading || !backupModelOptions.length}
              >
                {backupModelOptions.length ? (
                  backupModelOptions.map((model) => (
                    <MenuItem key={model.id} value={model.name}>
                      {model.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No model available
                  </MenuItem>
                )}
              </Select>
              {backupModelError ? (
                <FormHelperText>{backupModelError}</FormHelperText>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={12}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" component="div">
                <LabelWithHelp
                  label="Temperature"
                  helpText={agentBuilderHelpTexts.temperature}
                />
              </Typography>
              <Slider
                value={config.service.temperature}
                min={0}
                max={1}
                step={0.05}
                color={temperatureError ? "error" : "primary"}
                onChange={(_, value) => {
                  onClearFieldError("temperature");
                  onChange((prev) => ({
                    ...prev,
                    service: { ...prev.service, temperature: value as number },
                  }));
                }}
                valueLabelDisplay="auto"
              />
              {temperatureError ? (
                <Typography variant="caption" color="error">
                  {temperatureError}
                </Typography>
              ) : null}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Limits</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={
                      <LabelWithHelp
                        label="Daily limit (in $)"
                        helpText={agentBuilderHelpTexts.dailyLimit}
                      />
                    }
                    type="number"
                    value={config.service.limits.daily}
                    onChange={(e) => {
                      onClearFieldError("dailyLimit");
                      onChange((prev) => ({
                        ...prev,
                        service: {
                          ...prev.service,
                          limits: {
                            ...prev.service.limits,
                            daily: Number(e.target.value),
                          },
                        },
                      }));
                    }}
                    error={Boolean(dailyLimitError)}
                    helperText={dailyLimitError}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={
                      <LabelWithHelp
                        label="Monthly limit (in $)"
                        helpText={agentBuilderHelpTexts.monthlyLimit}
                      />
                    }
                    type="number"
                    value={config.service.limits.monthly}
                    onChange={(e) => {
                      onClearFieldError("monthlyLimit");
                      onChange((prev) => ({
                        ...prev,
                        service: {
                          ...prev.service,
                          limits: {
                            ...prev.service.limits,
                            monthly: Number(e.target.value),
                          },
                        },
                      }));
                    }}
                    error={Boolean(monthlyLimitError)}
                    helperText={monthlyLimitError}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Alert limits</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={
                      <LabelWithHelp
                        label="Daily alert limit (in %)"
                        helpText={agentBuilderHelpTexts.dailyAlert}
                      />
                    }
                    type="number"
                    value={config.service.serviceAlertLimit.daily}
                    onChange={(e) => {
                      onClearFieldError("dailyAlert");
                      onChange((prev) => ({
                        ...prev,
                        service: {
                          ...prev.service,
                          serviceAlertLimit: {
                            ...prev.service.serviceAlertLimit,
                            daily: Number(e.target.value),
                          },
                        },
                      }));
                    }}
                    error={Boolean(dailyAlertError)}
                    helperText={dailyAlertError}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={
                      <LabelWithHelp
                        label="Monthly alert limit (in %)"
                        helpText={agentBuilderHelpTexts.monthlyAlert}
                      />
                    }
                    type="number"
                    value={config.service.serviceAlertLimit.monthly}
                    onChange={(e) => {
                      onClearFieldError("monthlyAlert");
                      onChange((prev) => ({
                        ...prev,
                        service: {
                          ...prev.service,
                          serviceAlertLimit: {
                            ...prev.service.serviceAlertLimit,
                            monthly: Number(e.target.value),
                          },
                        },
                      }));
                    }}
                    error={Boolean(monthlyAlertError)}
                    helperText={monthlyAlertError}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Stack>
          </Grid>
        </Grid>

        {serviceSaving && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Saving service configuration...
            </Typography>
          </Stack>
        )}

        {(modelsLoading || providersLoading) && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Loading models and providers...
            </Typography>
          </Stack>
        )}

        {modelsError && <Alert severity="error">{modelsError}</Alert>}
        {providersError && <Alert severity="error">{providersError}</Alert>}

        {!modelsLoading && !modelOptions.length && (
          <Alert severity="warning">No active models available.</Alert>
        )}

        {!providersLoading && !providerOptions.length && (
          <Alert severity="warning">No active providers available.</Alert>
        )}
      </Stack>
    </Card>
  );
}
