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
  Skeleton,
  CircularProgress,
  alpha,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

import { Service } from "./types";
import { ServiceCard } from "./ServiceCard";
import serviceManagementService from "src/api/services/serviceManagement.service";
import projectService from "src/api/services/project.service";
import { SavedServiceConfig } from "src/api/services/addService.service";
import Markdown from "src/components/markdown";
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";

/* --------------------------------- Consts --------------------------------- */

const STATUS_FILTER: ("All" | "enabled" | "disabled")[] = [
  "All",
  "enabled",
  "disabled",
];

type ServicesPageProps = {
  projectId?: string;
};

/* ------------------------------ Helper: debounce --------------------------- */

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* ----------------------------- Hook: useMarkdown --------------------------- */

function useMarkdown(path?: string) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!path);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!path) {
        setContent(null);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(path, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load documentation");
        const text = await res.text();
        if (!cancelled) {
          setContent(text);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Unable to load documentation");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { content, loading, error };
}

/* ---------------------------- Component: MDViewer -------------------------- */

function MDViewer({ path, fallback }: { path?: string; fallback?: string }) {
  const { content, loading, error } = useMarkdown(path);

  if (!path) {
    return (
      <Typography variant="body2" color="text.secondary">
        {fallback || "No documentation path provided."}
      </Typography>
    );
  }

  if (loading) {
    // Loader: gradient banner + icon + skeleton lines
    return (
      <Stack spacing={2} sx={{ width: "100%" }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(
                theme.palette.primary.light,
                0.2
              )} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              display: "grid",
              placeItems: "center",
            }}
          >
            <DescriptionRoundedIcon fontSize="medium" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1">Fetching documentation…</Typography>
            <Typography variant="body2" color="text.secondary">
              Loading Markdown content for this service.
            </Typography>
          </Box>
          <CircularProgress size={24} />
        </Box>

        <Stack spacing={1}>
          <Skeleton variant="text" height={24} />
          <Skeleton variant="text" height={24} width="92%" />
          <Skeleton variant="text" height={24} width="88%" />
          <Skeleton
            variant="rectangular"
            height={140}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton variant="text" height={24} width="76%" />
          <Skeleton variant="text" height={24} width="70%" />
        </Stack>
      </Stack>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: (t) => alpha(t.palette.error.main, 0.06),
          border: (t) => `1px solid ${alpha(t.palette.error.main, 0.2)}`,
        }}
      >
        <Typography variant="subtitle2" color="error.main">
          Failed to load documentation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflowY: "hidden" }} className="docs_container">
      <Markdown>{content || ""}</Markdown>
    </Box>
  );
}

/* ------------------------------- Main Screen ------------------------------- */

export function ServicesPage({ projectId: projectIdProp }: ServicesPageProps) {
  const theme = useTheme();
  const downMd = useMediaQuery(theme.breakpoints.down("md"));

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | "enabled" | "disabled">("All");
  const [drawerService, setDrawerService] = useState<Service | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [activeServices, setActiveServices] = useState<SavedServiceConfig[]>(
    []
  );
  const [servicesLoading, setServicesLoading] = useState(false); // ← loader flag
  const [projectServicesLoading, setProjectServicesLoading] = useState(false); // (optional) separate flag

  const effectiveProjectId = projectIdProp || "";
  const debouncedSearch = useDebounced(search, 250);

  const getServices = async () => {
    if (!effectiveProjectId) return;
    setServicesLoading(true);
    try {
      const data = await serviceManagementService.getAllServices(
        effectiveProjectId
      );
      if (data?.success) setServices(data.data || []);
      else setServices([]);
    } catch {
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const getProjectServices = async () => {
    if (!effectiveProjectId) return;
    setProjectServicesLoading(true);
    try {
      const res = await projectService.getProjectServices(effectiveProjectId);
      if (res?.success) setActiveServices(res.data || []);
      else setActiveServices([]);
    } catch {
      setActiveServices([]);
    } finally {
      setProjectServicesLoading(false);
    }
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
    const s = debouncedSearch.trim().toLowerCase();
    return services.filter((svc) => {
      const textOk =
        !s ||
        svc.name.toLowerCase().includes(s) ||
        svc.description.toLowerCase().includes(s);
      const statusOk =
        status === "All" ||
        (status === "enabled" ? svc.is_active : !svc.is_active);
      return textOk && statusOk;
    });
  }, [services, debouncedSearch, status]);

  const onToggle = (svc: Service, enabled: boolean) => {
    setServices((prev) =>
      prev.map((s) => (s.id === svc.id ? { ...s, is_active: enabled } : s))
    );
  };

  // Build safe doc path: /docs/<normalized-name>.md
  const docPath = drawerService?.name
    ? `/docs/${drawerService.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "")}.md`
    : undefined;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>Services</Typography>

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
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ opacity: 0.7 }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            sx={{ minWidth: 200 }}
            disabled={servicesLoading}
          >
            {STATUS_FILTER.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {/* ---------- Grid: Loader / Data / Empty ---------- */}
      <Grid container spacing={2}>
        {/* Loader state with skeleton cards */}
        {servicesLoading && (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} lg={4} key={`skeleton-${i}`}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2, height: 180 }}
                >
                  <Stack spacing={1}>
                    <Skeleton variant="text" height={28} width="70%" />
                    <Skeleton variant="text" height={20} width="90%" />
                    <Skeleton variant="text" height={20} width="85%" />
                    <Skeleton
                      variant="rectangular"
                      height={72}
                      sx={{ borderRadius: 1 }}
                    />
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </>
        )}

        {/* Data state */}
        {!servicesLoading &&
          filtered.map((svc) => (
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

        {/* Empty state (only when not loading) */}
        {!servicesLoading && filtered.length === 0 && (
          <Grid item xs={12}>
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 2,
                border: (t) => `1px dashed ${alpha(t.palette.divider, 0.8)}`,
                bgcolor: (t) => alpha(t.palette.background.paper, 0.4),
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                {effectiveProjectId
                  ? "No services found"
                  : "No project selected"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {effectiveProjectId
                  ? "Try changing filters or search keywords."
                  : "Select a project to view its available services."}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Right drawer for details */}
      <Drawer
        anchor="right"
        open={!!drawerService}
        onClose={() => setDrawerService(null)}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: "rgba(0,0,0,0.44)",
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

        <Box sx={{ p: 2, height: "100%", overflowY: "auto" }} >
          {drawerService ? (
            <Stack spacing={2}>
              <MDViewer
                path={
                  drawerService?.name
                    ? `/docs/${drawerService.name
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-_]/g, "")}.md`
                    : undefined
                }
                fallback={drawerService?.description}
              />
              {/* Additional tabs/config forms can be added here */}
            </Stack>
          ) : null}
        </Box>
      </Drawer>
    </Stack>
  );
}
