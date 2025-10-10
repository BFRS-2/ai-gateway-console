import { useState } from 'react';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Chip, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { Member, Project } from './types';
import { MemberDetailsDrawer } from './memberDetailDrawer';


export function ProjectMembersTab({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);

  return (
    <>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {project.members.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell><Chip size="small" label={m.role} /></TableCell>
                  <TableCell>{m.lastActiveAt ?? '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setSelected(m); setOpen(true); }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {project.members.length === 0 && (
                <TableRow><TableCell colSpan={5}>No members</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <MemberDetailsDrawer open={open} onClose={() => setOpen(false)} member={selected} />
    </>
  );
}
