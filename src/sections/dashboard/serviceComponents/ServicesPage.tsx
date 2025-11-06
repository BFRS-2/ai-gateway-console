"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { Service, ServiceKind } from "./types";
import { ServiceCard } from "./ServiceCard";
// if your existing details component is very dialog-specific, you can inline its JSX here.
// import ServiceDetailsDialog from "./ServiceDetailsDrawer";
import serviceManagementService from "src/api/services/serviceManagement.service";
import projectService from "src/api/services/project.service";
import { SavedServiceConfig } from "src/api/services/addService.service";

const KIND_FILTER: ("All" | ServiceKind)[] = [
  "All",
  "ocr",
  "summarization",
  "embeddings",
  "voice",
  "chatbot",
];

const STATUS_FILTER: ("All" | "enabled" | "disabled")[] = [
  "All",
  "enabled",
  "disabled",
];

type ServicesPageProps = {
  projectId?: string; // optional override
};

export function ServicesPage({ projectId: projectIdProp }: ServicesPageProps) {
  const theme = useTheme();
  const downMd = useMediaQuery(theme.breakpoints.down("md"));

  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"All" | ServiceKind>("All");
  const [status, setStatus] = useState<"All" | "enabled" | "disabled">("All");

  // this is the selected service to show in the drawer
  const [drawerService, setDrawerService] = useState<Service | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [activeServices, setActiveServices] = useState<SavedServiceConfig[]>([]);

  const effectiveProjectId = projectIdProp || "";

  const getServices = () => {
    if (!effectiveProjectId) return;
    serviceManagementService.getAllServices(effectiveProjectId).then((data) => {
      if (data.success) {
        setServices(data.data.services);
      } else {
        setServices([]);
      }
    });
  };

  const getProjectServices = () => {
    if (!effectiveProjectId) return;
    projectService.getProjectServices(effectiveProjectId).then((data) => {
      if (data.success) {
        setActiveServices(data.data.services);
      } else {
        setActiveServices([]);
      }
    });
  };

  useEffect(() => {
    if (effectiveProjectId) {
      getServices();
      getProjectServices();
    } else {
      setServices([]);
      setActiveServices([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveProjectId]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return services.filter((svc) => {
      const textOk =
        !s ||
        svc.name.toLowerCase().includes(s) ||
        svc.description.toLowerCase().includes(s);
      // const kindOk = kind === "All" || svc.kind === kind;
      const statusOk =
        status === "All" ||
        (status === "enabled" ? svc.is_active : !svc.is_active);
      return textOk && statusOk;
    });
  }, [services, search, kind, status]);

  const onToggle = (svc: Service, enabled: boolean) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === svc.id ? { ...s, is_active: enabled } : s
      )
    );
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Services</Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <TextField
            fullWidth
            placeholder="Search services"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as any)}
            sx={{ minWidth: 200 }}
          >
            {KIND_FILTER.map((k) => (
              <MenuItem key={k} value={k}>
                {k}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            sx={{ minWidth: 200 }}
          >
            {STATUS_FILTER.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {filtered.map((svc) => (
          <Grid item xs={12} sm={6} lg={4} key={svc.id}>
            <ServiceCard
              projectId={projectIdProp}
              service={svc}
              onOpen={(s) => setDrawerService(s)}
              onToggle={onToggle}
              onSaveConfig={() => {
                getServices();
                getProjectServices();
              }}
              savedConfig={activeServices.find(
                (as) => as.service_id === svc.id
              )}
            />
          </Grid>
        ))}
        {filtered.length === 0 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {effectiveProjectId
                ? "No services found"
                : "Select a project to view services"}
            </Typography>
          </Box>
        )}
      </Grid>

      {/* Right drawer instead of modal */}
      <Drawer
        anchor="right"
        open={!!drawerService}
        onClose={() => setDrawerService(null)}
        PaperProps={{
          sx: {
            width: downMd ? "100%" : "70vw",
            maxWidth: "100%",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6">
            {drawerService?.name || "Service details"}
          </Typography>
          <IconButton onClick={() => setDrawerService(null)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2, height: "100%", overflowY: "auto" }}>
          {/* 
            You can drop the internals of your old ServiceDetailsDialog here.
            For now, a placeholder:
          */}
          {drawerService ? (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {drawerService.description}
              </Typography>
              {/* put your config form / docs / tabs here */}
            </>
          ) : null}
        </Box>
      </Drawer>
    </Stack>
  );
}
