"use client";

import {
  Alert,
  Box,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import projectService from "src/api/services/project.service";

type ProjectSettingsTabProps = {
  projectId: string;
  selectedProject?: { id: string; name: string };
};

type ApiKey = {
  id: string;
  name: string;
  created_at?: string;
};

export function ProjectSettingsTab({
  projectId,
  selectedProject,
}: ProjectSettingsTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [rateDaily, setRateDaily] = useState("");
  const [rateMonthly, setRateMonthly] = useState("");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newApiKeyName, setNewApiKeyName] = useState("");

  // load data when project changes
  useEffect(() => {
    if (!projectId) {
      setSettingsName("");
      setRateDaily("");
      setRateMonthly("");
      setApiKeys([]);
      return;
    }

    (async () => {
      setLoadingDetails(true);
      try {
        // 1) project details
        const res = await (projectService as any).getById?.(projectId);
        if (res?.success && res?.data?.project) {
          const proj = res.data.project;
          setSettingsName(proj.name || "");
          if (proj.limits) {
            setRateDaily(
              typeof proj.limits.daily === "number"
                ? String(proj.limits.daily)
                : ""
            );
            setRateMonthly(
              typeof proj.limits.monthly === "number"
                ? String(proj.limits.monthly)
                : ""
            );
          }
        } else {
          // fallback to selected project name
          setSettingsName(selectedProject?.name || "");
        }

        // 2) api keys
        const keysRes = await (projectService as any).listApiKeys?.(projectId);
        if (keysRes?.success && Array.isArray(keysRes.data?.keys)) {
          setApiKeys(keysRes.data.keys);
        } else {
          setApiKeys([]);
        }
      } catch (err) {
        console.error("load project settings failed", err);
        setSettingsName(selectedProject?.name || "");
        setApiKeys([]);
      } finally {
        setLoadingDetails(false);
      }
    })();
  }, [projectId, selectedProject]);

  const handleSaveName = async () => {
    if (!projectId) return;
    if (!settingsName.trim()) {
      enqueueSnackbar("Project name cannot be empty", { variant: "warning" });
      return;
    }
    try {
      const res = await (projectService as any).update?.(projectId, {
        name: settingsName.trim(),
      });
      if (res?.success) {
        enqueueSnackbar("Project name updated", { variant: "success" });
        // let the rest of the app refresh
        window.dispatchEvent(new Event("fetch_org_project"));
      } else {
        enqueueSnackbar("Failed to update project name", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Failed to update project name", { variant: "error" });
    }
  };

  const handleSaveLimits = async () => {
    if (!projectId) return;
    try {
      const daily = rateDaily ? Number(rateDaily) : null;
      const monthly = rateMonthly ? Number(rateMonthly) : null;
      const res = await (projectService as any).updateRateLimits?.(projectId, {
        daily,
        monthly,
      });
      if (res?.success) {
        enqueueSnackbar("Rate limits updated", { variant: "success" });
      } else {
        enqueueSnackbar("Failed to update rate limits", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Failed to update rate limits", { variant: "error" });
    }
  };

  const handleCreateKey = async () => {
    if (!projectId) return;
    if (!newApiKeyName.trim()) {
      enqueueSnackbar("API key name is required", { variant: "warning" });
      return;
    }
    try {
      const res = await (projectService as any).createApiKey?.(projectId, {
        name: newApiKeyName.trim(),
      });
      if (res?.success) {
        enqueueSnackbar("API key created", { variant: "success" });
        setNewApiKeyName("");
        // refresh
        const keysRes = await (projectService as any).listApiKeys?.(projectId);
        if (keysRes?.success && Array.isArray(keysRes.data?.keys)) {
          setApiKeys(keysRes.data.keys);
        }
      } else {
        enqueueSnackbar("Failed to create API key", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Failed to create API key", { variant: "error" });
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!projectId) return;
    try {
      const res = await (projectService as any).deleteApiKey?.(
        projectId,
        keyId
      );
      if (res?.success) {
        enqueueSnackbar("API key deleted", { variant: "success" });
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      } else {
        enqueueSnackbar("Failed to delete API key", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Failed to delete API key", { variant: "error" });
    }
  };

  if (!projectId) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">Select a project to edit settings.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Project settings
      </Typography>

      <Grid container spacing={2} alignItems="stretch">
        {/* Project info */}
        <Grid item xs={12} md={4}>
          <Paper
            variant="outlined"
            sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Project details
            </Typography>
            <TextField
              label="Project name"
              size="small"
              value={settingsName}
              onChange={(e) => setSettingsName(e.target.value)}
              disabled={loadingDetails}
              sx={{ mb: 1.5 }}
            />
            <Button variant="contained" onClick={handleSaveName} disabled={loadingDetails}>
              Save name
            </Button>
          </Paper>
        </Grid>

        {/* Rate limits */}
        <Grid item xs={12} md={4}>
          <Paper
            variant="outlined"
            sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Rate limits
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <TextField
                label="Daily"
                size="small"
                value={rateDaily}
                onChange={(e) => setRateDaily(e.target.value)}
                disabled={loadingDetails}
              />
              <TextField
                label="Monthly"
                size="small"
                value={rateMonthly}
                onChange={(e) => setRateMonthly(e.target.value)}
                disabled={loadingDetails}
              />
            </Stack>
            <Button variant="outlined" onClick={handleSaveLimits} disabled={loadingDetails}>
              Save limits
            </Button>
          </Paper>
        </Grid>

        {/* API keys */}
        <Grid item xs={12} md={4}>
          <Paper
            variant="outlined"
            sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              API credentials
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <TextField
                label="Key name"
                size="small"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
              />
              <Button size="small" variant="contained" onClick={handleCreateKey}>
                New
              </Button>
            </Stack>

            <Divider sx={{ mb: 1 }} />

            <Box sx={{ flex: 1, overflow: "auto" }}>
              <List dense>
                {apiKeys.length ? (
                  apiKeys.map((key) => (
                    <ListItem key={key.id} secondaryAction={
                      <IconButton edge="end" onClick={() => handleDeleteKey(key.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }>
                      <ListItemText
                        primary={key.name}
                        secondary={
                          key.created_at ? `Created: ${key.created_at}` : undefined
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No keys yet" />
                  </ListItem>
                )}
              </List>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
