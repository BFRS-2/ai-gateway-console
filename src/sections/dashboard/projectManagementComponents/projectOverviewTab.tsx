import { Grid, Paper, Stack, Typography } from '@mui/material';
import { AppCostByTeamDonut } from '../overviewComponents/appCostByTeamDonut';
import { Project } from './types';

export function ProjectOverviewTab({ project }: { project: Project }) {
  const donutData = project.services.map(s => ({
    label: s.name,
    value: s.metrics?.costINR30d ?? 0,
  }));

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <AppCostByTeamDonut
          title="Spend by Service"
          subheader="Last 30 days"
          chart={{ series: donutData }}
        />
      </Grid>
      <Grid item xs={12} md={7}>
        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Recent Highlights</Typography>
          <Stack spacing={1.5}>
            {project.activity.slice(0, 6).map(a => (
              <Stack key={a.id} direction="row" spacing={1}>
                <Typography variant="body2" sx={{ width: 160 }} color="text.secondary">{a.ts}</Typography>
                <Typography variant="body2"><b>{a.actor}</b> {a.action} ({a.entity}) — {a.detail}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
