// src/sections/projects/ProjectHeader.tsx
import { Grid, Stack, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Team, Project } from './types';
import DataCard from '../overviewComponents/dataCard';
import { bgGradient } from 'src/theme/styles';

export function ProjectHeader({ team, project, compact = false }: { team: Team; project: Project; compact?: boolean }) {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));
  const small = compact || mdDown;

  const kpis = {
    services: project.services.length,
    members: project.members.length,
    cost: project.spendINR30d ?? 0,
    status: project.status,
  };

  return (
    <Stack spacing={0.5} sx={{ p: { xs: 1.5, md: 2 } }}>
      <Typography variant={small ? 'h6' : 'h5'} noWrap>
        {project.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" noWrap>
        Team: {team.name} • Owners: {project.owners.join(', ')}
      </Typography>

      <Grid container spacing={1} sx={{ mt: 0.5 }}>
        <Grid item xs={6} sm={3}>
          <DataCard
            title="Services"
            value={kpis.services}
            icon="/assets/icons/glass/layers.svg"
            styles={{
              background: bgGradient({ direction: '90deg', startColor: '#EAF0FF', endColor: '#8BA9FF', imgUrl: '/assets/icons/glass/pattern.svg', backgroundSize: 'contain' }),
              value: { color: theme.palette.info.darker, fontSize: small ? 18 : undefined },
              title: { fontSize: small ? 12 : undefined },
            }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <DataCard
            title="Members"
            value={kpis.members}
            icon="/assets/icons/glass/users.svg"
            styles={{
              background: bgGradient({ direction: '90deg', startColor: '#D2FFE2', endColor: '#64D48C', imgUrl: '/assets/icons/glass/pattern.svg', backgroundSize: 'contain' }),
              value: { color: theme.palette.success.darker, fontSize: small ? 18 : undefined },
              title: { fontSize: small ? 12 : undefined },
            }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <DataCard
            title="Cost (30d)"
            value={`$${(kpis.cost).toLocaleString('en-IN')}`}
            icon="/assets/icons/glass/wallet.svg"
            styles={{
              background: bgGradient({ direction: '90deg', startColor: '#FFE7D6', endColor: '#FFAF7A', imgUrl: '/assets/icons/glass/pattern.svg', backgroundSize: 'contain' }),
              value: { color: theme.palette.warning.darker, fontSize: small ? 18 : undefined },
              title: { fontSize: small ? 12 : undefined },
            }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <DataCard
            title="Status"
            value={kpis.status.toUpperCase()}
            icon="/assets/icons/glass/check.svg"
            styles={{
              background: bgGradient({ direction: '90deg', startColor: '#F9E6FF', endColor: '#D682FF', imgUrl: '/assets/icons/glass/pattern.svg', backgroundSize: 'contain' }),
              value: { color: theme.palette.secondary.darker, fontSize: small ? 16 : undefined },
              title: { fontSize: small ? 12 : undefined },
            }}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
