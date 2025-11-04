"use client";

import { useEffect, useMemo, useState } from "react";
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

// reuse your existing components
import { TeamSidebarDrawer as OrgSidebarDrawer } from "./projectManagementComponents/teamSidebarDrawer";
import { ProjectListDrawer } from "./projectManagementComponents/projectListDrawer";
import { TeamSidebar as OrgSidebar } from "./projectManagementComponents/teamSidebar";
import { ProjectListPanel } from "./projectManagementComponents/projectListPanel";

import projectService from "src/api/services/project.service";
// <- path adjust if different
import { useSnackbar } from "notistack";
import OverviewSection from "./overview";

export function ProjectManagementRoot() {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down("md"));
  const { enqueueSnackbar } = useSnackbar();

  // all orgs with their projects from store
  const orgMapping = useSelector(
    (state: RootState) => state.orgProject.organizationProjects
  ) as {
    id: string;
    name: string;
    projects: {
      id: string;
      name: string;
      organization_id: string;
    }[];
  }[];

  // this was in your previous version — sometimes you keep "selectedOrganizationProject" separately
  const orgIdFromStore = useSelector(
    (state: RootState) =>
      state.orgProject.selectedOrganizationProject?.organizationId
  );

  // selected org & project
  const [orgId, setOrgId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");

  // drawers (mobile)
  const [leftOpen, setLeftOpen] = useState(false); // orgs
  const [rightOpen, setRightOpen] = useState(false); // projects

  // create project modal
  const [createOpen, setCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  // pick first org on load / change
  useEffect(() => {
    if (orgMapping && orgMapping.length > 0) {
      setOrgId((prev) => prev || orgMapping[0].id);
      const firstProj = orgMapping[0].projects?.[0];
      if (firstProj) {
        setProjectId((prev) => prev || firstProj.id);
      }
    }
  }, [orgMapping]);

  const selectedOrg = useMemo(
    () => orgMapping?.find((o) => o.id === orgId),
    [orgMapping, orgId]
  );

  const selectedProject = useMemo(
    () => selectedOrg?.projects?.find((p) => p.id === projectId),
    [selectedOrg, projectId]
  );

  const handleSelectOrg = (id: string) => {
    setOrgId(id);
    const first = orgMapping.find((o) => o.id === id)?.projects?.[0];
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
    // prefer currently selected org; fallback to store’s selectedOrganizationProject
    const finalOrgId = orgId || orgIdFromStore;
    if (!finalOrgId) {
      enqueueSnackbar("No organization selected", { variant: "error" });
      return;
    }
    if (!projectName.trim()) {
      enqueueSnackbar("Project name is required", { variant: "warning" });
      return;
    }

    try {
      setCreating(true);
      const projRes = await projectService.create({
        name: projectName.trim(),
        organization_id: finalOrgId,
      });

      if (projRes?.success) {
        const created = projRes?.data ?? projRes;
        if (created?.id) {
          setProjectId(created.id);
        }
        enqueueSnackbar("Project created", { variant: "success" });
        // let parent/page know to refetch mapping
        window.dispatchEvent(new Event("fetch_org_project"));
        setCreateOpen(false);
      } else {
        enqueueSnackbar("Project creation failed", { variant: "error" });
      }
    } catch (err) {
      console.error("create project failed", err);
      enqueueSnackbar("Project creation failed", { variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  // =============== MOBILE / TABLET LAYOUT ===============
  if (mdDown) {
    return (
      <Box
        sx={{
          height: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppBar
          position="static"
          color="default"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar variant="dense">
            <Tooltip title="Organizations">
              <IconButton edge="start" onClick={() => setLeftOpen(true)}>
                <MenuIcon />
              </IconButton>
            </Tooltip>

            <Typography variant="subtitle1" noWrap sx={{ ml: 1 }}>
              {selectedOrg?.name ?? "Organizations"}{" "}
              {selectedProject ? `• ${selectedProject.name}` : ""}
            </Typography>

            <Box sx={{ flex: 1 }} />

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

        {/* middle / content */}
        <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {selectedOrg && projectId ? (
            <OverviewSection
              projectId={projectId}
              projectName={
                selectedOrg.projects?.find((p) => p.id === projectId)?.name
              }
            />
          ) : null}
        </Box>

        {/* drawers */}
        <OrgSidebarDrawer
          open={leftOpen}
          onClose={() => setLeftOpen(false)}
          teams={orgMapping as Project}
          teamId={orgId}
          onSelectTeam={handleSelectOrg}
        />
        <ProjectListDrawer
          open={rightOpen}
          onClose={() => setRightOpen(false)}
          team={selectedOrg as any}
          selectedProjectId={projectId}
          onSelectProject={handleSelectProject}
        />

        {/* create project modal */}
        <Dialog
          open={createOpen}
          onClose={handleCloseCreate}
          fullWidth
          maxWidth="xs"
        >
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
            <Button
              onClick={handleCreateProject}
              variant="contained"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // =============== DESKTOP LAYOUT ===============
  return (
    <>
      <Stack direction="row" sx={{ height: "calc(100vh - 160px)" }}>
        {/* LEFT: orgs */}
        <OrgSidebar
          teams={orgMapping}
          teamId={orgId}
          onSelectTeam={handleSelectOrg}
        />
        <Divider orientation="vertical" flexItem />

        {/* MIDDLE: projects of selected org */}
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 1, display: "flex", justifyContent: "flex-end" }}>
            <Button size="small" variant="outlined" onClick={handleOpenCreate}>
              Create project
            </Button>
          </Box>
          <ProjectListPanel
            team={selectedOrg as any}
            selectedProjectId={projectId}
            onSelectProject={handleSelectProject}
          />
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* RIGHT: usage of selected project */}
        <Box sx={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          {selectedOrg && projectId ? (
            <OverviewSection
              projectId={projectId}
              projectName={
                selectedOrg.projects?.find((p) => p.id === projectId)?.name
              }
            />
          ) : (
            <Typography sx={{ p: 3 }} variant="body2">
              Select a project to view its usage.
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Create project modal (desktop) */}
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
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={creating}
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
