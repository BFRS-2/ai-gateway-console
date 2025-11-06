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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";
import { useSnackbar } from "notistack";
import projectService from "src/api/services/project.service";
import { ProjectListDrawer } from "./projectManagementComponents/projectListDrawer";
import userManagementService from "src/api/services/user.service";
import { ServicesPage } from "./serviceComponents/ServicesPage";

type ApiUser = {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  organizations: Array<{ organization_id: string; role: string }>;
  project_permissions: Array<{ project_id: string; access_type: string }>;
  status: string;
};

export function ProjectManagementRoot() {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down("md"));
  const { enqueueSnackbar } = useSnackbar();

  const selectedOrgFromStore = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );

  const projectList = selectedOrgFromStore?.projects && selectedOrgFromStore.projects.length
      ? selectedOrgFromStore.projects
      : [];
  console.log("🚀 ~ ProjectManagementRoot ~ projectList:", selectedOrgFromStore)

  const organizationId = selectedOrgFromStore?.organizationId || "";

  const [projectId, setProjectId] = useState<string>("");
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);

  // create project
  const [createOpen, setCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  // tabs
  const [tab, setTab] = useState(0);

  // invite
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "owner" | "member">(
    "member"
  );
  const [inviteAccess, setInviteAccess] = useState<"read" | "write" | "admin">(
    "read"
  );
  const [inviting, setInviting] = useState(false);

  // users + pagination
  const [userSearch, setUserSearch] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [userPage, setUserPage] = useState(0); // 0-based for MUI
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  const [userTotal, setUserTotal] = useState(0);

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
  // fetch users with pagination
  // ----------------------------
  const fetchUsers = async (
    name: string,
    page: number,
    limit: number
  ): Promise<void> => {
    try {
      setUserLoading(true);
      // API is 1-based, MUI is 0-based → add 1
      const res = await (userManagementService as any).listUsers(
        name || undefined,
        page + 1,
        limit
      );

      if (res?.success && res?.data) {
        const items: ApiUser[] = res.data.items || [];
        const pagination = res.data.pagination;
        setUsers(items);
        setUserTotal(pagination?.total_count ?? items.length);
      } else {
        setUsers([]);
        setUserTotal(0);
      }
    } catch (err) {
      console.error("listUsers failed", err);
      setUsers([]);
      setUserTotal(0);
    } finally {
      setUserLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchUsers(userSearch, userPage, userRowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch when search changes
  useEffect(() => {
    // reset to first page on new search
    setUserPage(0);
    fetchUsers(userSearch, 0, userRowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch]);

  // ----------------------------
  // invite user flow
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
      // refetch current page with same search
      fetchUsers(userSearch, userPage, userRowsPerPage);
    } catch (err) {
      console.error("invite failed", err);
      enqueueSnackbar("Failed to invite user", { variant: "error" });
    } finally {
      setInviting(false);
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
              <IconButton edge="start" onClick={() => setProjectDrawerOpen(true)}>
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
            <Tab label="User management" />
            <Tab label="Service management" />
          </Tabs>

          <Divider />

          {tab === 0 && (
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                    mb: 2,
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
              >
                <Typography variant="subtitle1">
                  Users for:{" "}
                  {selectedProject?.name ||
                    selectedOrgFromStore?.organizationName ||
                    "Current context"}
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleInviteOpen}
                  disabled={!projectId}
                >
                  Invite user
                </Button>
              </Box>

              <TextField
                size="small"
                fullWidth
                label="Search users"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Paper variant="outlined">
                {userLoading ? (
                  <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Email</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {users.length ? (
                          users.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>
                                {u.is_admin
                                  ? "admin"
                                  : u.organizations?.[0]?.role || "member"}
                              </TableCell>
                              <TableCell>{u.status}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <Typography variant="body2">
                                No users found.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <TablePagination
                      component="div"
                      count={userTotal}
                      page={userPage}
                      onPageChange={(_, newPage) => {
                        setUserPage(newPage);
                        fetchUsers(userSearch, newPage, userRowsPerPage);
                      }}
                      rowsPerPage={userRowsPerPage}
                      onRowsPerPageChange={(e) => {
                        const newRows = parseInt(e.target.value, 10);
                        setUserRowsPerPage(newRows);
                        setUserPage(0);
                        fetchUsers(userSearch, 0, newRows);
                      }}
                      rowsPerPageOptions={[5, 10, 20, 50]}
                    />
                  </>
                )}
              </Paper>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ p: 2 }}>
              <ServicesPage />
            </Box>
          )}
        </Box>

        {/* project drawer for mobile */}
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

        {/* Invite user modal */}
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
            <Typography variant="subtitle2">
              {selectedOrgFromStore?.organizationName || "Projects"}
            </Typography>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={handleOpenCreate}
            >
              New
            </Button>
          </Box>

          <Divider />

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {projectList.length ? (
              projectList.map((p) => (
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
                  <Typography variant="body2">{p.name}</Typography>
                </Box>
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
            p:1
          }}
        >
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="User management" />
            <Tab label="Service management" />
          </Tabs>

          <Divider />

          <Box sx={{ flex: 1, overflow: "auto" }}>
            {tab === 0 && (
              <Box sx={{ p: 2 }}>
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="subtitle1">
                    Users for:{" "}
                    {selectedProject?.name ||
                      selectedOrgFromStore?.organizationName ||
                      "Current context"}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleInviteOpen}
                    disabled={!projectId}
                  >
                    Invite user
                  </Button>
                </Box>

                <TextField
                  size="small"
                  label="Search users"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  sx={{ mb: 2, maxWidth: 280 }}
                />

                <Paper variant="outlined">
                  {userLoading ? (
                    <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : (
                    <>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Email</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {users.length ? (
                            users.map((u) => (
                              <TableRow key={u.id}>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>{u.name}</TableCell>
                                <TableCell>
                                  {u.is_admin
                                    ? "admin"
                                    : u.organizations?.[0]?.role || "member"}
                                </TableCell>
                                <TableCell>{u.status}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4}>
                                <Typography variant="body2">
                                  No users found.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <TablePagination
                        component="div"
                        count={userTotal}
                        page={userPage}
                        onPageChange={(_, newPage) => {
                          setUserPage(newPage);
                          fetchUsers(userSearch, newPage, userRowsPerPage);
                        }}
                        rowsPerPage={userRowsPerPage}
                        onRowsPerPageChange={(e) => {
                          const newRows = parseInt(e.target.value, 10);
                          setUserRowsPerPage(newRows);
                          setUserPage(0);
                          fetchUsers(userSearch, 0, newRows);
                        }}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                      />
                    </>
                  )}
                </Paper>
              </Box>
            )}

            {tab === 1 && (
              <Box sx={{ p: 2 }}>
                <ServicesPage />
              </Box>
            )}
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

      {/* Invite user modal */}
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
    </>
  );
}
