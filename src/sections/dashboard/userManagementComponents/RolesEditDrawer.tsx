import {
  Drawer, Box, Typography, Stack, FormGroup, FormControlLabel, Checkbox, Chip, Button,
} from '@mui/material';
import { Role, User } from './types';
import { useEffect, useState } from 'react';

const ALL_ROLES: Role[] = ['Admin', 'Developer', 'Viewer', 'Finance', 'Compliance'];

export function RolesEditDrawer({
  user,
  open,
  onClose,
  onSave,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSave: (roles: Role[]) => void;
}) {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    setRoles(user?.roles ?? []);
  }, [user]);

  const toggle = (r: Role) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  if (!user) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Edit Roles</Typography>
        <Typography variant="body2" color="text.secondary">{user.name} • {user.email}</Typography>

        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Current roles</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {roles.length ? roles.map((r) => <Chip key={r} size="small" label={r} />) : <Typography variant="caption">None</Typography>}
          </Stack>
          <Typography variant="subtitle2" sx={{ mt: 1 }}>Assign roles</Typography>
          <FormGroup>
            {ALL_ROLES.map((r) => (
              <FormControlLabel
                key={r}
                control={<Checkbox checked={roles.includes(r)} onChange={() => toggle(r)} />}
                label={r}
              />
            ))}
          </FormGroup>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => onSave(roles)}>Save</Button>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
