import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LanIcon from "@mui/icons-material/Lan";
import { KBStatusData } from "src/api/services/kb.service";
import { BuilderConfig, ToolingConfig } from "../types";

function PaperInput({
  label,
  file,
  onSelect,
  accept,
}: {
  label: string;
  file: File | null;
  onSelect: (file: File | null) => void;
  accept?: string;
}) {
  return (
    <Stack spacing={1}>
      <input
        type="file"
        id="kb-upload"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => onSelect(e.target.files?.[0] || null)}
      />
      <label htmlFor="kb-upload">
        <Button variant="outlined" startIcon={<UploadFileIcon />} component="span">
          {label}
        </Button>
      </label>
      {file && (
        <Typography variant="body2" color="text.secondary">
          Selected: {file.name}
        </Typography>
      )}
    </Stack>
  );
}

export default function ToolsStep({
  config,
  onChange,
  kbStatus,
  kbLoading,
  existingKbCollection,
  onSelectKb,
  onUploadKb,
  onCheckKb,
  onCheckMcp,
  mcpChecking,
}: {
  config: BuilderConfig;
  onChange: (updater: (prev: BuilderConfig) => BuilderConfig) => void;
  kbStatus: KBStatusData | null;
  kbLoading: boolean;
  existingKbCollection: string;
  onSelectKb: (selection: ToolingConfig["kb"]["selection"]) => void;
  onUploadKb: () => void;
  onCheckKb: () => void;
  onCheckMcp: () => void;
  mcpChecking: boolean;
}) {
  const theme = useTheme();

  const kbStatusLabel = kbStatus?.status || "unknown";
  const kbChipColor =
    config.tools.kb.status === "ready"
      ? "success"
      : config.tools.kb.status === "failed"
      ? "error"
      : "default";
  const hasExistingKb = Boolean(existingKbCollection);
  const kbSelection = hasExistingKb ? "existing" : "new";
  const showKbStatusCheck =
    config.tools.kb.status !== "idle" &&
    config.tools.kb.status !== "ready" &&
    kbStatus?.status !== "completed";
  const kbIsProcessing = config.tools.kb.status === "processing";
  const canUploadKb =
    (config.tools.kb.status === "idle" || config.tools.kb.status === "failed") &&
    Boolean(config.tools.kb.file);

  const handleDownloadSampleCsv = () => {
    const sample = `text,label
"What is Shiprocket?","Shiprocket is a logistics and fulfillment platform."
"How to contact support?","You can reach us at support@example.com."
`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kb_sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.5}>
        <Typography variant="h6">Data Connections</Typography>
        <Typography variant="body2" color="text.secondary">
          Connect your custom data sources.
        </Typography>
      </Stack>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 2,
              height: "100%",
              border: `1px solid ${alpha(theme.palette.common.white, 0.6)}`,
              boxShadow: `0 0 0 1px ${alpha(theme.palette.common.white, 0.25)}`,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <UploadFileIcon color="primary" />
                <Typography variant="h6">Knowledge Base</Typography>
                {config.tools.kb.status !== "idle" && (
                  <Chip
                    label={config.tools.kb.status}
                    color={kbChipColor}
                    size="small"
                  />
                )}
              </Stack>

              {kbSelection === "existing" && (
                <Stack spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: alpha(theme.palette.info.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2">
                        Status: {kbStatusLabel}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Collection: {existingKbCollection || "Pending"}
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      onClick={onCheckKb}
                      disabled={kbLoading}
                    >
                      Refresh status
                    </Button>
                    {kbLoading && <CircularProgress size={20} />}
                  </Stack>
                  {kbIsProcessing && (
                    <Alert severity="info">
                      Knowledge base is processing. You can continue when the upload is complete.
                    </Alert>
                  )}
                </Stack>
              )}

              {kbSelection === "new" && (
                <Stack spacing={2}>
                  <PaperInput
                    label="Upload CSV"
                    file={config.tools.kb.file}
                    accept=".csv,text/csv"
                    onSelect={(file) =>
                      onChange((prev) => ({
                        ...prev,
                        tools: {
                          ...prev.tools,
                          kb: { ...prev.tools.kb, file },
                        },
                      }))
                    }
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Chunking size"
                        type="number"
                        value={config.tools.kb.chunkingSize}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            tools: {
                              ...prev.tools,
                              kb: {
                                ...prev.tools.kb,
                                chunkingSize: Number(e.target.value),
                              },
                            },
                          }))
                        }
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Overlapping size"
                        type="number"
                        value={config.tools.kb.overlappingSize}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            tools: {
                              ...prev.tools,
                              kb: {
                                ...prev.tools.kb,
                                overlappingSize: Number(e.target.value),
                              },
                            },
                          }))
                        }
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Button
                      variant="contained"
                      onClick={onUploadKb}
                      disabled={kbLoading || !canUploadKb}
                    >
                      {kbLoading ? "Uploading..." : "Upload KB"}
                    </Button>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Link
                        component="button"
                        type="button"
                        underline="always"
                        onClick={handleDownloadSampleCsv}
                        sx={{ fontSize: 14 }}
                      >
                        Download sample CSV
                      </Link>
                      <Tooltip title="Download a sample CSV template to prepare your knowledge data.">
                        <InfoOutlinedIcon fontSize="small" color="action" />
                      </Tooltip>
                    </Stack>
                    {showKbStatusCheck && (
                      <Button
                        variant="outlined"
                        onClick={onCheckKb}
                        disabled={kbLoading}
                      >
                        Check status
                      </Button>
                    )}
                    {kbLoading && <CircularProgress size={20} />}
                  </Stack>
                  {kbIsProcessing && (
                    <Alert severity="info">
                      Knowledge base is processing. You can continue when the upload is complete.
                    </Alert>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 2,
              height: "100%",
              border: `1px solid ${alpha(theme.palette.common.white, 0.6)}`,
              boxShadow: `0 0 0 1px ${alpha(theme.palette.common.white, 0.25)}`,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LanIcon color="info" />
                <Typography variant="h6">MCP Tools</Typography>
                {config.tools.mcp.status !== "idle" && (
                  <Chip
                    size="small"
                    label={config.tools.mcp.status}
                    color={
                      config.tools.mcp.status === "valid" ? "success" : "default"
                    }
                  />
                )}
              </Stack>

              <TextField
                label="MCP URL"
                placeholder="https://shiprocket-mcp.shiprocket.in/mcp"
                value={config.tools.mcp.url}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    tools: {
                      ...prev.tools,
                      mcp: {
                        ...prev.tools.mcp,
                        url: e.target.value,
                        status: "idle",
                      },
                    },
                  }))
                }
                fullWidth
              />

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="contained"
                  onClick={onCheckMcp}
                  disabled={mcpChecking}
                >
                  {mcpChecking ? "Checking..." : "Check MCP"}
                </Button>
                {mcpChecking && <CircularProgress size={20} />}
              </Stack>

              <Typography variant="body2" color="text.secondary">
                We validate the MCP URL before moving to the next step.
              </Typography>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
