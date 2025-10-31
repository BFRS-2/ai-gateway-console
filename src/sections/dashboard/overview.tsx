"use client";

import {
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
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

// ---------- Types for Usage ----------
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

// ---------- Utils ----------
const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

// ---------- Component ----------
const OverviewSection = () => {
  const theme = useTheme();
  const selected = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );

  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Filters (kept for future use)
  const [team, setTeam] = useState("All");
  const [range, setRange] = useState("30d");

  // Tabs
  const [tab, setTab] = useState(0);
  const [pServices, setPServices] = useState({ page: 0, rowsPerPage: 5 });

  const selectedOrganizationProject = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );

  // Fetch usage when selected project changes
  useEffect(() => {
    setErr(null);
    setUsage(null);

    if (!selected?.projectId) return;

    setLoading(true);
    projectService
      .getUsage(selected.projectId)
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
  }, [selected?.projectId]);

  // KPIs – safe defaults
  const kpis = useMemo(() => {
    const sLen = usage?.services?.length ?? 0;
    const totalReq = usage?.month_to_date?.requests ?? 0;
    const totalCost = usage?.month_to_date?.cost_used ?? 0;

    return {
      productsUsed: sLen,
      totalReq,
      totalCost,
      p95Label: "—", // not in payload
    };
  }, [usage]);

  // Area chart – guard empty with a placeholder point
  const areaData = useMemo(() => {
    const list =
      usage?.services?.map((s) => ({
        x: s.service,
        req: s.month_to_date?.requests ?? 0,
        cost: s.month_to_date?.cost_used ?? 0,
      })) ?? [];
    return list.length ? list : [{ x: "No data", req: 0, cost: 0 }];
  }, [usage?.services]);

  // Donut – guard empty with zero slice
  const donutSeries = useMemo(() => {
    const series =
      usage?.services?.map((s) => ({
        label: s.service,
        value: s.month_to_date?.cost_used ?? 0,
      })) ?? [];
    return series.length ? series : [{ label: "No data", value: 1 }];
  }, [usage?.services]);

  // Services table rows
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

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={4}>
        {/* Empty state if nothing selected */}
        {!selected?.projectId && (
          <Alert severity="info">
            Select a project from the selector to view usage.
          </Alert>
        )}

        {/* Error state */}
        {err && <Alert severity="error">{err}</Alert>}

        {/* Filters (kept; does not hide content) */}
        <FiltersBar
          team={team}
          setTeam={setTeam}
          range={range}
          setRange={setRange}
        />

        {/* Top KPIs */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <DataCard
              title="Products Used"
              value={kpis.productsUsed}
              icon="/assets/icons/navbar/ic-job.svg" // NOTE: no "public/" prefix
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
              value={`${kpis.p95Label} ms`}
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
              title="Usage & Cost by Service (MTD)"
              subheader={
                usage?.project_id
                  ? `Project: ${selectedOrganizationProject?.projectName || usage.project_id}`
                  : "No project loaded"
              }
              data={areaData}
              // remove `loading` prop if your component doesn’t support it
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AppCostByServiceDonut
              title="Cost by Service (MTD)"
              subheader={
                usage?.services?.length
                  ? "Share of total cost"
                  : "No data available"
              }
              chart={{ series: donutSeries }}
              // remove `loading` prop if unsupported
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

        <Divider sx={{ opacity: 0 }} />
      </Stack>
    </DashboardContent>
  );
};

export default OverviewSection;
