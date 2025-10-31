// components/services/ServiceCard.tsx
"use client";

import {
  Card, CardHeader, CardContent, Stack, Chip, Switch, FormControlLabel,
  Typography, Button, Dialog, DialogContent, CircularProgress,
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import SettingsIcon from "@mui/icons-material/Settings";
import { useEffect, useMemo, useState } from "react";

import serviceManagementService from "src/api/services/serviceManagement.service";
import { serviceSchemas } from "./serviceschema";
import DynamicServiceForm, { ModelRow, ProviderRow } from "./dynamicServiceForm";
import addService, { SavedServiceConfig } from "src/api/services/addService.service";
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";
import { useSnackbar } from "notistack";
import { mergeWithSchemaInitial } from "src/utils/mergeServiceConfig";

export function ServiceCard({
  service,
  onOpen,
  onToggle,
  onSaveConfig,          // typically triggers a refetch above this card
  savedConfig,           // <-- pass the saved config object (or undefined)
}: {
  service: {
    id: string;
    name: string;
    description?: string;
    status?: string;
    is_active: boolean;
    models?: { id: string; displayName: string }[];
    useCases?: string[];
  };
  onOpen: (svc: any) => void;
  onToggle: (svc: any, enabled: boolean) => void;
  onSaveConfig: () => void | Promise<void>;
  savedConfig?: SavedServiceConfig;
}) {
  console.log("🚀 ~ ServiceCard ~ savedConfig:", savedConfig)
  const svcKey = (service.name || "").toLowerCase().trim();
  const schema = serviceSchemas[svcKey];

  const [open, setOpen] = useState(false);
  const [formVal, setFormVal] = useState<any>(() =>
    schema ? structuredClone(schema.initial) : {}
  );

  const [models, setModels] = useState<ModelRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedOrganizationProject = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );
  const { enqueueSnackbar } = useSnackbar();

  // --------- helpers ----------
  const computeInitialForm = () => {
    if (!schema) return {};
    // If we already have a saved configuration for this service, merge it
    if (savedConfig && savedConfig.service?.toLowerCase?.() === svcKey) {
      return mergeWithSchemaInitial(schema.initial, {
        // keep the same envelope as schema.initial
        service: savedConfig.service,
        config: savedConfig.config,
        limits: savedConfig.limits,
        enabled: savedConfig.enabled,
      });
    }
    return structuredClone(schema.initial);
  };

  const openConfigModal = () => {
    setFormVal(computeInitialForm());
    setOpen(true);
  };

  const handleEnable = (enabled: boolean) => {
    if (enabled) {
      if (!schema) {
        console.error(`No schema for service "${svcKey}"`);
        return;
      }
      openConfigModal();   // prefill (saved OR defaults), then open
      return;              // enable after Save
    }
    onToggle(service, false);
  };

  // --------- fetch models + providers on open ----------
  useEffect(() => {
    if (!open) return;
    setLoading(true);

    Promise.all([
      serviceManagementService.getAllModels(),
      serviceManagementService.getAllProviders(),
    ])
      .then(([modelsRes, providersRes]) => {
        const modelList: ModelRow[] = modelsRes?.data?.models ?? [];
        const providerList: ProviderRow[] = providersRes?.data?.providers ?? []
        setModels(Array.isArray(modelList) ? modelList : []);
        setProviders(Array.isArray(providerList) ? providerList : []);
      })
      .finally(() => setLoading(false));
  }, [open]);

  // --------- save handler ----------
  const handleSubmit = async () => {
    const fn = service.is_active ? addService.updateService : addService.addToProject;

    fn(selectedOrganizationProject?.projectId || "", {
      ...formVal,
      service_id: service.id,
    })
      .then(async (res) => {
        if (res?.success) {
          enqueueSnackbar("Service configuration saved", { variant: "success" });

          // If API returns the saved object, prefer it; else reuse formVal
          const latestSaved =
            res?.data ??
            { service: svcKey, config: formVal.config, limits: formVal.limits, enabled: true };

          // Optionally update local formVal to the canonical saved values
          setFormVal(mergeWithSchemaInitial(schema.initial, latestSaved));

          // Let parent refresh the cards list / savedConfig
          await onSaveConfig();

          onToggle(service, true); // activate now
          setOpen(false);
        } else {
          const errors = Object.keys(res?.error?.payload?.errors || {});
          if (Array.isArray(errors) && errors.length) {
            errors.forEach((key: any) => {
              enqueueSnackbar(
                res.error?.payload?.errors?.[key] || "Error saving service configuration",
                { variant: "error" }
              );
            });
          } else {
            enqueueSnackbar(
              res?.error?.payload?.message || "Error saving service configuration",
              { variant: "error" }
            );
          }
        }
      })
      .catch((err) => {
        console.error("Error saving service configuration:", err);
        enqueueSnackbar("Error saving service configuration", { variant: "error" });
      });
  };

  if (!schema) {
    return (
      <Card variant="outlined">
        <CardHeader title={service.name} subheader={service.description} />
        <CardContent>
          <Typography variant="body2" color="error">
            Missing schema for “{service.name}”. Ensure serviceSchemas has a “{svcKey}” key.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader
          title={service.name}
          subheader={service.description}
          action={
            <FormControlLabel
              control={
                <Switch
                  checked={service.is_active}
                  onChange={(_, v) => handleEnable(v)}
                />
              }
              label={service.is_active ? "Enabled" : "Disabled"}
            />
          }
        />
        <CardContent>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {service?.models?.slice(0, 3).map((m) => (
              <Chip key={m.id} label={m.displayName} size="small" variant="outlined" />
            ))}
            {service?.models?.length! > 3 && (
              <Chip size="small" label={`+${(service?.models?.length || 0) - 3} models`} />
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Use cases: {service?.useCases?.join(" • ")}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button size="small" variant="contained" endIcon={<LaunchIcon />} onClick={() => onOpen(service)}>
              Open Docs
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={openConfigModal}       // <- uses savedConfig if present
            >
              Configure
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Loading models & providers…
              </Typography>
            </Stack>
          ) : (
            <DynamicServiceForm
              schema={schema}
              serviceKey={svcKey}
              models={models}
              providers={providers}
              value={formVal}
              onChange={setFormVal}
              onSubmit={handleSubmit}
              submitLabel="Save & Activate"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
