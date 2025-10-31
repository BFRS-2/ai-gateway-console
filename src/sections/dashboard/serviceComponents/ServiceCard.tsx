// components/services/ServiceCard.tsx
"use client";

import {
  Card,
  CardHeader,
  CardContent,
  Stack,
  Chip,
  Switch,
  FormControlLabel,
  Typography,
  Button,
  Dialog,
  DialogContent,
  CircularProgress,
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import SettingsIcon from "@mui/icons-material/Settings";
import { useEffect, useMemo, useState } from "react";

// ← import your real API client
import serviceManagementService from "src/api/services/serviceManagement.service";
import { serviceSchemas } from "./serviceschema";
import DynamicServiceForm, { ModelRow } from "./dynamicServiceForm";
import { ProviderRow } from "src/types";
import addService from "src/api/services/addService.service";
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";
import { useSnackbar } from "notistack";

export function ServiceCard({
  service, // { id, name, description, is_active, ... }
  onOpen, // open docs
  onToggle, // (svc, enabled)
  onSaveConfig, // (svc, config) => Promise<void> | void
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
  onSaveConfig: (svc: any, config: any) => void | Promise<void>;
}) {
  const svcKey = (service.name || "").toLowerCase().trim();
  const schema = serviceSchemas[svcKey];

  const [open, setOpen] = useState(false);
  const [formVal, setFormVal] = useState<any>(() =>
    schema ? structuredClone(schema.initial) : {}
  );

  const [models, setModels] = useState<ModelRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleEnable = (enabled: boolean) => {
    if (enabled) {
      if (!schema) {
        console.error(`No schema for service "${svcKey}"`);
        return;
      }
      setFormVal(structuredClone(schema.initial));
      setOpen(true);
      return; // enable after Save
    }
    onToggle(service, false);
  };

  // Fetch both lists when modal opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);

    Promise.all([
      serviceManagementService.getAllModels(),
      serviceManagementService.getAllProviders(),
    ])
      .then(([modelsRes, providersRes]) => {
        const modelList: ModelRow[] =
          modelsRes?.data?.models ?? modelsRes?.models ?? modelsRes ?? [];
        const providerList: ProviderRow[] =
          providersRes?.data?.providers ??
          providersRes?.providers ??
          providersRes ??
          [];
        setModels(Array.isArray(modelList) ? modelList : []);
        setProviders(Array.isArray(providerList) ? providerList : []);
      })
      .finally(() => setLoading(false));
  }, [open]);
  const selectedOrganizationProject = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );
  const { enqueueSnackbar } = useSnackbar();
  const handleSubmit = async () => {
    // await onSaveConfig(service, formVal); // store separately
    const svc = service;
    const config = formVal;
    // pick the concrete function reference to avoid indexing with a string
    const fn = svc.is_active
      ? addService.updateService
      : addService.addToProject;
    fn(selectedOrganizationProject?.projectId || "", {
      ...config,
      service_id: svc.id,
    })
      .then((res) => {
        console.log("🚀 ~ ServicesPage ~ res:", res);
        if (res.success) {
          enqueueSnackbar("Service configuration saved", {
            variant: "success",
          });
          onSaveConfig();
          onToggle(service, true); // activate now
          setOpen(false);
        } else {
          const errors = Object.keys(res.error?.payload?.errors);

          if (errors && Array.isArray(errors)) {
            errors.forEach((err: any) => {
              enqueueSnackbar(
                res.error?.payload?.errors[err] ||
                  "Error saving service configuration",
                { variant: "error" }
              );
            });
          } else {
            enqueueSnackbar(
              res.error?.payload?.message ||
                "Error saving service configuration",
              { variant: "error" }
            );
          }
        }
      })
      .catch((err) => {
        console.error("Error saving service configuration:", err);
        enqueueSnackbar("Error saving service configuration", {
          variant: "error",
        });
      });
  };

  if (!schema) {
    return (
      <Card variant="outlined">
        <CardHeader title={service.name} subheader={service.description} />
        <CardContent>
          <Typography variant="body2" color="error">
            Missing schema for “{service.name}”. Ensure serviceSchemas has a “
            {svcKey}” key.
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
              <Chip
                key={m.id}
                label={m.displayName}
                size="small"
                variant="outlined"
              />
            ))}
            {service?.models?.length > 3 && (
              <Chip
                size="small"
                label={`+${service?.models?.length - 3} models`}
              />
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Use cases: {service?.useCases?.join(" • ")}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              size="small"
              variant="contained"
              endIcon={<LaunchIcon />}
              onClick={() => onOpen(service)}
            >
              Open Docs
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => {
                setFormVal(structuredClone(schema.initial));
                setOpen(true);
              }}
            >
              Configure
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
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
              providers={providers} // <-- pass providers here
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
