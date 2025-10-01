import { Stack, TextField, MenuItem, Button } from '@mui/material';

import { useState } from 'react';
import { Project } from './types';

export function ProjectSettingsTab({ project }: { project: Project }) {
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status);
  const [budget, setBudget] = useState(project.budgetINR ?? 0);

  return (
    <Stack spacing={2} sx={{ maxWidth: 560 }}>
      <TextField label="Project Name" value={name} onChange={(e) => setName(e.target.value)} />
      <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value as any)}>
        {['active', 'paused', 'archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
      </TextField>
      <TextField label="Budget (₹)" type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
      <Stack direction="row" spacing={1}>
        <Button variant="contained" color="primary">Save Changes</Button>
        <Button variant="outlined" color="error">Archive Project</Button>
      </Stack>
    </Stack>
  );
}
