"use client"
// src/sections/projects/ProjectManagementRoot.tsx
import { useMemo, useState } from 'react';
import {
  Box, Stack, Divider, useTheme, useMediaQuery, IconButton, AppBar, Toolbar, Typography, Button, Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FolderIcon from '@mui/icons-material/Folder';
import { MOCK_TEAMS } from './projectManagementComponents/mock';
import { ProjectPage } from './projectManagementComponents/projectPage';
import { TeamSidebarDrawer } from './projectManagementComponents/teamSidebarDrawer';
import { ProjectListDrawer } from './projectManagementComponents/projectListDrawer';
import { TeamSidebar } from './projectManagementComponents/teamSidebar';
import { ProjectListPanel } from './projectManagementComponents/projectListPanel';

export function ProjectManagementRoot() {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));

  const [teamId, setTeamId] = useState(MOCK_TEAMS[0]?.id ?? '');
  const [projectId, setProjectId] = useState(MOCK_TEAMS[0]?.projects[0]?.id ?? '');

  const [leftOpen, setLeftOpen] = useState(false);   // Teams
  const [rightOpen, setRightOpen] = useState(false); // Projects

  const selectedTeam = useMemo(() => MOCK_TEAMS.find((t) => t.id === teamId), [teamId]);
  const selectedProject = useMemo(
    () => selectedTeam?.projects.find((p) => p.id === projectId),
    [selectedTeam, projectId]
  );

  const handleSelectTeam = (id: string) => {
    setTeamId(id);
    const first = MOCK_TEAMS.find((t) => t.id === id)?.projects[0];
    setProjectId(first?.id ?? '');
    setLeftOpen(false);
  };

  const handleSelectProject = (id: string) => {
    setProjectId(id);
    setRightOpen(false);
  };

  // ---------- Laptop-friendly Top AppBar ----------
  if (mdDown) {
    return (
      <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="default" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar variant="dense">
            <Tooltip title="Teams">
              <IconButton edge="start" onClick={() => setLeftOpen(true)}>
                <MenuIcon />
              </IconButton>
            </Tooltip>

            <Typography variant="subtitle1" noWrap sx={{ ml: 1 }}>
              {selectedTeam?.name ?? 'Teams'} {selectedProject ? `• ${selectedProject.name}` : ''}
            </Typography>

            <Box sx={{ flex: 1 }} />
            <Tooltip title="Projects">
              <IconButton edge="end" onClick={() => setRightOpen(true)}>
                <FolderIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {selectedTeam && selectedProject ? (
            <ProjectPage team={selectedTeam} project={selectedProject} isCompact />
          ) : null}
        </Box>

        {/* Drawers for smaller screens */}
        <TeamSidebarDrawer
          open={leftOpen}
          onClose={() => setLeftOpen(false)}
          teams={MOCK_TEAMS}
          teamId={teamId}
          onSelectTeam={handleSelectTeam}
        />
        <ProjectListDrawer
          open={rightOpen}
          onClose={() => setRightOpen(false)}
          team={selectedTeam}
          selectedProjectId={projectId}
          onSelectProject={handleSelectProject}
        />
      </Box>
    );
  }

  // ---------- Desktop / Large screen layout ----------
  return (
    <Stack direction="row" sx={{ height: 'calc(100vh - 160px)' }}>
      <TeamSidebar
        teams={MOCK_TEAMS}
        teamId={teamId}
        onSelectTeam={handleSelectTeam}
      />
      <Divider orientation="vertical" flexItem />
      <ProjectListPanel
        team={selectedTeam}
        selectedProjectId={projectId}
        onSelectProject={handleSelectProject}
      />
      <Divider orientation="vertical" flexItem />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {selectedTeam && selectedProject ? <ProjectPage team={selectedTeam} project={selectedProject} /> : null}
      </Box>
    </Stack>
  );
}
