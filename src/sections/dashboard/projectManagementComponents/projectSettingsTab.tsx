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
  InputAdornment,
} from "@mui/material";
import Box from "@mui/material/Box";
import { SxProps, Theme } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import projectService from "src/api/services/project.service";
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";
import { hasValidCharacter } from "src/utils/hasValidCharacter";

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
  api_keys?: { name: string; key: string }[];
  langfuse_project_name?: string;
  langfuse_status?: "active" | "default" | "pending" | "disabled" | string;
  alert_limit?: { daily?: number; monthly?: number };
};

/* --------- Helpers for Langfuse index prefix/suffix handling --------- */

const normalizeSegment = (value?: string | null) =>
  (value ?? "").replace(/\s+/g, "");

const getLangfusePrefix = (
  orgName?: string | null,
  projectName?: string | null
) => {
  const orgSegment = normalizeSegment(orgName);
  const projectSegment = normalizeSegment(projectName);
  return [orgSegment, projectSegment].filter(Boolean).join("-");
};

const splitLangfuseIndex = (fullIndex: string, prefix: string) => {
  if (!fullIndex) return { suffix: "" };
  if (prefix && fullIndex.startsWith(`${prefix}-`)) {
    return { suffix: fullIndex.slice(prefix.length + 1) };
  }
  return { suffix: fullIndex };
};

// ---- message normalizer: ALWAYS pass strings to React/Notistack
function toUserMsg(input: unknown, fallback = "Something went wrong") {
  if (input == null) return fallback;
  if (typeof input === "string") return input;

  if (typeof input === "object") {
    const anyObj = input as any;
    // common shapes
    if (typeof anyObj.message === "string") return anyObj.message;
    if (typeof anyObj.error === "string") return anyObj.error;
    if (typeof anyObj.payload?.message === "string")
      return anyObj.payload.message;
    // try to show a compact JSON
    try {
      return JSON.stringify(anyObj);
    } catch {
      return fallback;
    }
  }
  return String(input);
}

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

  const [apiKeys, setApiKeys] = useState<{ name: string; key: string }[]>([]);
  const [langfuseStatus, setLangfuseStatus] = useState<
    "active" | "default" | "pending" | "disabled" | undefined
  >(undefined);

  // Once a Langfuse index exists, lock the prefix from the stored index
  const [langfuseFixedPrefix, setLangfuseFixedPrefix] = useState<string | null>(
    null
  );

  // Revoke dialog
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [pendingRevokeKey, setPendingRevokeKey] = useState<{
    name: string;
    key: string;
  } | null>(null);

  // Create-key (name input) modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [createErr, setCreateErr] = useState<string>("");

  const orgName = useSelector(
    (state: RootState) =>
      state.orgProject.selectedOrganizationProject?.organizationName
  );

  // One-time reveal modal
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

  const T = {
    sections: {
      details: "Edit basic properties of your project.",
      limits:
        "Hard caps to prevent unexpected spend; leave blank to keep unlimited.",
      creds:
        "API keys authenticate your requests. You can only view a key once at creation.",
    },
    fields: {
      name: "Human-friendly name used across the dashboard.",
      status:
        "Inactive projects are hidden from selection and cannot make API calls.",
      description: "Optional notes for teammates and future you.",
      logIndex:
        "Optional identifier to correlate logs/metrics (e.g., Langfuse project).",
      daily: "Maximum spend or request budget allowed per day.",
      monthly: "Maximum spend or request budget allowed per month.",
    },
    actions: {
      refresh: "Reload the latest project details and keys.",
      genKey: "Create a new API key. You’ll see the secret only once.",
      revoke: "Immediately disable this key. This cannot be undone.",
    },
  };

  // ---------- Utilities ----------
  const maskKey = (raw: string) => {
    if (!raw) return "";
    if (raw.length <= 8) return raw;
    const start = raw.slice(0, 4);
    const end = raw.slice(-4);
    return `${start}••••••••••••••••${end}`;
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        enqueueSnackbar("API key copied", { variant: "success" });
        return;
      } catch (err) {
        console.warn("Clipboard API failed, fallback to legacy:", err);
      }
    }
    // Fallback method: create temporary textarea
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
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

  // ---------- Load ----------
  const fetchDetails = async () => {
    if (!projectId) {
      setName("");
      setDescription("");
      setStatus("active");
      setDaily("");
      setMonthly("");
      setLangfuseProjectName("");
      setLangfuseStatus(undefined);
      setLangfuseFixedPrefix(null);
      setApiKeys([]);
      return;
    }

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

        // ----- Langfuse index handling -----
        const fullIndex = proj.langfuse_project_name ?? "";
        setLangfuseProjectName(fullIndex);

        if (fullIndex) {
          // Derive prefix from stored full index:
          // everything before the last "-" is treated as prefix
          const lastDash = fullIndex.lastIndexOf("-");
          const prefixFromServer =
            lastDash > 0 ? fullIndex.slice(0, lastDash) : fullIndex;
          setLangfuseFixedPrefix(prefixFromServer || null);
        } else {
          // No existing index → allow prefix to follow current org + project name
          setLangfuseFixedPrefix(null);
        }

        setLangfuseStatus(
          (proj.langfuse_status as
            | "active"
            | "default"
            | "pending"
            | "disabled"
            | undefined) ?? undefined
        );
        setApiKeys(Array.isArray(proj.api_keys) ? proj.api_keys : []);
      } else {
        setName(selectedProject?.name || "");
        setDescription("");
        setStatus("active");
        setDaily("");
        setMonthly("");
        setLangfuseProjectName("");
        setLangfuseStatus(undefined);
        setLangfuseFixedPrefix(null);
        setApiKeys([]);
      }
    } catch (err: any) {
      console.error("getProjectDetails failed", err);
      enqueueSnackbar(
        toUserMsg(err?.response?.data ?? err, "Failed to load project details"),
        { variant: "error" }
      );
      setName(selectedProject?.name || "");
      setDescription("");
      setStatus("active");
      setDaily("");
      setMonthly("");
      setLangfuseProjectName("");
      setLangfuseStatus(undefined);
      setLangfuseFixedPrefix(null);
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const getLangfuseStatusMeta = (
    status: ProjectDetails["langfuse_status"]
  ): {
    label: string;
    color: "success" | "info" | "warning" | "default";
    description: string;
  } => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          color: "success",
          description:
            "Traces are routed to the selected log index for this project.",
        };
      case "default":
        return {
          label: "Default index",
          color: "info",
          description:
            "Traces are going to the default log index (not the custom project index).",
        };
      case "pending":
        return {
          label: "Pending",
          color: "warning",
          description:
            "Configuration is pending. Until it’s approved, traces will be going to the default index.",
        };
      default:
        return {
          label: "Default",
          color: "default",
          description:
            "Traces are going to the default log index. No custom index is set up for this project.",
        };
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
      setLangfuseStatus(undefined);
      setLangfuseFixedPrefix(null);
      setApiKeys([]);
      return;
    }
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ---------- Derived Langfuse prefix / suffix / preview ----------
  const langfusePrefix = useMemo(
    () =>
      // If we already have an index from backend, keep using that prefix
      langfuseFixedPrefix ??
      // Otherwise, derive from current org + project name
      getLangfusePrefix(orgName, name || selectedProject?.name),
    [langfuseFixedPrefix, orgName, name, selectedProject]
  );

  const { suffix: langfuseSuffix } = useMemo(
    () => splitLangfuseIndex(langfuseProjectName, langfusePrefix || ""),
    [langfuseProjectName, langfusePrefix]
  );

  const langfusePreview = useMemo(() => {
    if (langfusePrefix && langfuseSuffix) {
      return `${langfusePrefix}-${langfuseSuffix}`;
    }
    if (langfusePrefix) return `${langfusePrefix}-<suffix>`;
    if (langfuseSuffix) return langfuseSuffix;
    return "orgName-projectName-<your-suffix>";
  }, [langfusePrefix, langfuseSuffix]);

  // ---------- Save handlers ----------
  const handleSaveAll = async () => {
    if (!projectId) return;
    if (!name.trim()) {
      enqueueSnackbar("Project name cannot be empty", { variant: "warning" });
      return;
    }

    if (name.trim().length < 2) {
      enqueueSnackbar("Project name should be atleast of 2 characters", {
        variant: "warning",
      });
      return;
    }
    if (name.trim().length > 45) {
      enqueueSnackbar("Project name should atmost be of 45 characters", {
        variant: "warning",
      });
      return;
    }
    if (!hasValidCharacter(name.trim())) {
      enqueueSnackbar(
        "Project name should not contain special characters except (-) and (_) and atleast 1 alphabet.",
        { variant: "warning" }
      );
      return;
    }

    // Validate Langfuse suffix (user input part)
    const trimmedSuffix = langfuseSuffix.trim();
    if (trimmedSuffix) {
      if (trimmedSuffix.length < 2) {
        enqueueSnackbar(
          "Langfuse log index suffix should be atleast of 2 characters",
          {
            variant: "warning",
          }
        );
        return;
      }

      if (trimmedSuffix.length > 45) {
        enqueueSnackbar(
          "Langfuse log index suffix should atmost be of 45 characters",
          {
            variant: "warning",
          }
        );
        return;
      }

      if (!hasValidCharacter(trimmedSuffix)) {
        enqueueSnackbar(
          "Langfuse log index suffix contain special characters except (-) and (_) and atleast 1 alphabet.",
          { variant: "warning" }
        );
        return;
      }
    }

    // Build final index with prefix + suffix
    // If there is an existing prefix (locked or dynamic), use it.
    // If no suffix is provided, send empty string (to clear).
    const finalLangfuseIndex =
      trimmedSuffix && langfusePrefix
        ? `${langfusePrefix}-${trimmedSuffix}`
        : trimmedSuffix || "";

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
        langfuse_project_name: finalLangfuseIndex || undefined,
      };

      const res = await (projectService as any).updatePoject?.(payload);
      if (res?.success) {
        enqueueSnackbar("Project updated", { variant: "success" });
        window.dispatchEvent(new Event("fetch_org_project"));
        fetchDetails();
      } else {
        enqueueSnackbar(
          toUserMsg(res?.error?.payload?.message, "Failed to update project"),
          {
            variant: "error",
          }
        );
      }
    } catch (err: any) {
      enqueueSnackbar(
        toUserMsg(err?.response?.data ?? err, "Failed to update project"),
        { variant: "error" }
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------- Create key: open modal ----------
  const openCreateKeyModal = () => {
    setNewKeyName("");
    setCreateErr("");
    setCreateOpen(true);
  };

  // ---------- Create key: submit with name ----------
  const submitCreateKey = async () => {
    if (!projectId) return;
    const trimmed = newKeyName.trim();
    if (!trimmed) {
      setCreateErr("Please enter a key name.");
      return;
    }
    if (trimmed.length > 45) {
      setCreateErr("Key name must be < 45 characters.");
      return;
    }

    if (trimmed.length < 2) {
      setCreateErr("Key name must be atleast 2 characters.");
      return;
    }

    setCreatingKey(true);
    setCreateErr("");
    try {
      type CreateKeyResponse = {
        success: boolean;
        status_code?: number;
        data?: {
          api_key?: { name?: string; key?: string };
          project?: { id?: string; name?: string };
        };
        message?: string;
        error?: unknown;
      };

      const res: any = (await (projectService as any).addNewApiKey?.(
        projectId,
        {
          name: trimmed,
        }
      )) as CreateKeyResponse;

      console.log("create key response:", res);

      if (res?.success) {
        const plain = res?.data?.api_key?.key ?? "";

        if (plain) {
          setPlainNewKey(plain);
          setShowKeyModal(true);
        } else {
          enqueueSnackbar(
            "API key created, but the secret was not returned by the server.",
            { variant: "info" }
          );
        }

        setCreateOpen(false);
        await fetchDetails();
        enqueueSnackbar("API key created", { variant: "success" });
      } else {
        setCreateErr(
          toUserMsg(
            res?.error?.payload?.message ?? {
              message: "Failed to create API key",
            }
          )
        );
      }
    } catch (err: any) {
      setCreateErr(
        toUserMsg(err?.response?.data ?? err, "Failed to create API key")
      );
    } finally {
      setCreatingKey(false);
    }
  };

  // ---------- Revoke ----------
  const confirmRevoke = (apiKeyObj: { name: string; key: string }) => {
    setPendingRevokeKey(apiKeyObj);
    setRevokeOpen(true);
  };

  const handleRevoke = async () => {
    if (!pendingRevokeKey) return;
    try {
      const res = await (projectService as any).deleteApiKey?.(
        projectId,
        pendingRevokeKey.name
      );
      if (res?.success) {
        enqueueSnackbar("API key revoked", { variant: "success" });
        setApiKeys((prev) =>
          prev.filter((k) => k.name !== pendingRevokeKey.name)
        );
      } else {
        enqueueSnackbar(
          toUserMsg(
            res?.error?.payload?.message ?? {
              message: "Failed to revoke API key",
            }
          ),
          {
            variant: "error",
          }
        );
      }
    } catch (err) {
      enqueueSnackbar("Failed to revoke API key", { variant: "error" });
    } finally {
      setRevokeOpen(false);
      setPendingRevokeKey(null);
    }
  };

  const userRole = useSelector((state: RootState) => state.user.userRole);
  const userPermission = useSelector(
    (state: RootState) => state.user.userPermission
  );

  const isEdittingAllowed = useMemo(() => {
    if (userRole === "admin" || userRole === "owner") return true;
    if (userRole === "member" && userPermission === "write") return true;
    return false;
  }, [userRole, userPermission]);

  // ---------- Render ----------
  if (!projectId) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">Select a project to edit settings.</Alert>
      </Box>
    );
  }

  const TitleWithInfo = ({
    children,
    info,
  }: {
    children: React.ReactNode;
    info: string;
  }) => (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {children}
      </Typography>
      <Tooltip title={info}>
        <InfoOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
      </Tooltip>
    </Stack>
  );

  return (
    <Box sx={{ mt: 2 }}>
      {/* Header */}
      <Box sx={headerGradient}>
        <Typography variant="h5" fontWeight={700}>
          Project Settings
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={T.actions.refresh}>
          <IconButton onClick={fetchDetails} size="small">
            <RefreshRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {isEdittingAllowed && (
          <Button
            variant="contained"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={handleSaveAll}
            disabled={saving || loading}
            sx={{ ml: 1 }}
          >
            Save changes
          </Button>
        )}
      </Box>

      {/* Two-column layout */}
      <Grid container spacing={2} alignItems="stretch">
        {/* LEFT: Details + Limits */}
        <Grid item xs={12} md={6}>
          <Stack spacing={2} sx={{ height: "100%" }}>
            {/* Project details */}
            <Paper variant="outlined" sx={gradientCard}>
              <TitleWithInfo info={T.sections.details}>
                Project details
              </TitleWithInfo>

              {loading ? (
                <Stack spacing={1.2}>
                  <Skeleton height={40} />
                  <Skeleton height={40} />
                  <Skeleton height={90} />
                  <Skeleton height={40} />
                </Stack>
              ) : (
                <Stack spacing={1.5} mt={2}>
                  <TextField
                    label="Project name"
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title={T.fields.name}>
                            <InfoOutlinedIcon
                              fontSize="small"
                              sx={{ color: "text.secondary", cursor: "help" }}
                            />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    disabled={!isEdittingAllowed}
                  />

                  {/* Description */}
                  <TextField
                    label="Description"
                    size="small"
                    multiline
                    minRows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment
                          position="end"
                          sx={{ alignSelf: "flex-start" }}
                        >
                          <Tooltip title={T.fields.description}>
                            <InfoOutlinedIcon
                              fontSize="small"
                              sx={{
                                color: "text.secondary",
                                cursor: "help",
                                mt: 0.5,
                              }}
                            />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    disabled={!isEdittingAllowed}
                  />

                  {/* Langfuse index with prefix */}
                  <TextField
                    label="Langfuse Log Index suffix"
                    size="small"
                    value={langfuseSuffix}
                    disabled={
                      !["default", "pending"].includes(langfuseStatus || "") &&
                      !isEdittingAllowed
                    }
                    onChange={(e) => {
                      const nextSuffix = e.target.value;
                      const nextFull = langfusePrefix
                        ? langfusePrefix +
                          (nextSuffix ? `-${nextSuffix}` : "-")
                        : nextSuffix;
                      setLangfuseProjectName(nextFull);
                    }}
                    placeholder="e.g. prod, staging"
                    InputProps={{
                      startAdornment: langfusePrefix ? (
                        <InputAdornment position="start">
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              color: "text.secondary",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {langfusePrefix}-
                          </Typography>
                        </InputAdornment>
                      ) : undefined,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title={T.fields.logIndex}>
                            <InfoOutlinedIcon
                              fontSize="small"
                              sx={{ color: "text.secondary", cursor: "help" }}
                            />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Preview of full index */}
                  {["default", "pending"].includes(langfuseStatus || "") && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: -0.5 }}
                    >
                      Will be created as:{" "}
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {langfusePreview}
                      </Typography>
                    </Typography>
                  )}

                  {langfuseStatus && (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mt: 0.5 }}
                    >
                      {(() => {
                        const meta = getLangfuseStatusMeta(langfuseStatus);
                        return (
                          <>
                            <Chip
                              size="small"
                              color={meta.color}
                              label={`Langfuse: ${meta.label}`}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ lineHeight: 1.4 }}
                            >
                              {meta.description}
                            </Typography>
                          </>
                        );
                      })()}
                    </Stack>
                  )}
                </Stack>
              )}
            </Paper>

            {/* Usage & cost limits */}
            <Paper variant="outlined" sx={gradientCard}>
              <TitleWithInfo info={T.sections.limits}>
                Usage & cost limits
              </TitleWithInfo>

              {loading ? (
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                  <Skeleton height={40} />
                  <Skeleton height={40} />
                </Stack>
              ) : (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ mt: 2 }}
                >
                  <TextField
                    label="Daily budget"
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={daily}
                    onChange={(e) => setDaily(e.target.value)}
                    fullWidth
                    disabled={!isEdittingAllowed}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title={T.fields.daily}>
                            <InfoOutlinedIcon
                              fontSize="small"
                              sx={{ color: "text.secondary", cursor: "help" }}
                            />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Monthly budget"
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={monthly}
                    onChange={(e) => setMonthly(e.target.value)}
                    fullWidth
                    disabled={!isEdittingAllowed}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title={T.fields.monthly}>
                            <InfoOutlinedIcon
                              fontSize="small"
                              sx={{ color: "text.secondary", cursor: "help" }}
                            />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              )}
            </Paper>
          </Stack>
        </Grid>

        {/* RIGHT: API credentials */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ ...gradientCard, height: "100%" }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  API credentials
                </Typography>
                <Tooltip title={T.sections.creds}>
                  <InfoOutlinedIcon
                    fontSize="small"
                    sx={{ color: "text.secondary" }}
                  />
                </Tooltip>
              </Stack>

              {isEdittingAllowed && (
                <Tooltip title={T.actions.genKey}>
                  <span>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddRoundedIcon />}
                      onClick={openCreateKeyModal}
                      disabled={loading}
                    >
                      Generate API Key
                    </Button>
                  </span>
                </Tooltip>
              )}
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
                    apiKeys.map((item) => (
                      <ListItem
                        key={item.name}
                        secondaryAction={
                          isEdittingAllowed && (
                            <Tooltip title="Revoke key">
                              <IconButton
                                edge="end"
                                onClick={() => confirmRevoke(item)}
                                size="small"
                                color="error"
                              >
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                        sx={{
                          borderBottom: "1px solid",
                          borderColor: "rgba(255,255,255,0.2)",
                          alignItems: "flex-start",
                          py: 1,
                        }}
                      >
                        <ListItemText
                          primary={item.name}
                          secondaryTypographyProps={{
                            fontFamily: "monospace",
                            fontSize: 13,
                          }}
                          secondary={maskKey(item.key)}
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
        </Grid>
      </Grid>

      {/* Revoke dialog */}
      <Dialog open={revokeOpen} onClose={() => setRevokeOpen(false)}>
        <DialogTitle>Revoke API key?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            This will immediately disable the selected key. You can’t undo this
            action.
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
              <b style={{ fontFamily: "inherit" }}>{pendingRevokeKey.name}</b>
              <br />
              {maskKey(pendingRevokeKey.key)}
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

      {/* Create-key dialog (enter a name) */}
      <Dialog
        open={createOpen}
        onClose={() => (!creatingKey ? setCreateOpen(false) : null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Name your API key</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Choose a descriptive name (e.g., “Backend-service”, “CI Pipeline”,
            “QA-Laptop”).
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Key name"
            size="small"
            value={newKeyName}
            onChange={(e) => {
              setNewKeyName(e.target.value);
              setCreateErr("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitCreateKey();
              }
            }}
            inputProps={{ maxLength: 64 }}
            error={Boolean(createErr)}
            helperText={
              createErr || "You’ll see the secret only once after creation."
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={creatingKey}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitCreateKey}
            disabled={creatingKey}
          >
            {creatingKey ? "Creating…" : "Create key"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* One-time key reveal modal */}
      <Dialog
        open={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>New API key created</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1 }}>
            Copy and keep it safe — it{" "}
            <b>cannot be accessed after this screen</b>.
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
