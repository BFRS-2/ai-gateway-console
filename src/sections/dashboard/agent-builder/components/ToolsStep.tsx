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
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
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
      <label htmlFor="kb-upload" style={{ width: "100%", display: "block" }}>
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          component="span"
          fullWidth
        >
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
  mcpSaved,
  onDirty,
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
  mcpSaved: boolean;
  onDirty: () => void;
}) {
  const theme = useTheme();

  const kbStatusLabel = kbStatus?.status || "unknown";
  const kbFileName = kbStatus?.file_name || config.tools.kb.file?.name || "";
  const kbCollectionName =
    existingKbCollection || config.tools.kb.collectionName || "";
  const showKbSummary = Boolean(kbFileName || kbCollectionName);
  const kbChipColor =
    config.tools.kb.status === "ready"
      ? "success"
      : config.tools.kb.status === "failed"
      ? "error"
      : config.tools.kb.status === "processing"
      ? "warning"
      : "default";
  const hasExistingKb = Boolean(existingKbCollection);
  const kbSelection = hasExistingKb ? "existing" : "new";
  const showKbStatusCheck =
    config.tools.kb.status !== "idle" &&
    config.tools.kb.status !== "ready" &&
    kbStatus?.status !== "completed";
  const showKbRefresh =
    config.tools.kb.status !== "ready" && kbStatus?.status !== "completed";
  const kbIsProcessing = config.tools.kb.status === "processing";
  const kbIsReady = config.tools.kb.status === "ready";
  const mcpIsConnected = mcpSaved;
  const canUploadKb =
    (config.tools.kb.status === "idle" || config.tools.kb.status === "failed") &&
    Boolean(config.tools.kb.file);
  const showUploadControls =
    config.tools.kb.status === "failed" ||
    (config.tools.kb.status === "idle" && !config.tools.kb.file);

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
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <UploadFileIcon color="primary" />
                  <Typography variant="h6">Knowledge Base</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {kbIsReady && (
                    <CheckCircleRoundedIcon fontSize="medium" color="success" />
                  )}
                </Stack>
              </Stack>

              {showKbSummary && (
                <Box
                  sx={{
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                    bgcolor: alpha(theme.palette.background.default, 0.6),
                  }}
                >
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ color: "text.secondary", width: 140 }}>
                          File
                        </TableCell>
                        <TableCell>{kbFileName || "—"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: "text.secondary" }}>
                          Status
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={config.tools.kb.status || "idle"}
                            color={kbChipColor}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: "text.secondary" }}>
                          Collection
                        </TableCell>
                        <TableCell>{kbCollectionName || "—"}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              )}

              {kbSelection === "existing" && (
                <Stack spacing={2}>
                  {showKbRefresh && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        variant="outlined"
                        onClick={onCheckKb}
                        disabled={kbLoading}
                      >
                        Refresh status
                      </Button>
                      {config.tools.kb.status !== "idle" && (
                        <Chip
                          label={config.tools.kb.status}
                          color={kbChipColor}
                          size="small"
                        />
                      )}
                      {kbLoading && <CircularProgress size={20} />}
                    </Stack>
                  )}
                  {kbIsProcessing && (
                    <Alert severity="info">
                      Knowledge base is processing. You can continue when the upload is complete.
                    </Alert>
                  )}
                </Stack>
              )}

              {kbSelection === "new" && (
                <Stack spacing={2}>
                  {showUploadControls && (
                    <PaperInput
                      label="Upload CSV"
                      file={config.tools.kb.file}
                      accept=".csv,text/csv"
                      onSelect={(file) =>
                        {
                          onDirty();
                          onChange((prev) => ({
                            ...prev,
                            tools: {
                              ...prev.tools,
                              kb: { ...prev.tools.kb, file },
                            },
                          }));
                        }
                      }
                    />
                  )}

                  {showUploadControls && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label={
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <span>Chunking size</span>
                              <Tooltip title="Number of characters per chunk when splitting your document. Smaller chunks improve recall but increase total chunks.">
                                <InfoOutlinedIcon fontSize="small" color="action" />
                              </Tooltip>
                            </Stack>
                          }
                          type="number"
                          value={config.tools.kb.chunkingSize}
                          onChange={(e) =>
                            {
                              onDirty();
                              onChange((prev) => ({
                                ...prev,
                                tools: {
                                  ...prev.tools,
                                  kb: {
                                    ...prev.tools.kb,
                                    chunkingSize: Number(e.target.value),
                                  },
                                },
                              }));
                            }
                          }
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label={
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <span>Overlapping size</span>
                              <Tooltip title="Number of characters shared between consecutive chunks to preserve context across boundaries.">
                                <InfoOutlinedIcon fontSize="small" color="action" />
                              </Tooltip>
                            </Stack>
                          }
                          type="number"
                          value={config.tools.kb.overlappingSize}
                          onChange={(e) =>
                            {
                              onDirty();
                              onChange((prev) => ({
                                ...prev,
                                tools: {
                                  ...prev.tools,
                                  kb: {
                                    ...prev.tools.kb,
                                    overlappingSize: Number(e.target.value),
                                  },
                                },
                              }));
                            }
                          }
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  )}

                  {showUploadControls && (
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
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            variant="outlined"
                            onClick={onCheckKb}
                            disabled={kbLoading}
                          >
                            Refresh status
                          </Button>
                          {config.tools.kb.status !== "idle" && (
                            <Chip
                              label={config.tools.kb.status}
                              color={kbChipColor}
                              size="small"
                            />
                          )}
                        </Stack>
                      )}
                      {kbLoading && <CircularProgress size={20} />}
                    </Stack>
                  )}
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
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <LanIcon color="info" />
                  <Typography variant="h6">MCP Tools</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {config.tools.mcp.status !== "idle" && (
                    <Chip
                      size="small"
                      label={
                        config.tools.mcp.status === "valid"
                          ? "Validated"
                          : config.tools.mcp.status
                      }
                      color={
                        config.tools.mcp.status === "valid"
                          ? "success"
                          : "default"
                      }
                    />
                  )}
                  {mcpIsConnected && (
                    <CheckCircleRoundedIcon fontSize="medium" color="success" />
                  )}
                </Stack>
              </Stack>

              <TextField
                label="MCP URL"
                placeholder="https://shiprocket-mcp.shiprocket.in/mcp"
                value={config.tools.mcp.url}
                onChange={(e) =>
                  {
                    onDirty();
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
                    }));
                  }
                }
                fullWidth
              />

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="contained"
                  onClick={onCheckMcp}
                  disabled={mcpChecking}
                >
                  {mcpChecking ? "Checking..." : "Verify MCP"}
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
