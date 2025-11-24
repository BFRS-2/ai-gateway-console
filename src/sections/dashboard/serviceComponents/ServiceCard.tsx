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
  CircularProgress,
  Drawer,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useMemo, useState } from "react";

import serviceManagementService from "src/api/services/serviceManagement.service";
import { serviceSchemas } from "./serviceschema";
import DynamicServiceForm, {
  ModelRow,
  ProviderRow,
} from "./dynamicServiceForm";
import addService, {
  SavedServiceConfig,
} from "src/api/services/addService.service";
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";
import { useSnackbar } from "notistack";
import { mergeWithSchemaInitial } from "src/utils/mergeServiceConfig";
import { ServiceKbManager } from "./ServiceKbManger";

export function ServiceCard({
  service,
  onOpen,
  onToggle,
  onSaveConfig,
  savedConfig,
  projectId,
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
  projectId?: string;
}) {
  const theme = useTheme();
  const downMd = useMediaQuery(theme.breakpoints.down("md"));

  const svcKey = (service.name || "").toLowerCase().trim();
  const schema = serviceSchemas[svcKey];

  const [open, setOpen] = useState(false);
  const [formVal, setFormVal] = useState<any>(() =>
    schema ? structuredClone(schema.initial) : {}
  );
  const [models, setModels] = useState<ModelRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const effectiveProjectId = projectId 

  const { enqueueSnackbar } = useSnackbar();

  const userRole = useSelector((state: RootState) => state.user.userRole);
  const userPermission = useSelector(
    (state: RootState) => state.user.userPermission
  );

  const isEdittingAllowed = useMemo(() => {
    if (userRole === "admin" || userRole === "owner") return true;
    if (userRole === "member" && userPermission === "write") return true;
    return false;
  }, [userRole, userPermission]);

  const computeInitialForm = () => {
    if (!schema) return {};
    if (savedConfig && savedConfig.service?.toLowerCase?.() === svcKey) {
      return mergeWithSchemaInitial(schema.initial, {
        service: savedConfig.service,
        config: savedConfig.config,
        limits: savedConfig.limits,
        enabled: savedConfig.enabled,
      });
    }
    return structuredClone(schema.initial);
  };

  const openConfigDrawer = () => {
    setFormVal(computeInitialForm());
    setOpen(true);
  };

  const handleEnable = (enabled: boolean) => {
    if (enabled) {
      if (!schema) {
        console.error(`No schema for service "${svcKey}"`);
        return;
      }
      openConfigDrawer();
      return;
    } else {
      openConfigDrawer();
    }
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    Promise.all([
      serviceManagementService.getAllModels(),
      serviceManagementService.getAllProviders(),
    ])
      .then(([modelsRes, providersRes]) => {
        const modelList: ModelRow[] = modelsRes?.data ?? [];
        const allowedModels = modelList.filter((m) => {
          const normalizedVals = m.allowed_services.map((items) =>
            items.toLowerCase()
          );
          return normalizedVals.includes(svcKey);
        });
        const providerList: ProviderRow[] = providersRes?.data ?? [];
        setModels(Array.isArray(allowedModels) ? allowedModels : []);
        setProviders(Array.isArray(providerList) ? providerList : []);
      })
      .finally(() => setLoading(false));
  }, [open, svcKey]);

  const handleSubmit = async () => {
    if (!effectiveProjectId) {
      enqueueSnackbar("No project selected", { variant: "warning" });
      return;
    }

    const fn = service.is_active
      ? addService.updateService
      : addService.addToProject;

    fn(effectiveProjectId, {
      ...formVal,
      service_id: service.id,
    })
      .then(async (res) => {
        if (res?.success) {
          enqueueSnackbar("Service configuration saved", {
            variant: "success",
          });

          const latestSaved =
            res?.data ??
            ({
              service: svcKey,
              config: formVal.config,
              limits: formVal.limits,
              enabled: true,
            } as any);

          if (schema) {
            setFormVal(mergeWithSchemaInitial(schema.initial, latestSaved));
          }

          await onSaveConfig();
          onToggle(service, true);
          setOpen(false);
        } else {
          const errors = Object.keys(res?.error?.payload?.errors || {});
          if (Array.isArray(errors) && errors.length) {
            errors.forEach((key: any) => {
              enqueueSnackbar(
                res.error?.payload?.errors?.[key] ||
                  "Error saving service configuration",
                { variant: "error" }
              );
            });
          } else {
            enqueueSnackbar(
              res?.error?.payload?.message ||
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
        <CardHeader title={service.name} />
        <CardContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, whiteSpace: "pre-wrap" }}
          >
            {service.description || "No description"}
          </Typography>
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
          action={
            isEdittingAllowed && (
              <FormControlLabel
                control={
                  <Switch
                    checked={service.is_active}
                    onChange={(_, v) => handleEnable(v)}
                  />
                }
                label={service.is_active ? "Enabled" : "Disabled"}
              />
            )
          }
        />
        <CardContent>
          {service.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, whiteSpace: "pre-wrap" }}
            >
              {service.description}
            </Typography>
          )}

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {service?.models?.slice(0, 3).map((m) => (
              <Chip
                key={m.id}
                label={m.displayName}
                size="small"
                variant="outlined"
              />
            ))}
            {service?.models && service.models.length > 3 && (
              <Chip
                size="small"
                label={`+${service.models.length - 3} models`}
              />
            )}
          </Stack>

          {!!service?.useCases?.length && (
            <Typography variant="caption" color="text.secondary">
              Use cases: {service.useCases.join(" • ")}
            </Typography>
          )}

          {service.name === "Chatbot" && isEdittingAllowed && (
            <Box sx={{ mt: 2 }}>
              <ServiceKbManager
                projectId={effectiveProjectId}
                disabled={!isEdittingAllowed}
              />
            </Box>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              size="small"
              variant="contained"
              endIcon={<LaunchIcon />}
              onClick={() => onOpen(service)}
            >
              Open Docs
            </Button>
            {isEdittingAllowed && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={openConfigDrawer}
              >
                Configure
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Drawer for Configure */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(2px)",
            },
          },
        }}
        PaperProps={{
          sx: (t) => ({
            width: downMd ? "100%" : "77vw",
            maxWidth: "100%",
            height: "100dvh",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid",
            borderColor:
              t.palette.mode === "dark" ? "rgba(255,255,255,0.10)" : "divider",
            boxShadow:
              t.palette.mode === "dark"
                ? "-28px 0 56px rgba(0,0,0,0.6), -1px 0 0 rgba(255,255,255,0.06)"
                : "-24px 0 48px rgba(0,0,0,0.25)",
            backgroundImage:
              t.palette.mode === "dark"
                ? "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00))"
                : "none",
          }),
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            left: -16,
            top: 0,
            bottom: 0,
            width: 16,
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" noWrap>
            Configure: {service.name}
          </Typography>
          <IconButton onClick={() => setOpen(false)} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            pb: 10,
            "&::-webkit-scrollbar": { width: 8 },
            "&::-webkit-scrollbar-thumb": {
              borderRadius: 8,
            },
          }}
        >
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
              submitLabel="Save"
            />
          )}
        </Box>
      </Drawer>
    </>
  );
}
