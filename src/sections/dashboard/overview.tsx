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
import { callGetApi } from "src/api/callApi"; // uses same auth/baseURL layer

type MetricBlock = { cost_used: number; requests: number; tokens_used: number };

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

type OverviewSectionProps = { projectId?: string; projectName?: string };

const dateToStr = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, delta: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + delta);
  return nd;
};

const OverviewSection = ({ projectId, projectName }: OverviewSectionProps) => {
  const theme = useTheme();

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

  type RangePreset = "1" | "7" | "15" | "30" | "custom";
  const [rangePreset, setRangePreset] = useState<RangePreset>("7");

  const todayStr = dateToStr(new Date());
  const startByPreset = (preset: RangePreset) => {
    if (preset === "1") return dateToStr(addDays(new Date(), -1));
    if (preset === "7") return dateToStr(addDays(new Date(), -7));
    if (preset === "15") return dateToStr(addDays(new Date(), -15));
    if (preset === "30") return dateToStr(addDays(new Date(), -30));
    return dateToStr(addDays(new Date(), -7));
  };

  const [startDate, setStartDate] = useState(startByPreset("7"));
  const [endDate, setEndDate] = useState(todayStr);

  const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId);
  const [selectedProjectId, setSelectedProjectId] =
    useState<string>(initialProjectId);

  // org scope data
  const [orgByProject, setOrgByProject] = useState<any[] | null>(null);
  const [orgByService, setOrgByService] = useState<any[] | null>(null);
  const [orgDaywise, setOrgDaywise] = useState<any[] | null>(null);

  // project scope data
  const [projectRangeTotals, setProjectRangeTotals] =
    useState<MetricBlock | null>(null);
  const [projectDaywise, setProjectDaywise] = useState<any[] | null>(null);
  const [projectSvcBreakdown, setProjectSvcBreakdown] = useState<any[] | null>(
    null
  );
  const [projectProjBreakdown, setProjectProjBreakdown] = useState<any[] | null>(
    null
  );

  const [orgMTD, setOrgMTD] = useState<MetricBlock | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [tab, setTab] = useState<0 | 1>(0);
  const [tableState, setTableState] = useState({ page: 0, rowsPerPage: 5 });

  useEffect(() => {
    if (selectedFromStore?.organizationId) {
      setSelectedOrgId(selectedFromStore.organizationId);
    }
    if (selectedFromStore?.projects?.length && selectedProjectId !== "all") {
      const exists = selectedFromStore.projects.find(
        (p: any) => p.id === selectedProjectId
      );
      if (!exists) setSelectedProjectId(selectedFromStore.projects[0].id);
    }
  }, [selectedFromStore, selectedProjectId]);

  const projectOptions = useMemo(() => {
    if (allOrgProjects && allOrgProjects.length) {
      const currOrg = allOrgProjects.find((o: any) => o.id === selectedOrgId);
      if (currOrg) return currOrg.projects || [];
    }
    return initialProjects;
  }, [allOrgProjects, selectedOrgId, initialProjects]);

  useEffect(() => {
    if (selectedProjectId === "all") return;
    if (!projectOptions.length) {
      setSelectedProjectId("all");
      return;
    }
    const exists = projectOptions.find((p: any) => p.id === selectedProjectId);
    if (!exists) setSelectedProjectId(projectOptions[0].id);
  }, [projectOptions, selectedProjectId]);

  useEffect(() => {
    if (rangePreset !== "custom") {
      setStartDate(startByPreset(rangePreset));
      setEndDate(todayStr);
    }
  }, [rangePreset, todayStr]);

  const isAll = selectedProjectId === "all";
  const selectedProjectName = isAll
    ? "All Projects"
    : projectOptions.find((p: any) => p.id === selectedProjectId)?.name ||
      projectName ||
      selectedProjectId;

  // ------------------ FETCH ------------------
  useEffect(() => {
    setErr(null);
    setOrgByProject(null);
    setOrgByService(null);
    setOrgDaywise(null);
    setProjectRangeTotals(null);
    setProjectDaywise(null);
    setProjectSvcBreakdown(null);
    setProjectProjBreakdown(null);
    setOrgMTD(null);

    if (!selectedOrgId) return;

    const run = async () => {
      setLoading(true);
      try {
        if (isAll) {
          // -------- ORG SCOPE --------
          const orgMTDResp = await projectService.getOrgMTDUsage(
            selectedOrgId,
            startDate,
            endDate
          );

          let mtdTotals: MetricBlock = {
            requests: 0,
            cost_used: 0,
            tokens_used: 0,
          };
          const usageArr =
            (orgMTDResp as any)?.data?.usage ??
            (Array.isArray(orgMTDResp) ? orgMTDResp : []);
          if (Array.isArray(usageArr) && usageArr.length) {
            const u0 = usageArr[0];
            mtdTotals = {
              requests: Number(u0.requests ?? 0),
              cost_used: Number(u0.cost_used ?? u0.cost ?? 0),
              tokens_used: Number(u0.tokens_used ?? 0),
            };
          }
          setOrgMTD(mtdTotals);

          const [gp, gs, daywiseResp] = await Promise.all([
            projectService.getOrgUsageGroupedByProject(
              selectedOrgId,
              startDate,
              endDate
            ),
            projectService.getOrgUsageGroupedByService(
              selectedOrgId,
              startDate,
              endDate
            ),
            projectService.getOrgDaywise(selectedOrgId, startDate, endDate),
          ]);

          const gpProjects = (gp as any)?.data?.projects ?? gp ?? [];
          const gsServices = (gs as any)?.data?.services ?? gs ?? [];
          const daywiseArr =
            (daywiseResp as any)?.data?.usage ??
            (daywiseResp as any)?.usage ??
            (Array.isArray(daywiseResp) ? daywiseResp : []);

          const normDaywise = (Array.isArray(daywiseArr) ? daywiseArr : []).map(
            (d: any) => ({
              date: d.date || d.day || "",
              requests: Number(d.requests ?? 0),
              cost: Number(d.cost_used ?? d.cost ?? 0),
              tokens_used: Number(d.tokens_used ?? 0),
            })
          );

          setOrgByProject(Array.isArray(gpProjects) ? gpProjects : []);
          setOrgByService(Array.isArray(gsServices) ? gsServices : []);
          setOrgDaywise(normDaywise);
        } else {
          // -------- PROJECT SCOPE (NO MTD) --------
          // 1) Daywise (scope=project)
          const daywiseResp = await callGetApi(
            `/api/v1/usage/?scope=project&project_id=${encodeURIComponent(
              selectedProjectId
            )}&type=daywise&start_date=${encodeURIComponent(
              startDate
            )}&end_date=${encodeURIComponent(endDate)}`
          );

          const points =
            (daywiseResp as any)?.data?.usage ??
            (daywiseResp as any)?.usage ??
            (Array.isArray(daywiseResp) ? daywiseResp : []);

          const normProjectDaywise = (Array.isArray(points) ? points : []).map(
            (d: any) => ({
              date: d.date || d.day || "",
              requests: Number(d.requests ?? 0),
              cost: Number(d.cost_used ?? d.cost ?? 0),
              tokens_used: Number(d.tokens_used ?? 0),
            })
          );

          // totals from daywise (since no MTD)
          const totals: MetricBlock = normProjectDaywise.reduce(
            (acc: MetricBlock, p: any) => ({
              requests: acc.requests + (p.requests || 0),
              cost_used: acc.cost_used + (p.cost || 0),
              tokens_used: acc.tokens_used + (p.tokens_used || 0),
            }),
            { requests: 0, cost_used: 0, tokens_used: 0 }
          );

          setProjectDaywise(normProjectDaywise);
          setProjectRangeTotals(totals);

          // 2) Service breakdown (org endpoint with project filter)
          const svcResp = await callGetApi(
            `/api/v1/usage/organization/${encodeURIComponent(
              selectedOrgId
            )}?group_by=service&project_id=${encodeURIComponent(
              selectedProjectId
            )}&start_date=${encodeURIComponent(
              startDate
            )}&end_date=${encodeURIComponent(endDate)}`
          );
          const svcList =
            (svcResp as any)?.data?.services ??
            (Array.isArray(svcResp) ? svcResp : []);
          setProjectSvcBreakdown(Array.isArray(svcList) ? svcList : []);

          // 3) Project breakdown (org endpoint with project filter -> single item)
          const projResp = await callGetApi(
            `/api/v1/usage/organization/${encodeURIComponent(
              selectedOrgId
            )}?group_by=project&project_id=${encodeURIComponent(
              selectedProjectId
            )}&start_date=${encodeURIComponent(
              startDate
            )}&end_date=${encodeURIComponent(endDate)}`
          );
          const projList =
            (projResp as any)?.data?.projects ??
            (Array.isArray(projResp) ? projResp : []);
          setProjectProjBreakdown(Array.isArray(projList) ? projList : []);
        }
      } catch (e) {
        console.error(e);
        setErr("Failed to fetch usage. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [isAll, selectedProjectId, selectedOrgId, startDate, endDate]);

  // ------------------ DERIVED ------------------
  const kpiTotals: MetricBlock = useMemo(() => {
    if (isAll) {
      return {
        requests: orgMTD?.requests ?? 0,
        cost_used: orgMTD?.cost_used ?? 0,
        tokens_used: orgMTD?.tokens_used ?? 0,
      };
    }
    return {
      requests: projectRangeTotals?.requests ?? 0,
      cost_used: projectRangeTotals?.cost_used ?? 0,
      tokens_used: projectRangeTotals?.tokens_used ?? 0,
    };
  }, [isAll, orgMTD, projectRangeTotals]);

  const daywiseSeries = useMemo(() => {
    if (isAll) {
      const arr = Array.isArray(orgDaywise) ? orgDaywise : [];
      return arr.map((d: any) => ({
        x: d.date || "",
        req: d.requests ?? 0,
        cost: d.cost ?? 0,
        tokens: d.tokens_used ?? 0,
      }));
    }
    const arr = Array.isArray(projectDaywise) ? projectDaywise : [];
    return arr.map((d: any) => ({
      x: d.date || "",
      req: d.requests ?? 0,
      cost: d.cost ?? 0,
      tokens: d.tokens_used ?? 0,
    }));
  }, [isAll, orgDaywise, projectDaywise]);

  const donutCostByService = useMemo(() => {
    if (isAll) {
      const items = (orgByService || []).map((s: any) => ({
        label: s.service,
        value: Number(s?.usage?.cost_used ?? 0),
      }));
      return items.length ? items : [{ label: "No data", value: 0 }];
    }
    const items = (projectSvcBreakdown || []).map((s: any) => ({
      label: s.service,
      value: Number(s?.usage?.cost_used ?? 0),
    }));
    return items.length ? items : [{ label: "No data", value: 0 }];
  }, [isAll, orgByService, projectSvcBreakdown]);

  const donutCostByProject = useMemo(() => {
    if (isAll) {
      const items = (orgByProject || []).map((p: any) => ({
        label: p.project_name,
        value: Number(p?.usage?.cost_used ?? 0),
      }));
      return items.length ? items : [{ label: "No data", value: 1 }];
    }
    // project scope -> single slice (from projectProjBreakdown if present, else from totals)
    const val =
      Number(
        (projectProjBreakdown?.[0]?.usage?.cost_used ??
          kpiTotals.cost_used ??
          0) as number
      ) || 0;
    return [{ label: selectedProjectName, value: val }];
  }, [
    isAll,
    orgByProject,
    selectedProjectName,
    kpiTotals.cost_used,
    projectProjBreakdown,
  ]);

  const projectTabRows: string[][] = useMemo(() => {
    if (isAll) {
      const arr = Array.isArray(orgByProject) ? orgByProject : [];
      return arr.map((p: any) => [
        p.project_name,
        Number(p?.usage?.requests ?? 0).toLocaleString("en-IN"),
        Number(p?.usage?.tokens_used ?? 0).toLocaleString("en-IN"),
        formatINR(Number(p?.usage?.cost_used ?? 0)),
      ]);
    }
    // single project row (from totals)
    return [
      [
        selectedProjectName,
        Number(kpiTotals.requests || 0).toLocaleString("en-IN"),
        Number(kpiTotals.tokens_used || 0).toLocaleString("en-IN"),
        formatINR(Number(kpiTotals.cost_used || 0)),
      ],
    ];
  }, [isAll, orgByProject, selectedProjectName, kpiTotals]);

  // ✅ Populate Services table for both scopes
  const servicesTabRows: string[][] = useMemo(() => {
    if (isAll) {
      const arr = Array.isArray(orgByService) ? orgByService : [];
      return arr.map((s: any) => [
        s.service,
        Number(s?.usage?.requests ?? 0).toLocaleString("en-IN"),
        Number(s?.usage?.tokens_used ?? 0).toLocaleString("en-IN"),
        formatINR(Number(s?.usage?.cost_used ?? 0)),
      ]);
    }
    const arr = Array.isArray(projectSvcBreakdown) ? projectSvcBreakdown : [];
    return arr.map((s: any) => [
      s.service,
      Number(s?.usage?.requests ?? 0).toLocaleString("en-IN"),
      Number(s?.usage?.tokens_used ?? 0).toLocaleString("en-IN"),
      formatINR(Number(s?.usage?.cost_used ?? 0)),
    ]);
  }, [isAll, orgByService, projectSvcBreakdown]);

  // ------------------ RENDER ------------------
  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={4}>
        {err && <Alert severity="error">{err}</Alert>}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h4">Billing & Usage</Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <DataCard
              title="Total Cost (MTD)"
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
              title="API Requests (MTD)"
              value={Number(kpiTotals.requests || 0).toLocaleString("en-IN")}
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
              title="Tokens Used (MTD)"
              value={Number(kpiTotals.tokens_used || 0).toLocaleString("en-IN")}
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

        {/* Row 1 */}
        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} md={8}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <AppRequestsCostArea
                title="Total Spend"
                subheader={`For date • ${startDate} → ${endDate}`}
                data={daywiseSeries.map((d) => ({ x: d.x, req: 0, cost: d.cost }))}
                series={[
                  { name: "Cost ($)", type: "column" as const, data: daywiseSeries.map((d) => d.cost) },
                ]}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <AppCostByServiceDonut
                title="Service Wise Cost"
                subheader={"Share of total cost" }
                chart={{ series: donutCostByService }}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Row 2 */}
        <Grid container spacing={2} alignItems="stretch">
          
          <Grid item xs={12} md={4}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <AppCostByServiceDonut
                title="Project Wise Cost"
                subheader={`Project: ${selectedProjectName}`}
                chart={{ series: donutCostByProject }}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <AppRequestsCostArea
                title="Total Requests"
                subheader={`${isAll ? "Organization" : "Project"} • ${startDate} → ${endDate}`}
                data={daywiseSeries.map((d) => ({ x: d.x, req: d.req, cost: 0 }))}
                series={[
                  { name: "Requests", type: "bar" as const, data: daywiseSeries.map((d) => d.req) },
                  //  { name: "Token", type: "bar" as const, data: daywiseSeries.map((d) => d.tokens) },
                ]}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderStyle: "dashed" }} />

        <Paper variant="outlined" sx={{ p: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Project" />
            <Tab label="Services" />
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
              <PaginatedTable
                columns={["Service", "Requests", "Tokens", "Cost"]}
                rows={servicesTabRows}
                pageState={tableState}
                onChangePage={(page) =>
                  setTableState((s) => ({ ...s, page }))
                }
                onChangeRows={(rowsPerPage) =>
                  setTableState((s) => ({ ...s, rowsPerPage, page: 0 }))
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
