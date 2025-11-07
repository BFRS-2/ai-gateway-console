// OverviewSection.tsx
"use client";

import {
  Alert,
  Box,
  Divider,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { DashboardContent } from "src/layouts/dashboard";
import { bgGradient } from "src/theme/styles";
import PaginatedTable from "./overviewComponents/paginatedTable";
import DataCard from "./overviewComponents/dataCard";
import { AppRequestsCostArea } from "./overviewComponents/appRequestCostArea";
import { AppCostByTeamDonut as AppCostByServiceDonut } from "./overviewComponents/appCostByTeamDonut";
import projectService from "src/api/services/project.service";
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";

// ---------- Types we’ll normalize to ----------
type LimitBlock = { daily: number; monthly: number };
type MetricBlock = { cost_used: number; requests: number; tokens_used: number };

type NormalizedServiceUsage = {
  service: string;
  service_id: string;
  limits: LimitBlock;
  daily: MetricBlock;
  month_to_date: MetricBlock;
};

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

type OverviewSectionProps = {
  projectId?: string;
  projectName?: string;
};

const OverviewSection = ({ projectId, projectName }: OverviewSectionProps) => {
  const theme = useTheme();

  // selected org + its projects from store
  const selectedFromStore = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );

  // all orgs with projects (to derive project list from current org)
  const allOrgProjects = useSelector(
    (state: RootState) => state.orgProject.organizationProjects
  );

  const initialOrgId = selectedFromStore?.organizationId || "";
  const initialProjects =
    selectedFromStore?.projects && selectedFromStore.projects.length
      ? selectedFromStore.projects
      : [];

  // caller may pass a projectId; otherwise default to "all"
  const initialProjectId = projectId || "all";

  // date defaults (last 30d)
  const today = new Date().toISOString().slice(0, 10);
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);
  const defaultStartStr = defaultStart.toISOString().slice(0, 10);

  const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId);
  const [selectedProjectId, setSelectedProjectId] =
    useState<string>(initialProjectId);
  const [startDate, setStartDate] = useState(defaultStartStr);
  const [endDate, setEndDate] = useState(today);

  const [rawUsage, setRawUsage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [tab, setTab] = useState(0);
  const [pServices, setPServices] = useState({ page: 0, rowsPerPage: 5 });

  // when store updates (user changed org in header), sync local
  useEffect(() => {
    if (selectedFromStore?.organizationId) {
      setSelectedOrgId(selectedFromStore.organizationId);
    }

    // if org changed and we were on a concrete project (not "all"), make sure it still exists
    if (selectedFromStore?.projects?.length && selectedProjectId !== "all") {
      const exists = selectedFromStore.projects.find(
        (p: any) => p.id === selectedProjectId
      );
      if (!exists) {
        setSelectedProjectId(selectedFromStore.projects[0].id);
      }
    }
  }, [selectedFromStore, selectedProjectId]);

  // project options for current org
  const projectOptions = useMemo(() => {
    if (allOrgProjects && allOrgProjects.length) {
      const currOrg = allOrgProjects.find((o: any) => o.id === selectedOrgId);
      if (currOrg) {
        return currOrg.projects || [];
      }
    }
    return initialProjects;
  }, [allOrgProjects, selectedOrgId, initialProjects]);

  // keep selected project valid (but allow "all")
  useEffect(() => {
    if (selectedProjectId === "all") return;
    if (!projectOptions.length) {
      setSelectedProjectId("all");
      return;
    }
    const exists = projectOptions.find((p: any) => p.id === selectedProjectId);
    if (!exists) {
      setSelectedProjectId(projectOptions[0].id);
    }
  }, [projectOptions, selectedProjectId]);

  // fetch usage when filters change
  useEffect(() => {
    setErr(null);
    setRawUsage(null);

    if (!selectedOrgId) return;

    setLoading(true);
    projectService
      .getUsage({
        project_id: selectedProjectId === "all" ? undefined : selectedProjectId,
        organization_id: selectedOrgId,
        start_date: startDate,
        end_date: endDate,
      })
      .then((res: any) => {
        if (res?.success && res?.data) {
          setRawUsage(res.data);
        } else {
          setErr("Could not load usage for this selection.");
        }
      })
      .catch((e: any) => {
        console.error("Usage fetch failed:", e);
        setErr("Failed to fetch usage. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [selectedProjectId, selectedOrgId, startDate, endDate]);

  // normalize services/projects list
  const normalizedServices: NormalizedServiceUsage[] = useMemo(() => {
    if (!rawUsage) return [];

    // 1) org-level shape: has `projects: [...]`
    if ("projects" in rawUsage && Array.isArray(rawUsage.projects)) {
      return rawUsage.projects.map((p: any) => ({
        service: p.project_name,
        service_id: p.project_id,
        limits: { daily: 0, monthly: 0 },
        daily: { cost_used: 0, requests: 0, tokens_used: 0 },
        month_to_date: {
          cost_used: p.date_range?.cost_used ?? 0,
          requests: p.date_range?.requests ?? 0,
          tokens_used: p.date_range?.tokens_used ?? 0,
        },
      }));
    }

    // 2) single-project new shape: has `services: [...]` + each service has `date_range`
    if ("services" in rawUsage && Array.isArray(rawUsage.services) && "date_range" in rawUsage) {
      return rawUsage.services.map((s: any) => ({
        service: s.service,
        service_id: s.service_id,
        limits: s.limits || { daily: 0, monthly: 0 },
        daily: { cost_used: 0, requests: 0, tokens_used: 0 }, // not available in this shape
        month_to_date: {
          cost_used: s.date_range?.cost_used ?? 0,
          requests: s.date_range?.requests ?? 0,
          tokens_used: s.date_range?.tokens_used ?? 0,
        },
      }));
    }

    // 3) legacy shape: has `services: [...]` with month_to_date
    if ("services" in rawUsage && Array.isArray(rawUsage.services)) {
      return rawUsage.services as NormalizedServiceUsage[];
    }

    return [];
  }, [rawUsage]);

  // derive KPI from whichever shape we got
  const kpis = useMemo(() => {
    // org-level and new project-level both have date_range
    if (rawUsage && "date_range" in rawUsage) {
      return {
        productsUsed: normalizedServices.length,
        totalReq: rawUsage.date_range?.requests ?? 0,
        totalCost: rawUsage.date_range?.cost_used ?? 0,
      };
    }

    // legacy
    if (rawUsage && "month_to_date" in rawUsage) {
      return {
        productsUsed: normalizedServices.length,
        totalReq: rawUsage.month_to_date?.requests ?? 0,
        totalCost: rawUsage.month_to_date?.cost_used ?? 0,
      };
    }

    return {
      productsUsed: 0,
      totalReq: 0,
      totalCost: 0,
    };
  }, [rawUsage, normalizedServices.length]);

  // chart data
  const areaData = useMemo(() => {
    const list =
      normalizedServices.map((s) => ({
        x: s.service,
        req: s.month_to_date?.requests ?? 0,
        cost: s.month_to_date?.cost_used ?? 0,
      })) ?? [];
    return list.length ? list : [{ x: "No data", req: 0, cost: 0 }];
  }, [normalizedServices]);

  const donutSeries = useMemo(() => {
    const series =
      normalizedServices.map((s) => ({
        label: s.service,
        value: s.month_to_date?.cost_used ?? 0,
      })) ?? [];
    return series.length ? series : [{ label: "No data", value: 1 }];
  }, [normalizedServices]);

  // table rows
  const servicesRows =
    normalizedServices.map((s) => [
      s.service,
      s.limits?.daily?.toLocaleString("en-IN") ?? "0",
      s.limits?.monthly?.toLocaleString("en-IN") ?? "0",
      s.daily?.requests?.toLocaleString("en-IN") ?? "0",
      s.daily?.tokens_used?.toLocaleString("en-IN") ?? "0",
      formatINR(s.daily?.cost_used ?? 0),
      s.month_to_date?.requests?.toLocaleString("en-IN") ?? "0",
      s.month_to_date?.tokens_used?.toLocaleString("en-IN") ?? "0",
      formatINR(s.month_to_date?.cost_used ?? 0),
    ]) ?? [];

  const selectedProjectName =
    selectedProjectId === "all"
      ? "All Projects"
      : projectOptions.find((p: any) => p.id === selectedProjectId)?.name ||
        projectName ||
        selectedProjectId;

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={4}>
        {err && <Alert severity="error">{err}</Alert>}

        {/* Filter row */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h4">Overview</Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="project-select-label">Project</InputLabel>
              <Select
                labelId="project-select-label"
                label="Project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {/* always show All Projects */}
                <MenuItem value="all">All Projects</MenuItem>
                {projectOptions.length ? (
                  projectOptions.map((p: any) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No projects
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Stack>

        {/* KPI cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <DataCard
              title="Products Used"
              value={kpis.productsUsed}
              icon="/assets/icons/navbar/ic-job.svg"
              loading={loading}
              styles={{
                background: bgGradient({
                  direction: "90deg",
                  startColor: "#D2FFE2",
                  endColor: "#64D48C",
                  imgUrl: "/assets/background/pattern.svg",
                  backgroundSize: "contain",
                }),
                value: { color: theme.palette.success.main },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <DataCard
              title="Requests (30d)"
              value={(kpis.totalReq || 0).toLocaleString("en-IN")}
              icon="/assets/icons/navbar/ic-menu-item.svg"
              loading={loading}
              styles={{
                background: bgGradient({
                  direction: "90deg",
                  startColor: "#E9E3FF",
                  endColor: "#8C6BFF",
                  imgUrl: "/assets/background/pattern.svg",
                  backgroundSize: "contain",
                }),
                value: { color: theme.palette.primary.main },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <DataCard
              title="Cost (30d)"
              value={formatINR(kpis.totalCost || 0)}
              icon="/assets/icons/navbar/ic-invoice.svg"
              loading={loading}
              styles={{
                background: bgGradient({
                  direction: "90deg",
                  startColor: "#FFE7D6",
                  endColor: "#FFAF7A",
                  imgUrl: "/assets/background/pattern.svg",
                  backgroundSize: "contain",
                }),
                value: { color: theme.palette.warning.main },
              }}
            />
          </Grid>
          {/* <Grid item xs={12} sm={6} md={3}>
            <DataCard
              title="p95 Latency"
              value={`— ms`}
              icon="/assets/icons/navbar/ic-tour.svg"
              loading={loading}
              styles={{
                background: bgGradient({
                  direction: "90deg",
                  startColor: "#F9E6FF",
                  endColor: "#D682FF",
                  imgUrl: "/assets/background/pattern.svg",
                  backgroundSize: "contain",
                }),
                value: { color: theme.palette.secondary.main },
              }}
            />
          </Grid> */}
        </Grid>

        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} md={8}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <AppRequestsCostArea
                title="Usage & Cost by Service"
                subheader={`Project: ${selectedProjectName}`}
                data={areaData}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <AppCostByServiceDonut
                title="Cost by Service"
                subheader={
                  normalizedServices.length
                    ? "Share of total cost"
                    : "No data available"
                }
                chart={{ series: donutSeries }}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderStyle: "dashed" }} />

        {/* Services / Projects table */}
        <Paper variant="outlined" sx={{ p: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Services" />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {tab === 0 && (
              <PaginatedTable
                columns={[
                  "Service / Project",
                  "Limit Daily",
                  "Limit Monthly",
                  "Daily Req",
                  "Daily Tokens",
                  "Daily Cost",
                  "Range Req",
                  "Range Tokens",
                  "Range Cost",
                ]}
                rows={servicesRows}
                pageState={{
                  page: pServices.page,
                  rowsPerPage: pServices.rowsPerPage,
                }}
                onChangePage={(page) =>
                  setPServices((s) => ({ ...s, page }))
                }
                onChangeRows={(rowsPerPage) =>
                  setPServices((s) => ({ ...s, rowsPerPage, page: 0 }))
                }
              />
            )}
          </Box>
        </Paper>
      </Stack>
    </DashboardContent>
  );
};

export default OverviewSection;
