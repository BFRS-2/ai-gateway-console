"use client";

import {
  Alert,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tooltip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Box from "@mui/material/Box";
import { SxProps, Theme } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import projectService from "src/api/services/project.service";

type ProjectSettingsTabProps = {
  projectId: string;
  selectedProject?: { id: string; name: string };
};

type ProjectDetails = {
  id: string;
  name: string;
  organization_id: string;
  description?: string;
  cost_limits?: { daily?: number; monthly?: number };
  status?: "active" | "inactive";
  api_keys?: string[]; // masked keys
  langfuse_project_name?: string;
};

export function ProjectSettingsTab({
  projectId,
  selectedProject,
}: ProjectSettingsTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  // ---------- Local state ----------
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [daily, setDaily] = useState<string>("");
  const [monthly, setMonthly] = useState<string>("");
  const [langfuseProjectName, setLangfuseProjectName] = useState<string>("");

  const [apiKeys, setApiKeys] = useState<string[]>([]);

  // Revoke dialog
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [pendingRevokeKey, setPendingRevokeKey] = useState<string | null>(null);

  // New key (one-time reveal) modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [plainNewKey, setPlainNewKey] = useState<string>("");

  const gradientCard: SxProps<Theme> = {
    p: 2,
    display: "flex",
    flexDirection: "column",
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    background:
      "linear-gradient(180deg, rgba(124,58,237,0.06) 0%, rgba(16,185,129,0.06) 100%)",
  };

  const headerGradient: SxProps<Theme> = useMemo(
    () => ({
      mb: 2,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
    }),
    []
  );

  // ---------- Utilities ----------
  const maskKey = (k: string) => {
    if (!k) return "";
    if (k.length <= 8) return k;
    const start = k.slice(0, 4);
    const end = k.slice(-4);
    return `${start}••••••••••••••••${end}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      enqueueSnackbar("Copied!", { variant: "success" });
    } catch {
      enqueueSnackbar("Copy failed", { variant: "error" });
    }
  };

  // ---------- Load ----------
  const fetchDetails = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await (projectService as any).getProjectDetails?.(projectId);
      const proj: ProjectDetails | undefined = res?.data?.[0];
      if (proj) {
        setName(proj.name ?? selectedProject?.name ?? "");
        setDescription(proj.description ?? "");
        setStatus((proj.status as any) ?? "active");
        setDaily(
          typeof proj.cost_limits?.daily === "number"
            ? String(proj.cost_limits?.daily)
            : ""
        );
        setMonthly(
          typeof proj.cost_limits?.monthly === "number"
            ? String(proj.cost_limits?.monthly)
            : ""
        );
        setLangfuseProjectName(proj.langfuse_project_name ?? "");
        setApiKeys(Array.isArray(proj.api_keys) ? proj.api_keys : []);
      } else {
        setName(selectedProject?.name || "");
        setApiKeys([]);
      }
    } catch (err) {
      console.error("getProjectDetails failed", err);
      enqueueSnackbar("Failed to load project details", { variant: "error" });
      setName(selectedProject?.name || "");
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId) {
      setName("");
      setDescription("");
      setStatus("active");
      setDaily("");
      setMonthly("");
      setLangfuseProjectName("");
      setApiKeys([]);
      return;
    }
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ---------- Handlers ----------
  const handleSaveAll = async () => {
    if (!projectId) return;
    if (!name.trim()) {
      enqueueSnackbar("Project name cannot be empty", { variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        project_id: projectId,
        name: name.trim(),
        description: description?.trim() || "",
        status,
        cost_limits: {
          daily: daily ? Number(daily) : undefined,
          monthly: monthly ? Number(monthly) : undefined,
        },
        langfuse_project_name: langfuseProjectName?.trim() || undefined,
      };
      const res = await (projectService as any).updatePoject?.(payload);
      if (res?.success) {
        enqueueSnackbar("Project updated", { variant: "success" });
        window.dispatchEvent(new Event("fetch_org_project"));
        fetchDetails();
      } else {
        enqueueSnackbar("Failed to update project", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Failed to update project", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateKey = async () => {
    if (!projectId) return;
    try {
      // If your service accepts no body at all:
      // const res = await (projectService as any).addNewApiKey?.(projectId);
      // If it expects an object body (even empty), keep {}:
      const res = await (projectService as any).addNewApiKey?.(projectId);
      if (res?.success) {
        // Extract plain key (defensive)
        const plain =
          res?.data?.api_key ||
          res?.data?.key ||
          (typeof res?.data === "string" ? res.data : "") ||
          res?.api_key ||
          "";

        if (plain) {
          setPlainNewKey(plain);
          setShowKeyModal(true);
        } else {
          enqueueSnackbar(
            "API key created. Backend did not return the secret to display.",
            { variant: "info" }
          );
        }

        await fetchDetails();
      } else {
        enqueueSnackbar("Failed to create API key", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Failed to create API key", { variant: "error" });
    }
  };

  const confirmRevoke = (apiKey: string) => {
    setPendingRevokeKey(apiKey);
    setRevokeOpen(true);
  };

  const handleRevoke = async () => {
    if (!pendingRevokeKey) return;
    try {
      const res = await (projectService as any).deleteApiKey?.(pendingRevokeKey);
      if (res?.success) {
        enqueueSnackbar("API key revoked", { variant: "success" });
        setApiKeys((prev) => prev.filter((k) => k !== pendingRevokeKey));
      } else {
        enqueueSnackbar("Failed to revoke API key", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Failed to revoke API key", { variant: "error" });
    } finally {
      setRevokeOpen(false);
      setPendingRevokeKey(null);
    }
  };

  // ---------- Render ----------
  if (!projectId) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">Select a project to edit settings.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Header */}
      <Box sx={headerGradient}>
        <Typography variant="h5" fontWeight={700}>
          Project settings
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Refresh">
          <IconButton onClick={fetchDetails} size="small">
            <RefreshRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<CheckCircleRoundedIcon />}
          onClick={handleSaveAll}
          disabled={saving || loading}
          sx={{ ml: 1 }}
        >
          Save changes
        </Button>
      </Box>

      {/* Two-column layout */}
      <Grid container spacing={2} alignItems="stretch">
        {/* LEFT: Details */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={gradientCard}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
              Project details
            </Typography>

            {loading ? (
              <Stack spacing={1.2}>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={90} />
                <Skeleton height={40} />
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <TextField
                  label="Project name"
                  size="small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <FormControl size="small">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    label="Status"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as "active" | "inactive")
                    }
                  >
                    <MenuItem value="active">
                      <Chip
                        size="small"
                        color="success"
                        label="Active"
                        variant="filled"
                      />
                    </MenuItem>
                    <MenuItem value="inactive">
                      <Chip
                        size="small"
                        color="default"
                        label="Inactive"
                        variant="outlined"
                      />
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Description"
                  size="small"
                  multiline
                  minRows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <TextField
                  label="Log Index"
                  size="small"
                  value={langfuseProjectName}
                  onChange={(e) => setLangfuseProjectName(e.target.value)}
                  placeholder="optional"
                />

                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Changes are saved to your organization’s workspace.
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* RIGHT: Limits + API Keys */}
        <Grid item xs={12} md={6}>
          <Stack spacing={2} sx={{ height: "100%" }}>
            {/* Usage & cost limits */}
            <Paper variant="outlined" sx={gradientCard}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                Usage & cost limits
              </Typography>

              {loading ? (
                <Stack spacing={1.2}>
                  <Skeleton height={40} />
                  <Skeleton height={40} />
                </Stack>
              ) : (
                <>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 1.5 }}>
                    <TextField
                      label="Daily budget"
                      size="small"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={daily}
                      onChange={(e) => setDaily(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Monthly budget"
                      size="small"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={monthly}
                      onChange={(e) => setMonthly(e.target.value)}
                      fullWidth
                    />
                  </Stack>


                  {/* <Button
                    variant="contained"
                    startIcon={<CheckCircleRoundedIcon />}
                    onClick={handleSaveAll}
                    disabled={saving || loading}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Save limits
                  </Button> */}
                </>
              )}
            </Paper>

            {/* API credentials */}
            <Paper variant="outlined" sx={{ ...gradientCard, flex: 1 }}>
             

              {/* Name removed: just a Generate button */}
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
                 <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                API credentials
              </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={handleCreateKey}
                >
                  Generate new key
                </Button>
              </Stack>

              <Divider sx={{ mb: 1 }} />

              <Box sx={{ flex: 1, overflow: "auto" }}>
                {loading ? (
                  <Stack spacing={1.2}>
                    <Skeleton height={36} />
                    <Skeleton height={36} />
                    <Skeleton height={36} />
                  </Stack>
                ) : (
                  <List dense>
                    {apiKeys.length ? (
                      apiKeys.map((key) => (
                        <ListItem
                          key={key}
                          secondaryAction={
                            <Tooltip title="Revoke key">
                              <IconButton
                                edge="end"
                                onClick={() => confirmRevoke(key)}
                                size="small"
                                color="error"
                              >
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          }
                        >
                          <ListItemText
                            primaryTypographyProps={{
                              fontFamily: "monospace",
                              fontSize: 13,
                            }}
                            primary={maskKey(key)}
                            secondary="Secret not retrievable. You can only revoke."
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No keys yet" />
                      </ListItem>
                    )}
                  </List>
                )}
              </Box>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Revoke dialog */}
      <Dialog open={revokeOpen} onClose={() => setRevokeOpen(false)}>
        <DialogTitle>Revoke API key?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            This will immediately disable the selected key. You can’t undo this action.
          </Typography>
          {pendingRevokeKey && (
            <Box
              sx={{
                mt: 1.5,
                p: 1,
                borderRadius: 1,
                bgcolor: "background.default",
                border: "1px dashed",
                borderColor: "divider",
                fontFamily: "monospace",
                fontSize: 13,
              }}
            >
              {maskKey(pendingRevokeKey)}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleRevoke}>
            Revoke
          </Button>
        </DialogActions>
      </Dialog>

      {/* One-time key reveal modal */}
      <Dialog open={showKeyModal} onClose={() => setShowKeyModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>New API key created</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1 }}>
            Copy and keep it safe — it <b>cannot be accessed after this screen</b>.
          </Alert>
          <Box
            sx={{
              mt: 1,
              p: 1.25,
              borderRadius: 1,
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
              fontFamily: "monospace",
              fontSize: 14,
              wordBreak: "break-all",
            }}
          >
            {plainNewKey || "••••••••••••••••"}
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => copyToClipboard(plainNewKey)}
              disabled={!plainNewKey}
            >
              Copy
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowKeyModal(false)} variant="contained">
            I saved it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
