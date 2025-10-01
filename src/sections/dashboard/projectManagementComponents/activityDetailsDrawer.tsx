import { Drawer, Box, Stack, Typography } from '@mui/material';
import { Activity } from './types';

export function ActivityDetailsDrawer({
  open, onClose, activity,
}: { open: boolean; onClose: () => void; activity: Activity | null }) {
  if (!activity) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Activity Detail</Typography>
        <Typography variant="body2" color="text.secondary">{activity.ts}</Typography>
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="body2"><b>Actor:</b> {activity.actor}</Typography>
          <Typography variant="body2"><b>Entity:</b> {activity.entity}</Typography>
          <Typography variant="body2"><b>Action:</b> {activity.action}</Typography>
          <Typography variant="body2"><b>Detail:</b> {activity.detail ?? '-'}</Typography>
        </Stack>
      </Box>
    </Drawer>
  );
}

