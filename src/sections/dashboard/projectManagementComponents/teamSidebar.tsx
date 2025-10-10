import { useMemo } from 'react';
import { Box, List, ListItemButton, ListItemText, Typography, Chip, Stack } from '@mui/material';
import { Team } from './types';

export function TeamSidebar({
  teams,
  teamId,
  onSelectTeam,
}: {
  teams: Team[];
  teamId: string;
  onSelectTeam: (id: string) => void;
}) {
  const totals = useMemo(() => {
    const t = new Map<string, number>();
    teams.forEach(team => t.set(team.id, team.projects.length));
    return t;
  }, [teams]);

  return (
    <Box sx={{ width: 260, overflow: 'auto' }}>
      <Stack sx={{ p: 2 }}>
        <Typography variant="h6">Teams</Typography>
      </Stack>
      <List dense>
        {teams.map(t => (
          <ListItemButton
            key={t.id}
            selected={t.id === teamId}
            onClick={() => onSelectTeam(t.id)}
          >
            <ListItemText
              primary={
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography variant="body1">{t.name}</Typography>
                  <Chip size="small" label={totals.get(t.id) ?? 0} />
                </Stack>
              }
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
