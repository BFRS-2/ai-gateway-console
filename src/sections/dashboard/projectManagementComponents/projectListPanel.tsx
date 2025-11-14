import { Box, List, ListItemButton, ListItemText, LinearProgress, Stack, Typography, Chip } from '@mui/material';
import { Team } from './types';

export function ProjectListPanel({
  team,
  selectedProjectId,
  onSelectProject,
}: {
  team?: Team;
  selectedProjectId?: string;
  onSelectProject: (id: string) => void;
}) {
  if (!team) return <Box sx={{ width: 320 }} />;

  return (
    <Box sx={{ width: 320, overflow: 'auto' }}>
      <Stack sx={{ p: 2 }}>
        <Typography variant="h6">{team.name} Projects</Typography>
      </Stack>
      <List dense>
        {team.projects.map((p) => {
          const burn = p.spendINR30d && p.budgetINR ? Math.min(100, Math.round((p.spendINR30d / p.budgetINR) * 100)) : 0;
          return (
            <ListItemButton
              key={p.id}
              selected={p.id === selectedProjectId}
              onClick={() => onSelectProject(p.id)}
              alignItems="flex-start"
            >
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">{p.name}</Typography>
                    <Chip
                      size="small"
                      label={p.status}
                      color={p.status === 'active' ? 'success' : p.status === 'paused' ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </Stack>
                }
                secondary={
                  p.budgetINR ? (
                    <Stack sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Budget: ${p.budgetINR?.toLocaleString('en-IN')} • Spend (30d): ${p.spendINR30d?.toLocaleString('en-IN')}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={burn}
                        sx={{ mt: 0.5 }}
                      />
                    </Stack>
                  ) : null
                }
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
