// src/sections/projects/project/ProjectPage.tsx
import { useState } from 'react';
import { Box, Tabs, Tab, Stack, useTheme, useMediaQuery } from '@mui/material';
import { Project, Team } from './types';
import { ProjectHeader } from './projectHeader';
import { ProjectOverviewTab } from './projectOverviewTab';
import { ProjectServicesTab } from './projectServicesTab';
import { ProjectMembersTab } from './projectMember';
import { ProjectActivityTab } from './projectActivityTab';
import { ProjectDocumentsTab } from './projectDocumentTab';
import { ProjectSettingsTab } from './projectSettingsTab';

export function ProjectPage({
  team,
  project,
  isCompact = false,
}: { team: Team; project: Project; isCompact?: boolean }) {
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Stack sx={{ height: '100%', overflow: 'hidden' }}>
      <ProjectHeader team={team} project={project} compact={isCompact || mdDown} />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          px: { xs: 1, md: 2 },
          minHeight: 40,
          '& .MuiTab-root': { minHeight: 40, px: { xs: 1.25, sm: 1.5 } },
          borderBottom: 1,
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bgcolor: 'background.paper',
        }}
      >
        <Tab label="Overview" />
        <Tab label="Services" />
        <Tab label="Members" />
        <Tab label="Activity" />
        <Tab label="Documents" />
        <Tab label="Settings" />
      </Tabs>

      <Box sx={{ p: { xs: 1.5, md: 2 }, overflow: 'auto', flex: 1 }}>
        {tab === 0 && <ProjectOverviewTab project={project}  />}
        {tab === 1 && <ProjectServicesTab project={project}  />}
        {tab === 2 && <ProjectMembersTab project={project}  />}
        {tab === 3 && <ProjectActivityTab project={project}  />}
        {tab === 4 && <ProjectDocumentsTab project={project}  />}
        {tab === 5 && <ProjectSettingsTab project={project}  />}
      </Box>
    </Stack>
  );
}
