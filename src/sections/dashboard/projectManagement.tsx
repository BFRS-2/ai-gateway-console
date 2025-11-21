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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "src/stores/store";
import { useSnackbar } from "notistack";
import projectService from "src/api/services/project.service";
import userManagementService from "src/api/services/user.service";
import { ProjectListDrawer } from "./projectManagementComponents/projectListDrawer";
import { ProjectSettingsTab } from "./projectManagementComponents/projectSettingsTab";
import { MembersTab } from "./projectManagementComponents/membersTabs";
import { ServicesTab } from "./projectManagementComponents/servicesTab";
import authService from "src/api/services/auth.service";
import { setUserPermissionAndRole } from "src/stores/slicers/user";
import { hasValidCharacter } from "src/utils/hasValidCharacter";

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
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "owner" | "member">(
    "member"
  );
  const [inviteAccess, setInviteAccess] = useState<"read" | "write" | "admin">(
    "read"
  );
  const [inviting, setInviting] = useState(false);

  // API key reveal dialog (after project create)
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState<string>("");

  // pick first project whenever the list changes (org switch included)
  useEffect(() => {
    if (!projectList.length) {
      setProjectId("");
      return;
    }

    setProjectId((prev) => {
      // if previous project still exists in the new list, keep it
      const stillExists = prev && projectList.some((p) => p.id === prev);
      if (stillExists) return prev;

      // otherwise pick the first project of the new org
      return projectList[0].id;
    });
  }, [projectList]);

  const dispatch = useDispatch();
  const getUserPermissionAndRole = async () => {
    if (organizationId || selectedProject?.id) {
      try {
        const res = await authService.getUserPermissionForProjectOrg(
          organizationId || "",
          selectedProject?.id || ""
        );

        if (res?.success && res?.data) {
          // update redux store
          dispatch(
            setUserPermissionAndRole({
              access: res.data.access,
              role: res.data.role,
            })
          );
        }
      } catch (err) {
        console.error("getUserPermissionAndRole failed", err);
      }
    }
  };

  const selectedProject = useMemo(
    () => projectList.find((p) => p.id === projectId),
    [projectList, projectId, organizationId]
  );

  useEffect(() => {
    getUserPermissionAndRole();
  }, [organizationId, selectedProject?.id]);

  // ----------------------------
  // invite handlers
  // ----------------------------
  const handleInviteOpen = () => {
    setInviteEmail("");
    setInviteName("");
    setInviteRole("member");
    setInviteAccess("read");
    setInviteOpen(true);
  };

  const handleInviteClose = () => {
    if (inviting) return;
    setInviteOpen(false);
  };

  const handleInviteSubmit = async () => {
    if (!inviteName.trim()) {
      enqueueSnackbar("Name is required", { variant: "warning" });
      return;
    }
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
        name: inviteName.trim(),
        role: "admin",
      };
    } else if (inviteRole === "owner") {
      payload = {
        email: inviteEmail.trim(),
        name: inviteName.trim(),
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
        name: inviteName.trim(),
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

    if (projectName.trim().length < 2) {
      enqueueSnackbar("Project name should be atleast of 2 characters", {
        variant: "warning",
      });
      return;
    }
    if (projectName.trim().length > 45) {
      enqueueSnackbar("Project name should atmost be of 45 characters", {
        variant: "warning",
      });
      return;
    }
    if (hasValidCharacter(projectName.trim()) === false) {
      enqueueSnackbar(
        "Project name should not contain special characters except hyphen(-) and underscore(_).",
        { variant: "warning" }
      );
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

        // extract API key from response
        const firstKey =
          created?.api_keys && created.api_keys.length
            ? created.api_keys[0].key
            : null;

        if (firstKey) {
          setNewApiKey(firstKey);
          setNewProjectName(created?.name ?? projectName.trim());
          setApiKeyOpen(true);
        }

        enqueueSnackbar("Project created", { variant: "success" });
        // trigger org/project refetch so sidebars update
        window.dispatchEvent(new Event("fetch_org_project"));
        setCreateOpen(false);
      } else {
        enqueueSnackbar(
          projRes?.error?.payload?.message || "Project creation failed",
          { variant: "error" }
        );
      }
    } catch (err) {
      console.error("create project failed", err);
      enqueueSnackbar("Project creation failed", { variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (!newApiKey) return;

    // Preferred method: modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(newApiKey);
        enqueueSnackbar("API key copied", { variant: "success" });
        return;
      } catch (err) {
        console.warn("Clipboard API failed, fallback to legacy:", err);
      }
    }

    // Fallback method: create temporary textarea
    try {
      const textArea = document.createElement("textarea");
      textArea.value = newApiKey;
      textArea.style.position = "fixed"; // avoid scrolling to bottom
      textArea.style.left = "-9999px";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      enqueueSnackbar("API key copied", { variant: "success" });
    } catch {
      enqueueSnackbar("Failed to copy API key", { variant: "error" });
    }
  };
  const userRole = useSelector((state: RootState) => state.user.userRole);

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

            {["admin", "owner"].includes(userRole || "") && (
              <Button size="small" onClick={handleOpenCreate}>
                New
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, overflow: "auto" }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Project Settings" value={0} />
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

        {/* API key reveal dialog (mobile) */}
        <Dialog
          open={apiKeyOpen}
          onClose={() => setApiKeyOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Project API Key</DialogTitle>
          <DialogContent
            sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Project: <b>{newProjectName}</b>
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              This API key is shown only once. Store it securely.
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                fullWidth
                label="API key"
                value={newApiKey ?? ""}
                InputProps={{
                  readOnly: true,
                }}
              />
              <IconButton onClick={handleCopyApiKey} aria-label="Copy API key">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApiKeyOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* invite dialog (mobile too) */}
        <Dialog
          open={inviteOpen}
          onClose={handleInviteClose}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Invite Member</DialogTitle>
          <DialogContent
            sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Name"
              type="email"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              fullWidth
              sx={{
                mt: 2,
              }}
            />

            <TextField
              label="Email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              fullWidth
              sx={{
                mt: 2,
              }}
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
              // backgroundColor: "rgba(255,255,255,0.05)",
            }}
          >
            <Typography variant="subtitle2">Projects</Typography>
            {["admin", "owner"].includes(userRole || "") && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={handleOpenCreate}
              >
                Create
              </Button>
            )}
          </Box>

          <Divider />

          <Box sx={{ flex: 1, overflowY: "auto", mt: 1 }}>
            {projectList.length ? (
              projectList.map((p) => (
                <Tooltip key={p.id} title={p.name}>
                  <Box
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
            <Tab label="Project Settings" value={0} />
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

      {/* API key reveal dialog (desktop) */}
      <Dialog
        open={apiKeyOpen}
        onClose={() => setApiKeyOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Project API Key</DialogTitle>
        <DialogContent
          sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Project: <b>{newProjectName}</b>
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            This API key is shown only once. Store it securely.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
              fullWidth
              label="API key"
              value={newApiKey ?? ""}
              InputProps={{
                readOnly: true,
              }}
            />
            <IconButton onClick={handleCopyApiKey} aria-label="Copy API key">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Invite user modal (desktop) */}
      <Dialog
        open={inviteOpen}
        onClose={handleInviteClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent
          sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Name"
            type="email"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            fullWidth
            sx={{
              mt: 2,
            }}
          />

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
