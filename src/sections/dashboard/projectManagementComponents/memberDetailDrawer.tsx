import { Drawer, Box, Stack, Typography, Chip, Button } from '@mui/material';
import { Member } from './types';


export function MemberDetailsDrawer({
  open, onClose, member,
}: { open: boolean; onClose: () => void; member: Member | null }) {
  if (!member) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 360 } }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">{member.name}</Typography>
        <Typography variant="body2" color="text.secondary">{member.email}</Typography>
        <Chip label={member.role} size="small" sx={{ mt: 1 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Last Active: {member.lastActiveAt ?? '-'}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="contained">Make Admin</Button>
          <Button variant="outlined" color="error">Remove</Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
