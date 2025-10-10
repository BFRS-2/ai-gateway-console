import { useState } from 'react';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Chip, IconButton } from '@mui/material';
import { DocumentAsset, Project } from './types';
import { DocumentPreviewDrawer } from './documentPreviewDrawer';
import VisibilityIcon from '@mui/icons-material/Visibility';

export function ProjectDocumentsTab({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<DocumentAsset | null>(null);

  return (
    <>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell>RAG</TableCell>
                <TableCell align="right">Preview</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {project.documents.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d.type}</TableCell>
                  <TableCell>{d.sizeKB ? `${d.sizeKB} KB` : '-'}</TableCell>
                  <TableCell>{d.updatedAt}</TableCell>
                  <TableCell>
                    <Chip size="small" label={d.ragAttached ? 'Attached' : 'No'} color={d.ragAttached ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setSelected(d); setOpen(true); }}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {project.documents.length === 0 && (
                <TableRow><TableCell colSpan={6}>No documents</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <DocumentPreviewDrawer open={open} onClose={() => setOpen(false)} doc={selected} />
    </>
  );
}
