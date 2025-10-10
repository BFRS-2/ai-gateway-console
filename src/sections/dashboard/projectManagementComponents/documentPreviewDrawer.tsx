import { Drawer, Box, Stack, Typography, Chip, Button } from '@mui/material';
import { DocumentAsset } from './types';


export function DocumentPreviewDrawer({
  open, onClose, doc,
}: { open: boolean; onClose: () => void; doc: DocumentAsset | null }) {
  if (!doc) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 480 } }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">{doc.name}</Typography>
        <Typography variant="body2" color="text.secondary">{doc.type.toUpperCase()} • Updated: {doc.updatedAt}</Typography>
        <Chip label={doc.ragAttached ? 'Attached to RAG' : 'Not in RAG'} size="small" sx={{ mt: 1 }} />
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Typography variant="body2">Preview (stub):</Typography>
          <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 2, height: 280, bgcolor: 'background.default' }}>
            {/* TODO: Embed real preview (PDF viewer, CSV grid, etc.) */}
            <Typography variant="caption" color="text.secondary">Preview not available in mock.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained">Attach to RAG</Button>
            <Button variant="outlined">Download</Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
