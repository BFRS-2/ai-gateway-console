"use client"

import { Box, Chip, Divider, Grid, Paper, Stack, Tab, Tabs, Tooltip, Typography, useTheme } from "@mui/material";
import { useMemo, useState } from "react";
import { DashboardContent } from "src/layouts/dashboard";
import { bgGradient } from "src/theme/styles";
import PaginatedTable from "./overviewComponents/paginatedTable";
import DataCard from "./overviewComponents/dataCard";
import FiltersBar from "./overviewComponents/filterBar";
import { AppRequestsCostArea } from "./overviewComponents/appRequestCostArea";
import { AppCostByTeamDonut } from "./overviewComponents/appCostByTeamDonut";


// ---- MOCK DATA (swap with your API) ----
const providers = [
  { provider: 'OpenAI', model: 'gpt-4o', requests: 12840, tokens: 9_400_000, costINR: 312000, p95ms: 920, errorRate: 0.008 },
  { provider: 'Google', model: 'gemini-1.5-pro', requests: 8840, tokens: 6_200_000, costINR: 202000, p95ms: 980, errorRate: 0.012 },
  { provider: 'Anthropic', model: 'claude-3.5-sonnet', requests: 6420, tokens: 4_100_000, costINR: 176000, p95ms: 870, errorRate: 0.006 },
];

const teams = [
  { team: 'Trends', requests: 5021, costINR: 88000, budgetINR: 125000, burnRate: 0.72 },
  { team: 'Copilot', requests: 11240, costINR: 168000, budgetINR: 225000, burnRate: 0.75 },
  { team: 'API Platform', requests: 4100, costINR: 63000, budgetINR: 120000, burnRate: 0.52 },
];

const prompts = [
  { name: 'Refund-Policy QA', owner: 'Support', runs: 2100, costPerRunINR: 1.9, quality: 4.6, updatedAt: '2025-09-27 14:20' },
  { name: 'Seller-Care DSL', owner: 'Copilot', runs: 3400, costPerRunINR: 2.4, quality: 4.4, updatedAt: '2025-09-28 09:05' },
  { name: 'AOV-Insight', owner: 'Trends', runs: 1200, costPerRunINR: 1.3, quality: 4.2, updatedAt: '2025-09-22 18:02' },
];

const rags = [
  { rag: 'Policy RAG', docs: 1240, version: 'v4', stalenessDays: 2, lastSync: '2025-09-29 23:10', status: 'healthy' as const },
  { rag: 'Support KB', docs: 5820, version: 'v7', stalenessDays: 9, lastSync: '2025-09-28 07:40', status: 'stale' as const },
  { rag: 'Orders RAG', docs: 980, version: 'v2', stalenessDays: 0, lastSync: '2025-09-30 08:11', status: 'syncing' as const },
];

const errors = [
  { ts: '2025-09-30 10:21', route: '/v1/chat', status: 429, provider: 'OpenAI', team: 'Copilot', detail: 'Rate limit' },
  { ts: '2025-09-30 09:55', route: '/v1/embeddings', status: 500, provider: 'Google', team: 'Trends', detail: 'Provider error' },
  { ts: '2025-09-30 09:14', route: '/v1/chat', status: 403, provider: 'Anthropic', team: 'API Platform', detail: 'Key revoked' },
];


// Utility
const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const pct = (x: number) => `${Math.round(x * 100)}%`;
const OverviewSection  = ()=>{
const theme = useTheme();

  // Filters
  const [team, setTeam] = useState('All');
  const [range, setRange] = useState('30d');
  const [tab, setTab] = useState(0);

  // KPIs (derived; swap with API)
  const kpis = useMemo(() => {
    const p = providers; // apply team/range filtering when wiring APIs
    return {
      productsUsed: p.length,
      totalReq: p.reduce((s, r) => s + r.requests, 0),
      totalCost: p.reduce((s, r) => s + r.costINR, 0),
      p95: Math.max(...p.map((r) => r.p95ms)),
    };
  }, [team, range]);

  // Area chart data (Requests & Cost)
  const areaData = [
    { x: 'Mon', req: 5200, cost: 38000 },
    { x: 'Tue', req: 6100, cost: 41000 },
    { x: 'Wed', req: 5800, cost: 39000 },
    { x: 'Thu', req: 6400, cost: 45500 },
    { x: 'Fri', req: 7000, cost: 48000 },
    { x: 'Sat', req: 5600, cost: 36000 },
    { x: 'Sun', req: 5900, cost: 37000 },
  ];

  // Tables pagination
  const [pProv, setPProv] = useState({ page: 0, rowsPerPage: 5 });
  const [pTeam, setPTeam] = useState({ page: 0, rowsPerPage: 5 });
  const [pPrompt, setPPrompt] = useState({ page: 0, rowsPerPage: 5 });
  const [pRag, setPRag] = useState({ page: 0, rowsPerPage: 5 });
  const [pErr, setPErr] = useState({ page: 0, rowsPerPage: 5 });

    return <DashboardContent maxWidth="xl">
            <Stack spacing={4}>
      {/* Filters */}
      <FiltersBar team={team} setTeam={setTeam} range={range} setRange={setRange} />

      {/* Top KPIs — 4 only */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard
            title="Products Used"
            value={kpis.productsUsed}
            icon="/assets/icons/navbar/ic-job.svg"
            styles={{
              background: bgGradient({
                direction: '90deg',
                startColor: '#D2FFE2',
                endColor: '#64D48C',
                imgUrl: '/assets/icons/navbar/ic-job.svg',
                backgroundSize: 'contain',
              }),
              value: { color: theme.palette.success.main },
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <DataCard
            title="Requests (30d)"
            value={kpis.totalReq.toLocaleString('en-IN')}
            icon="/assets/icons/navbar/ic-menu-item.svg"
            styles={{
              background: bgGradient({
                direction: '90deg',
                startColor: '#E9E3FF',
                endColor: '#8C6BFF',
                imgUrl: '/assets/icons/navbar/ic-menu-item.svg',
                backgroundSize: 'contain',
              }),
              value: { color: theme.palette.primary.main },
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <DataCard
            title="Cost (30d)"
            value={formatINR(kpis.totalCost)}
            icon="/assets/icons/navbar/ic-invoice.svg"
            styles={{
              background: bgGradient({
                direction: '90deg',
                startColor: '#FFE7D6',
                endColor: '#FFAF7A',
                imgUrl: 'public/assets/icons/navbar/ic-invoice.svg',
                backgroundSize: 'contain',
              }),
              value: { color: theme.palette.warning.main },
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <DataCard
            title="p95 Latency"
            value={`${kpis.p95} ms`}
            icon="/assets/icons/navbar/ic-tour.svg"
            styles={{
              background: bgGradient({
                direction: '90deg',
                startColor: '#F9E6FF',
                endColor: '#D682FF',
                imgUrl: '/assets/icons/navbar/ic-tour.svg',
                backgroundSize: 'contain',
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
            title="Usage & Cost"
            subheader="Last 7 days"
            data={areaData}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <AppCostByTeamDonut
            title="Cost by Team"
            subheader="Share of total cost"
            chart={{
              series: teams.map((t) => ({ label: t.team, value: t.costINR })),
            }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {/* Tabbed Tables */}
      <Paper variant="outlined" sx={{ p: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Providers" />
          <Tab label="Teams" />
          <Tab label="Prompts" />
          <Tab label="RAGs" />
          <Tab label="Errors" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {tab === 0 && (
            <PaginatedTable
              columns={['Provider', 'Model', 'Requests', 'Tokens', 'Cost', 'p95', 'Err']}
              rows={providers.map((r) => [
                r.provider,
                r.model,
                r.requests.toLocaleString('en-IN'),
                r.tokens.toLocaleString('en-IN'),
                formatINR(r.costINR),
                `${r.p95ms} ms`,
                pct(r.errorRate),
              ])}
              pageState={{ page: pProv.page, rowsPerPage: pProv.rowsPerPage }}
              onChangePage={(page) => setPProv((s) => ({ ...s, page }))}
              onChangeRows={(rowsPerPage) => setPProv((s) => ({ ...s, rowsPerPage, page: 0 }))}
            />
          )}

          {tab === 1 && (
            <PaginatedTable
              columns={['Team', 'Requests', 'Cost', 'Budget', 'Burn']}
              rows={teams.map((t) => [
                t.team,
                t.requests.toLocaleString('en-IN'),
                formatINR(t.costINR),
                formatINR(t.budgetINR),
                <Chip
                  key={t.team}
                  label={pct(t.burnRate)}
                  color={t.burnRate > 0.8 ? 'error' : t.burnRate > 0.6 ? 'warning' : 'success'}
                  size="small"
                />,
              ])}
              pageState={{ page: pTeam.page, rowsPerPage: pTeam.rowsPerPage }}
              onChangePage={(page) => setPTeam((s) => ({ ...s, page }))}
              onChangeRows={(rowsPerPage) => setPTeam((s) => ({ ...s, rowsPerPage, page: 0 }))}
            />
          )}

          {tab === 2 && (
            <PaginatedTable
              columns={['Prompt', 'Owner', 'Runs', '₹/Run', 'Quality', 'Updated']}
              rows={prompts.map((p) => [
                p.name,
                p.owner,
                p.runs.toLocaleString('en-IN'),
                formatINR(p.costPerRunINR),
                <Chip key={p.name} label={p.quality.toFixed(1)} size="small" />,
                p.updatedAt,
              ])}
              pageState={{ page: pPrompt.page, rowsPerPage: pPrompt.rowsPerPage }}
              onChangePage={(page) => setPPrompt((s) => ({ ...s, page }))}
              onChangeRows={(rowsPerPage) => setPPrompt((s) => ({ ...s, rowsPerPage, page: 0 }))}
            />
          )}

          {tab === 3 && (
            <PaginatedTable
              columns={['RAG', 'Docs', 'Version', 'Stale (d)', 'Last Sync', 'Status']}
              rows={rags.map((r) => [
                r.rag,
                r.docs.toLocaleString('en-IN'),
                r.version,
                r.stalenessDays,
                r.lastSync,
                <Chip
                  key={r.rag}
                  label={r.status}
                  color={r.status === 'healthy' ? 'success' : r.status === 'syncing' ? 'info' : r.status === 'stale' ? 'warning' : 'error'}
                  size="small"
                />,
              ])}
              pageState={{ page: pRag.page, rowsPerPage: pRag.rowsPerPage }}
              onChangePage={(page) => setPRag((s) => ({ ...s, page }))}
              onChangeRows={(rowsPerPage) => setPRag((s) => ({ ...s, rowsPerPage, page: 0 }))}
            />
          )}

          {tab === 4 && (
            <PaginatedTable
              columns={['Time', 'Route', 'Status', 'Provider', 'Team', 'Detail']}
              rows={errors.map((e) => [e.ts, e.route, e.status, e.provider, e.team, e.detail])}
              pageState={{ page: pErr.page, rowsPerPage: pErr.rowsPerPage }}
              onChangePage={(page) => setPErr((s) => ({ ...s, page }))}
              onChangeRows={(rowsPerPage) => setPErr((s) => ({ ...s, rowsPerPage, page: 0 }))}
            />
          )}
        </Box>
      </Paper>

      <Divider sx={{ opacity: 0 }} />
    </Stack>
    </DashboardContent>
}

export default OverviewSection;