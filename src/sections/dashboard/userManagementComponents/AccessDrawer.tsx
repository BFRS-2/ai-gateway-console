import {
  Drawer, Box, Typography, Stack, TextField, MenuItem, IconButton, List, ListItem, ListItemText, Chip, Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Close';
import { useEffect, useMemo, useState } from 'react';
import { AccessRef, ProjectLite, TeamLite, User } from './types';
import { MOCK_PROJECTS, MOCK_TEAMS } from './mock';

type TargetType = 'team' | 'project';

export function AccessDrawer({
  user,
  open,
  onClose,
  onSave,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSave: (accesses: AccessRef[]) => void;
}) {
  const [accesses, setAccesses] = useState<AccessRef[]>([]);
  const [type, setType] = useState<TargetType>('team');
  const [teamId, setTeamId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    setAccesses(user?.accesses ?? []);
  }, [user]);

  const teamOptions = MOCK_TEAMS;
  const projectOptions = useMemo<ProjectLite[]>(
    () => (teamId ? MOCK_PROJECTS.filter((p) => p.teamId === teamId) : MOCK_PROJECTS),
    [teamId]
  );

  const addAccess = () => {
    if (type === 'team' && teamId) {
      const t = teamOptions.find((t) => t.id === teamId)!;
      if (!accesses.find((a) => a.type === 'team' && a.id === t.id)) {
        setAccesses((prev) => [...prev, { type: 'team', id: t.id, name: t.name }]);
      }
    }
    if (type === 'project' && projectId) {
      const p = MOCK_PROJECTS.find((p) => p.id === projectId)!;
      if (!accesses.find((a) => a.type === 'project' && a.id === p.id)) {
        setAccesses((prev) => [...prev, { type: 'project', id: p.id, name: p.name }]);
      }
    }
  };

  const removeAccess = (i: number) => {
    setAccesses((prev) => prev.filter((_, idx) => idx !== i));
  };

  if (!user) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 520 } }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Project/Team Access</Typography>
        <Typography variant="body2" color="text.secondary">{user.name} • {user.email}</Typography>

        <Stack spacing={2} sx={{ mt: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              label="Access Type"
              size="small"
              value={type}
              onChange={(e) => setType(e.target.value as TargetType)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="team">Team</MenuItem>
              <MenuItem value="project">Project</MenuItem>
            </TextField>

            {type === 'team' && (
              <TextField
                select
                label="Team"
                size="small"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                sx={{ minWidth: 220 }}
              >
                {teamOptions.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </TextField>
            )}

            {type === 'project' && (
              <>
                <TextField
                  select
                  label="Team"
                  size="small"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="">All</MenuItem>
                  {teamOptions.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Project"
                  size="small"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  sx={{ minWidth: 220 }}
                >
                  {projectOptions.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </TextField>
              </>
            )}

            <Button variant="contained" onClick={addAccess}>Add</Button>
          </Stack>

          <Typography variant="subtitle2">Current Access</Typography>
          <List dense>
            {accesses.map((a, i) => (
              <ListItem
                key={`${a.type}-${a.id}`}
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => removeAccess(i)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={a.name}
                  secondary={<Chip size="small" label={a.type} />}
                />
              </ListItem>
            ))}
          </List>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => onSave(accesses)}>Save</Button>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
