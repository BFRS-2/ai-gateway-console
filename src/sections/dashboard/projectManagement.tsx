"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";
import { useSnackbar } from "notistack";
import projectService from "src/api/services/project.service";
import userManagementService from "src/api/services/user.service";
import { ProjectListDrawer } from "./projectManagementComponents/projectListDrawer";
import { ProjectSettingsTab } from "./projectManagementComponents/projectSettingsTab";
import { MembersTab } from "./projectManagementComponents/membersTabs";
import { ServicesTab } from "./projectManagementComponents/servicesTab";

export function ProjectManagementRoot() {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down("md"));
  const { enqueueSnackbar } = useSnackbar();

  const selectedOrgFromStore = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );

  const projectList =
    selectedOrgFromStore?.projects && selectedOrgFromStore.projects.length
      ? selectedOrgFromStore.projects
      : [];

  const organizationId = selectedOrgFromStore?.organizationId || "";

  const [projectId, setProjectId] = useState<string>("");
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);

  // create project
  const [createOpen, setCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  // tabs
  const [tab, setTab] = useState<0 | 1 | 2>(0);

  // invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] =
    useState<"admin" | "owner" | "member">("member");
  const [inviteAccess, setInviteAccess] =
    useState<"read" | "write" | "admin">("read");
  const [inviting, setInviting] = useState(false);

  // pick first project whenever the list changes
  useEffect(() => {
    if (projectList.length) {
      setProjectId((prev) => prev || projectList[0].id);
    } else {
      setProjectId("");
    }
  }, [projectList]);

  const selectedProject = useMemo(
    () => projectList.find((p) => p.id === projectId),
    [projectList, projectId]
  );

  // ----------------------------
  // invite handlers (missing before)
  // ----------------------------
  const handleInviteOpen = () => {
    setInviteEmail("");
    setInviteRole("member");
    setInviteAccess("read");
    setInviteOpen(true);
  };

  const handleInviteClose = () => {
    if (inviting) return;
    setInviteOpen(false);
  };

  const handleInviteSubmit = async () => {
    if (!inviteEmail.trim()) {
      enqueueSnackbar("Email is required", { variant: "warning" });
      return;
    }
    if (!organizationId) {
      enqueueSnackbar("No organization in context", { variant: "error" });
      return;
    }

    let payload: any;
    if (inviteRole === "admin") {
      payload = {
        email: inviteEmail.trim(),
        role: "admin",
      };
    } else if (inviteRole === "owner") {
      payload = {
        email: inviteEmail.trim(),
        role: "owner",
        organization_id: organizationId,
      };
    } else {
      if (!projectId) {
        enqueueSnackbar("Select a project first", { variant: "warning" });
        return;
      }
      payload = {
        email: inviteEmail.trim(),
        role: "member",
        organization_id: organizationId,
        project_id: projectId,
        access_type: inviteAccess,
      };
    }

    try {
      setInviting(true);
      await userManagementService.addMember(payload);
      enqueueSnackbar("Invitation sent", { variant: "success" });
      setInviteOpen(false);
      window.dispatchEvent(new Event("refetch_members"));
    } catch (err) {
      console.error("invite failed", err);
      enqueueSnackbar("Failed to invite user", { variant: "error" });
    } finally {
      setInviting(false);
    }
  };

  // ----------------------------
  // create project flow
  // ----------------------------
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
        organization_id: organizationId,
      });

      if (projRes?.success) {
        const created = projRes?.data ?? projRes;
        if (created?.id) {
          setProjectId(created.id);
        }
        enqueueSnackbar("Project created", { variant: "success" });
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

  // ----------------------------
  // MOBILE LAYOUT
  // ----------------------------
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
            <Tooltip title="Projects">
              <IconButton
                edge="start"
                onClick={() => setProjectDrawerOpen(true)}
              >
                <FolderIcon />
              </IconButton>
            </Tooltip>

            <Typography variant="subtitle1" noWrap sx={{ ml: 1 }}>
              {selectedProject?.name ?? "Projects"}
            </Typography>

            <Box sx={{ flex: 1 }} />

            <Button size="small" onClick={handleOpenCreate}>
              New
            </Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, overflow: "auto" }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Project settings" value={0} />
            <Tab label="Members" value={1} />
            <Tab label="Services" value={2} />
          </Tabs>

          <Divider />

          {tab === 0 && (
            <ProjectSettingsTab
              projectId={projectId}
              selectedProject={selectedProject}
            />
          )}

          {tab === 1 && (
            <MembersTab
              organizationId={organizationId}
              projectId={projectId}
              selectedProject={selectedProject}
              onInvite={handleInviteOpen}
            />
          )}

          {tab === 2 && <ServicesTab projectId={projectId} />}
        </Box>

        {/* Project drawer for mobile */}
        <ProjectListDrawer
          open={projectDrawerOpen}
          onClose={() => setProjectDrawerOpen(false)}
          team={
            {
              id: organizationId,
              name: selectedOrgFromStore?.organizationName,
              projects: projectList,
            } as any
          }
          selectedProjectId={projectId}
          onSelectProject={(id) => {
            setProjectId(id);
            setProjectDrawerOpen(false);
          }}
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

        {/* invite dialog (mobile too) */}
        <Dialog
          open={inviteOpen}
          onClose={handleInviteClose}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Invite user</DialogTitle>
          <DialogContent
            sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth size="small">
              <InputLabel id="invite-role-label">Role</InputLabel>
              <Select
                labelId="invite-role-label"
                label="Role"
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(
                    e.target.value as "admin" | "owner" | "member"
                  )
                }
              >
                <MenuItem value="admin">Admin (platform-wide)</MenuItem>
                <MenuItem value="owner">Owner (organization)</MenuItem>
                <MenuItem value="member">Member (project)</MenuItem>
              </Select>
            </FormControl>

            {inviteRole === "member" && (
              <FormControl fullWidth size="small">
                <InputLabel id="invite-access-label">Access</InputLabel>
                <Select
                  labelId="invite-access-label"
                  label="Access"
                  value={inviteAccess}
                  onChange={(e) =>
                    setInviteAccess(
                      e.target.value as "read" | "write" | "admin"
                    )
                  }
                >
                  <MenuItem value="read">Read</MenuItem>
                  <MenuItem value="write">Write</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleInviteClose} disabled={inviting}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteSubmit}
              disabled={inviting}
              variant="contained"
            >
              {inviting ? "Inviting..." : "Invite"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ----------------------------
  // DESKTOP LAYOUT
  // ----------------------------
  return (
    <>
      <Stack direction="row" sx={{ height: "calc(100vh - 80px)" }}>
        {/* LEFT: projects */}
        <Box
          sx={{
            width: 260,
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle2">Projects</Typography>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={handleOpenCreate}
            >
              Create
            </Button>
          </Box>

          <Divider />

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {projectList.length ? (
              projectList.map((p) => (
                <Tooltip title={p.name}>
                <Box
                  key={p.id}
                  onClick={() => setProjectId(p.id)}
                  sx={{
                    px: 1.5,
                    py: 1,
                    cursor: "pointer",
                    bgcolor:
                      p.id === projectId ? "action.selected" : "transparent",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: "100%",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.name}
                  </Typography>
                </Box>
                </Tooltip>
              ))
            ) : (
              <Typography sx={{ p: 2 }} variant="body2">
                No projects found.
              </Typography>
            )}
          </Box>
        </Box>

        {/* RIGHT: tabs */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            p: 0,
            pl: 2,
            pr: 2,
          }}
        >
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Project settings" value={0} />
            <Tab label="Members" value={1} />
            <Tab label="Services" value={2} />
          </Tabs>

          <Divider />

          <Box sx={{ flex: 1, overflow: "auto" }}>
            {tab === 0 && (
              <ProjectSettingsTab
                projectId={projectId}
                selectedProject={selectedProject}
              />
            )}

            {tab === 1 && (
              <MembersTab
                organizationId={organizationId}
                projectId={projectId}
                selectedProject={selectedProject}
                onInvite={handleInviteOpen} 
              />
            )}

            {tab === 2 && <ServicesTab projectId={projectId} />}
          </Box>
        </Box>
      </Stack>

      {/* Create project modal */}
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

      {/* Invite user modal (desktop) */}
      <Dialog
        open={inviteOpen}
        onClose={handleInviteClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Invite user</DialogTitle>
        <DialogContent
          sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            fullWidth
          />

          <FormControl fullWidth size="small">
            <InputLabel id="invite-role-label">Role</InputLabel>
            <Select
              labelId="invite-role-label"
              label="Role"
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as "admin" | "owner" | "member")
              }
            >
              <MenuItem value="admin">Admin (platform-wide)</MenuItem>
              <MenuItem value="owner">Owner (organization)</MenuItem>
              <MenuItem value="member">Member (project)</MenuItem>
            </Select>
          </FormControl>

          {inviteRole === "member" && (
            <FormControl fullWidth size="small">
              <InputLabel id="invite-access-label">Access</InputLabel>
              <Select
                labelId="invite-access-label"
                label="Access"
                value={inviteAccess}
                onChange={(e) =>
                  setInviteAccess(e.target.value as "read" | "write" | "admin")
                }
              >
                <MenuItem value="read">Read</MenuItem>
                <MenuItem value="write">Write</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleInviteClose} disabled={inviting}>
            Cancel
          </Button>
          <Button
            onClick={handleInviteSubmit}
            disabled={inviting}
            variant="contained"
          >
            {inviting ? "Inviting..." : "Invite"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
