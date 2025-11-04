"use client";
import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import FolderIcon from "@mui/icons-material/Folder";
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";
import { MOCK_TEAMS } from "./projectManagementComponents/mock";
import { ProjectPage } from "./projectManagementComponents/projectPage";
import { TeamSidebarDrawer } from "./projectManagementComponents/teamSidebarDrawer";
import { ProjectListDrawer } from "./projectManagementComponents/projectListDrawer";
import { TeamSidebar } from "./projectManagementComponents/teamSidebar";
import { ProjectListPanel } from "./projectManagementComponents/projectListPanel";
import projectService from "src/api/services/project.service"; // adjust path if needed
import { enqueueSnackbar } from "notistack";

export function ProjectManagementRoot() {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down("md"));

  // ✅ correct selector
  const organizationId = useSelector(
    (state: RootState) =>
      state.orgProject.selectedOrganizationProject?.organizationId
  );

  const [teamId, setTeamId] = useState(MOCK_TEAMS[0]?.id ?? "");
  const [projectId, setProjectId] = useState(
    MOCK_TEAMS[0]?.projects[0]?.id ?? ""
  );

  const [leftOpen, setLeftOpen] = useState(false); // Teams
  const [rightOpen, setRightOpen] = useState(false); // Projects

  // modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedTeam = useMemo(
    () => MOCK_TEAMS.find((t) => t.id === teamId),
    [teamId]
  );
  const selectedProject = useMemo(
    () => selectedTeam?.projects.find((p) => p.id === projectId),
    [selectedTeam, projectId]
  );

  const handleSelectTeam = (id: string) => {
    setTeamId(id);
    const first = MOCK_TEAMS.find((t) => t.id === id)?.projects[0];
    setProjectId(first?.id ?? "");
    setLeftOpen(false);
  };

  const handleSelectProject = (id: string) => {
    setProjectId(id);
    setRightOpen(false);
  };

  const handleOpenCreate = () => {
    setProjectName("");
    setCreateOpen(true);
  };
  const handleCloseCreate = () => {
    if (creating) return;
    setCreateOpen(false);
  };

  const handleCreateProject = async () => {
    if (!organizationId) {
      // you can toast/snackbar here if you want
      return;
    }
    if (!projectName.trim()) {
      return;
    }
    try {
      setCreating(true);
      const projRes = await projectService.create({
        name: projectName.trim(),
        organization_id: organizationId,
      });

      if(projRes.success){
      const created = projRes?.data ?? projRes;
      if (created) {
        setProjectId(created.id);
        enqueueSnackbar("Project created", {variant : "success"})
        window.dispatchEvent(new Event('fetch_org_project'));
      }
      setCreateOpen(false);
      }
      else{
         enqueueSnackbar("Project creation failed", {variant : "error"})
      }

      
    } catch (err) {
      console.error("create project failed", err);
      // show snackbar here if you have it in this component
    } finally {
      setCreating(false);
    }
  };

  // ---------- Mobile / mdDown ----------
  if (mdDown) {
    return (
      <Box
        sx={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}
      >
        <AppBar
          position="static"
          color="default"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar variant="dense">
            <Tooltip title="Teams">
              <IconButton edge="start" onClick={() => setLeftOpen(true)}>
                <MenuIcon />
              </IconButton>
            </Tooltip>

            <Typography variant="subtitle1" noWrap sx={{ ml: 1 }}>
              {selectedTeam?.name ?? "Teams"}{" "}
              {selectedProject ? `• ${selectedProject.name}` : ""}
            </Typography>

            <Box sx={{ flex: 1 }} />

            {/* create button on mobile */}
            <Button size="small" onClick={handleOpenCreate}>
              New
            </Button>

            <Tooltip title="Projects">
              <IconButton edge="end" onClick={() => setRightOpen(true)}>
                <FolderIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
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

        {/* Create project modal */}
        <Dialog open={createOpen} onClose={handleCloseCreate} fullWidth maxWidth="xs">
          <DialogTitle>Create project</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              label="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreate} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} variant="contained" disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ---------- Desktop / Large screen layout ----------
  return (
    <>
      <Stack direction="row" sx={{ height: "calc(100vh - 160px)" }}>
        <TeamSidebar
          teams={MOCK_TEAMS}
          teamId={teamId}
          onSelectTeam={handleSelectTeam}
        />
        <Divider orientation="vertical" flexItem />

        {/* project list + create button over there? */}
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 1, display: "flex", justifyContent: "flex-end" }}>
            <Button size="small" variant="outlined" onClick={handleOpenCreate}>
              Create project
            </Button>
          </Box>
          <ProjectListPanel
            team={selectedTeam}
            selectedProjectId={projectId}
            onSelectProject={handleSelectProject}
          />
        </Box>

        <Divider orientation="vertical" flexItem />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {selectedTeam && selectedProject ? (
            <ProjectPage team={selectedTeam} project={selectedProject} />
          ) : null}
        </Box>
      </Stack>

      {/* Create project modal */}
      <Dialog open={createOpen} onClose={handleCloseCreate} fullWidth maxWidth="xs">
        <DialogTitle>Create project</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreateProject} variant="contained" disabled={creating}>
            {creating ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
