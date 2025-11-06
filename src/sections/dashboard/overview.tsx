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
import FiltersBar from "./overviewComponents/filterBar";
import { AppRequestsCostArea } from "./overviewComponents/appRequestCostArea";
import { AppCostByTeamDonut as AppCostByServiceDonut } from "./overviewComponents/appCostByTeamDonut";
import projectService from "src/api/services/project.service";
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";

// ---------- Types ----------
type LimitBlock = { daily: number; monthly: number };
type MetricBlock = { cost_used: number; requests: number; tokens_used: number };

type ServiceUsage = {
  service: string;
  service_id: string;
  limits: LimitBlock;
  daily: MetricBlock;
  month_to_date: MetricBlock;
};

type UsageData = {
  project_id: string;
  limits: LimitBlock;
  daily: MetricBlock;
  month_to_date: MetricBlock;
  services: ServiceUsage[];
};

type UsageResponse = {
  success: boolean;
  status_code: number;
  data: UsageData;
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

  // selected (org + projects) from store
  const selectedFromStore = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );

  // all orgs (with their projects) from store — we need this for org filter
  const allOrgProjects = useSelector(
    (state: RootState) => state.orgProject.organizationProjects
  );

  // derive initial values
  const initialOrgId = selectedFromStore?.organizationId || "";
  const initialProjects =
    selectedFromStore?.projects && selectedFromStore.projects.length
      ? selectedFromStore.projects
      : [];

  const initialProjectId =
    projectId || initialProjects[0]?.id || "";

  const today = new Date().toISOString().slice(0, 10);
  // default to last 30 days
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);
  const defaultStartStr = defaultStart.toISOString().slice(0, 10);

  const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [startDate, setStartDate] = useState(defaultStartStr);
  const [endDate, setEndDate] = useState(today);

  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [team, setTeam] = useState("All");
  const [range, setRange] = useState("30d");
  const [tab, setTab] = useState(0);
  const [pServices, setPServices] = useState({ page: 0, rowsPerPage: 5 });

  // when selected store changes (like user changed org from header), sync local filters
  useEffect(() => {
    if (selectedFromStore?.organizationId) {
      setSelectedOrgId(selectedFromStore.organizationId);
    }
    if (selectedFromStore?.projects?.length) {
      // if current selected project is not part of new org, reset to first
      const exists = selectedFromStore.projects.find(
        (p: any) => p.id === selectedProjectId
      );
      if (!exists) {
        setSelectedProjectId(selectedFromStore.projects[0].id);
      }
    }
  }, [selectedFromStore]);

  // figure out project options based on current org selection
  const projectOptions = useMemo(() => {
    // if we have all orgs, pick the current org's project list
    if (allOrgProjects && allOrgProjects.length) {
      const currOrg = allOrgProjects.find((o: any) => o.id === selectedOrgId);
      if (currOrg) {
        return currOrg.projects || [];
      }
    }
    // fallback to what came with selectedFromStore
    return initialProjects;
  }, [allOrgProjects, selectedOrgId, initialProjects]);

  // ensure selected project always valid when projectOptions change
  useEffect(() => {
    if (!projectOptions.length) {
      setSelectedProjectId("");
      return;
    }
    const exists = projectOptions.find((p: any) => p.id === selectedProjectId);
    if (!exists) {
      setSelectedProjectId(projectOptions[0].id);
    }
  }, [projectOptions, selectedProjectId]);

  // Fetch usage when any of these change
  useEffect(() => {
    setErr(null);
    setUsage(null);

    if (!selectedProjectId) return;

    setLoading(true);
    projectService
      .getUsage({
        project_id: selectedProjectId,
        organization_id: initialOrgId,
        start_date: startDate,
        end_date: endDate,
      })
      .then((res: UsageResponse) => {
        if (res?.success && res?.data) {
          setUsage(res.data);
        } else {
          setErr("Could not load usage for this project.");
        }
      })
      .catch((e: any) => {
        console.error("Usage fetch failed:", e);
        setErr("Failed to fetch usage. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [selectedProjectId, selectedOrgId, startDate, endDate]);

  const kpis = useMemo(() => {
    const sLen = usage?.services?.length ?? 0;
    const totalReq = usage?.month_to_date?.requests ?? 0;
    const totalCost = usage?.month_to_date?.cost_used ?? 0;

    return {
      productsUsed: sLen,
      totalReq,
      totalCost,
      p95Label: "—",
    };
  }, [usage]);

  const areaData = useMemo(() => {
    const list =
      usage?.services?.map((s) => ({
        x: s.service,
        req: s.month_to_date?.requests ?? 0,
        cost: s.month_to_date?.cost_used ?? 0,
      })) ?? [];
    return list.length ? list : [{ x: "No data", req: 0, cost: 0 }];
  }, [usage?.services]);

  const donutSeries = useMemo(() => {
    const series =
      usage?.services?.map((s) => ({
        label: s.service,
        value: s.month_to_date?.cost_used ?? 0,
      })) ?? [];
    return series.length ? series : [{ label: "No data", value: 1 }];
  }, [usage?.services]);

  const servicesRows =
    usage?.services?.map((s) => [
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

  // derive selected project name for chart header
  const selectedProjectName =
    projectOptions.find((p: any) => p.id === selectedProjectId)?.name ||
    projectName ||
    selectedProjectId;

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={4}>
        {!selectedProjectId && (
          <Alert severity="info">
            Select a project to view usage.
          </Alert>
        )}

        {err && <Alert severity="error">{err}</Alert>}

        {/* New filter row: organization, project, start/end */}
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
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
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <AppRequestsCostArea
              title="Usage & Cost by Service"
              subheader={
                selectedProjectId
                  ? `Project: ${selectedProjectName}`
                  : "No project loaded"
              }
              data={areaData}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AppCostByServiceDonut
              title="Cost by Service"
              subheader={
                usage?.services?.length
                  ? "Share of total cost"
                  : "No data available"
              }
              chart={{ series: donutSeries }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ borderStyle: "dashed" }} />

        {/* Services Table */}
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
                  "Service",
                  "Limit Daily",
                  "Limit Monthly",
                  "Daily Req",
                  "Daily Tokens",
                  "Daily Cost",
                  "MTD Req",
                  "MTD Tokens",
                  "MTD Cost",
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
