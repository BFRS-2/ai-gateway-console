// src/sections/projects/responsive/TeamSidebarDrawer.tsx
import { Drawer, Box } from '@mui/material';
import { Team } from './types';
import { TeamSidebar } from './teamSidebar';

export function TeamSidebarDrawer({
  open,
  onClose,
  teams,
  teamId,
  onSelectTeam,
}: {
  open: boolean;
  onClose: () => void;
  teams: Team[];
  teamId: string;
  onSelectTeam: (id: string) => void;
}) {
  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: 300, maxWidth: '100vw' } }}>
      <Box role="presentation" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TeamSidebar
          teams={teams}
          teamId={teamId}
          onSelectTeam={(id) => {
            onSelectTeam(id);
            onClose();
          }}
        />
      </Box>
    </Drawer>
  );
}
