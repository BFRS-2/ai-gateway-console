import { useState } from 'react';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { Activity, Project } from './types';
import { ActivityDetailsDrawer } from './activityDetailsDrawer';

export function ProjectActivityTab({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Activity | null>(null);

  return (
    <>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Detail</TableCell>
                <TableCell align="right">Info</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {project.activity.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{a.ts}</TableCell>
                  <TableCell>{a.actor}</TableCell>
                  <TableCell>{a.entity}</TableCell>
                  <TableCell>{a.action}</TableCell>
                  <TableCell>{a.detail}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setSelected(a); setOpen(true); }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {project.activity.length === 0 && (
                <TableRow><TableCell colSpan={6}>No activity</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <ActivityDetailsDrawer open={open} onClose={() => setOpen(false)} activity={selected} />
    </>
  );
}
