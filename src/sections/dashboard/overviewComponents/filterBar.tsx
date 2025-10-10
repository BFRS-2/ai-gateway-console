import { MenuItem, Stack, TextField, Typography } from "@mui/material";

export default function FiltersBar({
  team,
  setTeam,
  range,
  setRange,
}: {
  team: string;
  setTeam: (v: string) => void;
  range: string;
  setRange: (v: string) => void;
}) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
      <Typography variant="h4">Overview</Typography>
      <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
        <TextField
          select
          label="Date Range"
          size="small"
          value={range}
          onChange={(e) => setRange(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {["7d", "30d", "Quarter", "Custom"].map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Team / Workspace"
          size="small"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {["All", "Trends", "Copilot", "API Platform"].map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </Stack>
  );
}