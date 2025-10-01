import { Drawer, Box, Stack, Typography, Divider, Chip, TextField, Button } from '@mui/material';
import { ServiceConfig } from './types';


export function ServiceDetailsDrawer({
  open, onClose, service,
}: { open: boolean; onClose: () => void; service: ServiceConfig | null }) {
  if (!service) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">{service.name}</Typography>
        <Typography variant="body2" color="text.secondary">{service.kind}</Typography>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Status</Typography>
          <Chip size="small" label={service.status} color={service.status === 'active' ? 'success' : 'default'} />
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Model / Language</Typography>
          <TextField size="small" label="Model" value={service.model ?? ''} />
          <TextField size="small" label="Language" value={service.language ?? ''} />
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Params (JSON)</Typography>
          <TextField size="small" multiline minRows={4} value={JSON.stringify(service.params ?? {}, null, 2)} />
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Metrics (30d)</Typography>
          <Typography variant="body2">Calls: {service.metrics?.calls30d?.toLocaleString('en-IN')}</Typography>
          <Typography variant="body2">Cost: ₹{(service.metrics?.costINR30d ?? 0).toLocaleString('en-IN')}</Typography>
          {service.metrics?.p95ms && <Typography variant="body2">p95: {service.metrics?.p95ms} ms</Typography>}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained">Save</Button>
            <Button variant="outlined" color="warning">Pause</Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
