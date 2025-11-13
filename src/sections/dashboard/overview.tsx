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
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";
import projectService from "src/api/services/project.service";

// ---------- Types ----------
type MetricBlock = { cost_used: number; requests: number; tokens_used: number };

type NormalizedRow = {
  label: string;
  id: string;
  cost_used: number;
  requests: number;
  tokens_used: number;
};

// helpers
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

const dateToStr = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, delta: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + delta);
  return nd;
};

const OverviewSection = ({ projectId, projectName }: OverviewSectionProps) => {
  const theme = useTheme();

  // org/project state from store
  const selectedFromStore = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );
  const allOrgProjects = useSelector(
    (state: RootState) => state.orgProject.organizationProjects
  );

  const initialOrgId = selectedFromStore?.organizationId || "";
  const initialProjects =
    selectedFromStore?.projects && selectedFromStore.projects.length
      ? selectedFromStore.projects
      : [];

  const initialProjectId = projectId || "all";

  // ----- Range preset -----
  type RangePreset = "1" | "7" | "15" | "30" | "custom";
  const [rangePreset, setRangePreset] = useState<RangePreset>("7");

  const todayStr = dateToStr(new Date());
  const startByPreset = (preset: RangePreset) => {
    if (preset === "1") return dateToStr(addDays(new Date(), -1));
    if (preset === "7") return dateToStr(addDays(new Date(), -7));
    if (preset === "15") return dateToStr(addDays(new Date(), -15));
    if (preset === "30") return dateToStr(addDays(new Date(), -30));
    return dateToStr(addDays(new Date(), -7)); // default
  };

  const [startDate, setStartDate] = useState(startByPreset("7"));
  const [endDate, setEndDate] = useState(todayStr);

  // selection
  const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);

  // data
  const [orgByProject, setOrgByProject] = useState<any[] | null>(null);
  const [orgByService, setOrgByService] = useState<any[] | null>(null);
  const [orgDaywise, setOrgDaywise] = useState<any[] | null>(null);

  const [projectRangeTotals, setProjectRangeTotals] = useState<MetricBlock | null>(null);
  const [projectDaywise, setProjectDaywise] = useState<any[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [tab, setTab] = useState<0 | 1>(0); // 0=Project, 1=Services
  const [tableState, setTableState] = useState({ page: 0, rowsPerPage: 5 });

  // sync org from store
  useEffect(() => {
    if (selectedFromStore?.organizationId) {
      setSelectedOrgId(selectedFromStore.organizationId);
    }
    if (selectedFromStore?.projects?.length && selectedProjectId !== "all") {
      const exists = selectedFromStore.projects.find((p: any) => p.id === selectedProjectId);
      if (!exists) setSelectedProjectId(selectedFromStore.projects[0].id);
    }
  }, [selectedFromStore, selectedProjectId]);

  // project options
  const projectOptions = useMemo(() => {
    if (allOrgProjects && allOrgProjects.length) {
      const currOrg = allOrgProjects.find((o: any) => o.id === selectedOrgId);
      if (currOrg) return currOrg.projects || [];
    }
    return initialProjects;
  }, [allOrgProjects, selectedOrgId, initialProjects]);

  // keep selected project valid (allow "all")
  useEffect(() => {
    if (selectedProjectId === "all") return;
    if (!projectOptions.length) {
      setSelectedProjectId("all");
      return;
    }
    const exists = projectOptions.find((p: any) => p.id === selectedProjectId);
    if (!exists) setSelectedProjectId(projectOptions[0].id);
  }, [projectOptions, selectedProjectId]);

  // react to preset change
  useEffect(() => {
    if (rangePreset !== "custom") {
      setStartDate(startByPreset(rangePreset));
      setEndDate(todayStr);
    }
  }, [rangePreset, todayStr]);

  // fetch usage
  useEffect(() => {
    setErr(null);
    setOrgByProject(null);
    setOrgByService(null);
    setOrgDaywise(null);
    setProjectRangeTotals(null);
    setProjectDaywise(null);

    if (!selectedOrgId) return;

    const run = async () => {
      setLoading(true);
      try {
        if (selectedProjectId === "all") {
          const [gp, gs, daywise] = await Promise.all([
            projectService.getOrgUsageGroupedByProject(selectedOrgId, startDate, endDate),
            projectService.getOrgUsageGroupedByService(selectedOrgId, startDate, endDate),
            projectService.getOrgDaywise(selectedOrgId, startDate, endDate),
          ]);
          setOrgByProject(Array.isArray(gp) ? gp : []);
          setOrgByService(Array.isArray(gs) ? gs : []);
          setOrgDaywise(Array.isArray(daywise) ? daywise : []);
        } else {
          // top cards + daywise for project scope (mtd/range)
          const mtd = await projectService.getProjectMTD(selectedProjectId);
          // mtd could be { data: {...}} or array; normalize defensively
          let points: any[] = [];
          let totals: MetricBlock = { requests: 0, cost_used: 0, tokens_used: 0 };

          if (Array.isArray((mtd as any)?.data?.usage)) {
            points = (mtd as any).data.usage;
          } else if (Array.isArray(mtd)) {
            points = mtd;
          } else if (Array.isArray((mtd as any)?.usage)) {
            points = (mtd as any).usage;
          }

          // totals fallback from points
          for (const p of points) {
            totals.requests += Number(p.requests || 0);
            totals.cost_used += Number(p.cost ?? p.cost_used ?? 0);
            totals.tokens_used += Number(p.tokens_used || 0);
          }

          setProjectDaywise(points);
          setProjectRangeTotals(totals);
        }
      } catch (e) {
        console.error(e);
        setErr("Failed to fetch usage. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [selectedProjectId, selectedOrgId, startDate, endDate]);

  const isAll = selectedProjectId === "all";
  const selectedProjectName =
    isAll
      ? "All Projects"
      : projectOptions.find((p: any) => p.id === selectedProjectId)?.name ||
        projectName ||
        selectedProjectId;

  /** -------------------- KPI cards -------------------- */
  const kpiTotals: MetricBlock = useMemo(() => {
    if (isAll) {
      const totalReq = (orgByProject || []).reduce(
        (a, b: any) => a + (b?.usage?.requests ?? 0), 0
      );
      const totalCost = (orgByProject || []).reduce(
        (a, b: any) => a + (b?.usage?.cost_used ?? 0), 0
      );
      const totalTokens = (orgByProject || []).reduce(
        (a, b: any) => a + (b?.usage?.tokens_used ?? 0), 0
      );
      return { requests: totalReq, cost_used: totalCost, tokens_used: totalTokens };
    }
    return {
      requests: projectRangeTotals?.requests ?? 0,
      cost_used: projectRangeTotals?.cost_used ?? 0,
      tokens_used: projectRangeTotals?.tokens_used ?? 0,
    };
  }, [isAll, orgByProject, projectRangeTotals]);

  /** -------------------- Daywise series -------------------- */
  const daywiseSeries = useMemo(() => {
    // org scope
    if (isAll) {
      const arr = Array.isArray(orgDaywise) ? orgDaywise : [];
      return arr.map((d: any) => ({
        x: d.date || d.day || "",
        req: d.requests ?? 0,
        cost: d.cost ?? d.cost_used ?? 0,
        tokens: d.tokens_used ?? 0,
      }));
    }
    // project scope
    const arr = Array.isArray(projectDaywise) ? projectDaywise : [];
    return arr.map((d: any) => ({
      x: d.date || d.day || "",
      req: d.requests ?? 0,
      cost: d.cost ?? d.cost_used ?? 0,
      tokens: d.tokens_used ?? 0,
    }));
  }, [isAll, orgDaywise, projectDaywise]);

  /** -------------------- Donuts -------------------- */
  const donutCostByService = useMemo(() => {
    if (!isAll) return []; // not available for project scope per API
    const items = (orgByService || []).map((s: any) => ({
      label: s.service,
      value: s?.usage?.cost_used ?? 0,
    }));
    return items.length ? items : [{ label: "No data", value: 1 }];
  }, [isAll, orgByService]);

  const donutCostByProject = useMemo(() => {
    if (isAll) {
      const items = (orgByProject || []).map((p: any) => ({
        label: p.project_name,
        value: p?.usage?.cost_used ?? 0,
      }));
      return items.length ? items : [{ label: "No data", value: 1 }];
    }
    // project scope: single slice for selected project
    return [
      {
        label: selectedProjectName,
        value: kpiTotals.cost_used ?? 0,
      },
    ];
  }, [isAll, orgByProject, selectedProjectName, kpiTotals.cost_used]);

  /** -------------------- Tables (tabs) -------------------- */
  // Project tab rows
  const projectTabRows: string[][] = useMemo(() => {
    if (isAll) {
      return (orgByProject || []).map((p: any) => [
        p.project_name,
        (p?.usage?.requests ?? 0).toLocaleString("en-IN"),
        (p?.usage?.tokens_used ?? 0).toLocaleString("en-IN"),
        formatINR(p?.usage?.cost_used ?? 0),
      ]);
    }
    return [
      [
        selectedProjectName,
        (kpiTotals.requests || 0).toLocaleString("en-IN"),
        (kpiTotals.tokens_used || 0).toLocaleString("en-IN"),
        formatINR(kpiTotals.cost_used || 0),
      ],
    ];
  }, [isAll, orgByProject, selectedProjectName, kpiTotals]);

  // Services tab rows (org scope only)
  const servicesTabRows: string[][] = useMemo(() => {
    if (!isAll) return [];
    return (orgByService || []).map((s: any) => [
      s.service,
      (s?.usage?.requests ?? 0).toLocaleString("en-IN"),
      (s?.usage?.tokens_used ?? 0).toLocaleString("en-IN"),
      formatINR(s?.usage?.cost_used ?? 0),
    ]);
  }, [isAll, orgByService]);

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={4}>
        {err && <Alert severity="error">{err}</Alert>}

        {/* Filters */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h4">Usage</Typography>
          
        </Stack>

        {/* KPI cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <DataCard
              title="Total Cost"
              value={formatINR(kpiTotals.cost_used || 0)}
              icon="/assets/icons/navbar/ic-invoice.svg"
              loading={loading}
              styles={{
                background: bgGradient({
                  direction: "90deg",
                  startColor: "#FFE7D6",
                  endColor: "#FFAF7A",
                  imgUrl: "/assets/background/pattern.svg",
                }),
                value: { color: theme.palette.warning.main },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <DataCard
              title="API Requests"
              value={(kpiTotals.requests || 0).toLocaleString("en-IN")}
              icon="/assets/icons/navbar/ic-menu-item.svg"
              loading={loading}
              styles={{
                background: bgGradient({
                  direction: "90deg",
                  startColor: "#E9E3FF",
                  endColor: "#8C6BFF",
                  imgUrl: "/assets/background/pattern.svg",
                }),
                value: { color: theme.palette.primary.main },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <DataCard
              title="Tokens Used"
              value={(kpiTotals.tokens_used || 0).toLocaleString("en-IN")}
              icon="/assets/icons/navbar/ic-job.svg"
              loading={loading}
              styles={{
                background: bgGradient({
                  direction: "90deg",
                  startColor: "#D2FFE2",
                  endColor: "#64D48C",
                  imgUrl: "/assets/background/pattern.svg",
                }),
                value: { color: theme.palette.success.main },
              }}
            />
          </Grid>
        </Grid>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="project-select-label">Project</InputLabel>
              <Select
                labelId="project-select-label"
                label="Project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
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

            {/* Range preset */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="range-select-label">Range</InputLabel>
              <Select
                labelId="range-select-label"
                label="Range"
                value={rangePreset}
                onChange={(e) => setRangePreset(e.target.value as any)}
              >
                <MenuItem value="1">Last day</MenuItem>
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="15">Last 15 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            {/* Only show date pickers for custom */}
            {rangePreset === "custom" && (
              <>
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
              </>
            )}
          </Stack>

        {/* Two graphs: Cost (daywise) & Usage/Requests (daywise) */}
        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <AppRequestsCostArea
                title="Cost (Daywise)"
                subheader={`${isAll ? "Organization" : "Project"} • ${startDate} → ${endDate}`}
                data={daywiseSeries.map((d) => ({ x: d.x, req: 0, cost: d.cost }))}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <AppRequestsCostArea
                title="Usage / Requests (Daywise)"
                subheader={`${isAll ? "Organization" : "Project"} • ${startDate} → ${endDate}`}
                data={daywiseSeries.map((d) => ({ x: d.x, req: d.req, cost: 0 }))}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Donuts: Cost by Service & Cost by Project */}
        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <AppCostByServiceDonut
                title="Cost by Service"
                subheader={
                  isAll
                    ? "Share of total org cost"
                    : "Not available for project scope"
                }
                chart={{ series: isAll ? donutCostByService : [{ label: "N/A", value: 1 }] }}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <AppCostByServiceDonut
                title="Cost by Project"
                subheader={isAll ? "Share of total org cost" : `Project: ${selectedProjectName}`}
                chart={{ series: donutCostByProject }}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderStyle: "dashed" }} />

        {/* Table with tabs */}
        <Paper variant="outlined" sx={{ p: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Project" />
            <Tab label="Services" disabled={!isAll} />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {tab === 0 && (
              <PaginatedTable
                columns={["Project", "Requests", "Tokens", "Cost"]}
                rows={projectTabRows}
                pageState={tableState}
                onChangePage={(page) => setTableState((s) => ({ ...s, page }))}
                onChangeRows={(rowsPerPage) =>
                  setTableState((s) => ({ ...s, rowsPerPage, page: 0 }))
                }
              />
            )}

            {tab === 1 && (
              <>
                {!isAll && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Per-service breakdown isn’t available in project scope.
                    Switch Project to “All Projects” to view this tab.
                  </Alert>
                )}
                {isAll && (
                  <PaginatedTable
                    columns={["Service", "Requests", "Tokens", "Cost"]}
                    rows={servicesTabRows}
                    pageState={tableState}
                    onChangePage={(page) => setTableState((s) => ({ ...s, page }))}
                    onChangeRows={(rowsPerPage) =>
                      setTableState((s) => ({ ...s, rowsPerPage, page: 0 }))
                    }
                  />
                )}
              </>
            )}
          </Box>
        </Paper>
      </Stack>
    </DashboardContent>
  );
};

export default OverviewSection;
