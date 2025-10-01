// src/sections/projects/responsive/ProjectListDrawer.tsx
import { Drawer, Box } from '@mui/material';
import { Team } from './types';
import { ProjectListPanel } from './projectListPanel';

export function ProjectListDrawer({
  open,
  onClose,
  team,
  selectedProjectId,
  onSelectProject,
}: {
  open: boolean;
  onClose: () => void;
  team?: Team;
  selectedProjectId?: string;
  onSelectProject: (id: string) => void;
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 340, maxWidth: '100vw' } }}>
      <Box role="presentation" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ProjectListPanel
          team={team}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => {
            onSelectProject(id);
            onClose();
          }}
        />
      </Box>
    </Drawer>
  );
}
