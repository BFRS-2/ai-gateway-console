// src/sections/projects/project/tabs/ProjectServicesTab.tsx
import { useState } from 'react';
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  IconButton, Chip, Stack, Typography, TablePagination
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { Project, ServiceConfig } from './types';
import { ServiceDetailsDrawer } from './serviceDetailDrawer';

export function ProjectServicesTab({ project, dense }: { project: Project; dense?: boolean }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ServiceConfig | null>(null);
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(dense ? 5 : 10);

  const paged = project.services.slice(page * rpp, page * rpp + rpp);

  return (
    <>
      <Paper variant="outlined">
        <TableContainer>
          <Table size={dense ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Kind</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Model/Lang</TableCell>
                <TableCell>Calls (30d)</TableCell>
                <TableCell>Cost (30d)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </TableCell>
                  <TableCell>{s.kind}</TableCell>
                  <TableCell>
                    <Chip size="small" label={s.status} color={s.status === 'active' ? 'success' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.model ?? s.language ?? '-'}
                  </TableCell>
                  <TableCell>{s.metrics?.calls30d?.toLocaleString('en-IN')}</TableCell>
                  <TableCell>₹{(s.metrics?.costINR30d ?? 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => { setSelected(s); setOpen(true); }}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary">No services linked</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={project.services.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rpp}
          onRowsPerPageChange={(e) => { setRpp(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={dense ? [5, 10, 25] : [10, 25, 50]}
        />
      </Paper>

      <ServiceDetailsDrawer open={open} onClose={() => setOpen(false)} service={selected} />
    </>
  );
}
