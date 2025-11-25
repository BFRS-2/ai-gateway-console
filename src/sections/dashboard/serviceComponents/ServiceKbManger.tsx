// components/services/ServiceKbManager.tsx
"use client";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import kbService, { KBStatusData } from "src/api/services/kb.service";
import { InfoOutlined, Refresh, RefreshRounded } from "@mui/icons-material";

type ServiceKbManagerProps = {
  projectId?: string;
  disabled?: boolean;
};

export function ServiceKbManager({
  projectId,
  disabled,
}: ServiceKbManagerProps) {
  const { enqueueSnackbar } = useSnackbar();

  // Dialog + form state
  const [kbDialogOpen, setKbDialogOpen] = useState(false);
  const [chunkingSize, setChunkingSize] = useState<string>("1000");
  const [overlappingSize, setOverlappingSize] = useState<string>("200");
  const [kbUrl, setKbUrl] = useState<string>("");
  const [kbFile, setKbFile] = useState<File | null>(null);
  const [kbSubmitting, setKbSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status state
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusData, setStatusData] = useState<KBStatusData | null>(null);

  const resetForm = () => {
    setChunkingSize("1000");
    setOverlappingSize("200");
    setKbUrl("");
    setKbFile(null);
    setKbSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenKbDialog = () => {
    if (!projectId) {
      enqueueSnackbar("Please select a project before managing KB.", {
        variant: "warning",
      });
      return;
    }
    setKbDialogOpen(true);
  };

  const handleCloseKbDialog = () => {
    if (kbSubmitting) return;
    setKbDialogOpen(false);
    resetForm(); // ⬅️ reset on close/cancel
  };

  const handleDownloadSampleCsv = () => {
    const sample = `text,label
"What is Shiprocket?","Shiprocket is a logistics and fulfillment platform."
"How to contact support?","You can reach us at support@example.com."
`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kb_sample.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validateCsvHasTextColumn = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const blob = file.slice(0, 4096);
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        const firstLine = text.split(/\r?\n/)[0] || "";
        const headers = firstLine
          .split(",")
          .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
        const hasText = headers.includes("text");
        resolve(hasText);
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(blob);
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setKbFile(null);
      return;
    }

    const isCsv =
      file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      enqueueSnackbar("Only CSV files are allowed for knowledge base.", {
        variant: "error",
      });
      event.target.value = "";
      setKbFile(null);
      return;
    }

    const hasTextColumn = await validateCsvHasTextColumn(file);
    if (!hasTextColumn) {
      enqueueSnackbar(
        'CSV must contain at least one column with header "text".',
        { variant: "error" }
      );
      event.target.value = "";
      setKbFile(null);
      return;
    }

    setKbFile(file);
    enqueueSnackbar("File validated and ready to upload.", {
      variant: "success",
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const validateKbForm = (): boolean => {
    const chunk = Number(chunkingSize);
    const overlap = Number(overlappingSize);

    if (!chunk || chunk <= 0 || !Number.isFinite(chunk)) {
      enqueueSnackbar("Chunking size must be a positive number.", {
        variant: "error",
      });
      return false;
    }

    if (overlap < 0 || !Number.isFinite(overlap)) {
      enqueueSnackbar("Overlapping size cannot be negative.", {
        variant: "error",
      });
      return false;
    }

    if (overlap >= chunk) {
      enqueueSnackbar("Overlapping size must be less than chunking size.", {
        variant: "error",
      });
      return false;
    }

    if (!kbFile && !kbUrl.trim()) {
      enqueueSnackbar("Either a CSV file or a URL is required.", {
        variant: "error",
      });
      return false;
    }

    if (kbUrl && !/^https?:\/\//i.test(kbUrl.trim())) {
      enqueueSnackbar("URL must start with http:// or https://", {
        variant: "error",
      });
      return false;
    }

    if (kbUrl.trim() && !/\.csv(?:[?#].*$|$)/i.test(kbUrl.trim())) {
      enqueueSnackbar("URL must point to a .csv file (must end with .csv)", {
        variant: "error",
      });
      return false;
    }

    if (!projectId) {
      enqueueSnackbar("No project selected.", { variant: "error" });
      return false;
    }

    return true;
  };

  const loadStatus = async () => {
    if (!projectId) {
      setStatusData(null);
      return;
    }

    try {
      setStatusLoading(true);
      const res = await kbService.getKbStatus(projectId);
      if (res.success) {
        setStatusData(res.data ?? null);
      } else {
        setStatusData(null);
      }
    } catch (err) {
      console.error("Failed to fetch KB status:", err);
      setStatusData(null);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    // fetch status when projectId changes
    if (projectId) {
      loadStatus();
    } else {
      setStatusData(null);
    }
  }, [projectId]);

  const handleSubmitKb = async () => {
    if (!validateKbForm()) return;

    if (kbFile && kbUrl.trim()) {
      enqueueSnackbar("Please provide either a CSV file or a URL, not both.", {
        variant: "error",
      });
      return;
    }

    try {
      setKbSubmitting(true);

      const form = new FormData();
      if (kbFile) {
        form.append("file", kbFile);
      }
      if (kbUrl.trim()) {
        form.append("url", kbUrl.trim());
      }
      form.append("project_id", projectId as string);
      form.append("chunking_size", String(Number(chunkingSize)));
      form.append("overlapping_size", String(Number(overlappingSize)));

      const res = await kbService.initKnowledgebase(form);

      if (res?.success) {
        enqueueSnackbar(res?.data?.message || "Knowledge base file uploaded.", {
          variant: "success",
        });
        // Refresh status after upload
        await loadStatus();
        setKbDialogOpen(false);
        resetForm();
      } else {
        enqueueSnackbar(
          (res?.error as any)?.payload?.message ||
            "Error uploading knowledge base.",
          { variant: "error" }
        );
      }
    } catch (err) {
      console.error("Error uploading knowledge base:", err);
      enqueueSnackbar("Error uploading knowledge base.", {
        variant: "error",
      });
    } finally {
      setKbSubmitting(false);
    }
  };

  const chipColor = useMemo<"default" | "success" | "error" | "warning">(() => {
    const status = statusData?.status?.toLowerCase();
    if (!status) return "default";
    if (status === "completed" || status === "success") return "success";
    if (status === "failed" || status === "error") return "error";
    if (status === "pending" || status === "processing") return "warning";
    return "default";
  }, [statusData?.status]);

  const chipLabel = statusLoading
    ? "Checking…"
    : statusData?.status
    ? statusData.status
    : "No KB";
  const tooltipContent = statusData ? (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="body2">
        <strong>File:</strong> {statusData.file_name}
      </Typography>
      <Typography variant="body2">
        <strong>KB Status:</strong> {statusData.status}
      </Typography>
      <Typography variant="body2">
        <strong>Chunking:</strong> {statusData.chunking_size} /{" "}
        {statusData.overlapping_size}
      </Typography>
      {statusData.csv_rows_processed != null && (
        <Typography variant="body2">
          <strong>Rows:</strong> {statusData.csv_rows_processed}
        </Typography>
      )}
      {statusData.chunks_created != null && (
        <Typography variant="body2">
          <strong>Chunks:</strong> {statusData.chunks_created}
        </Typography>
      )}
      {statusData.error && (
        <Typography
          variant="caption"
          color="error"
          display="block"
          sx={{ mt: 0.5 }}
        >
          <strong>Error:</strong> {statusData.error}
        </Typography>
      )}

      {/* Legend for states */}
      {/* <Box sx={{ mt: 1 }}>
        <Typography variant="caption" display="block">
          <strong>No KB</strong>: No knowledge base uploaded yet.
        </Typography>
        <Typography variant="caption" display="block">
          <strong>pending / processing</strong>: Ingestion &amp; chunking in
          progress.
        </Typography>
        <Typography variant="caption" display="block">
          <strong>completed</strong>: KB is ready and used for answering
          queries.
        </Typography>
        <Typography variant="caption" display="block">
          <strong>failed</strong>: Ingestion failed; check error and re-upload.
        </Typography>
      </Box> */}
    </Box>
  ) : (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" display="block">
        No knowledge base has been uploaded yet. Knowledge base is required
        to use this service.
      </Typography>
    </Box>
  );

  const uploadKbInfo = (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" display="block">
        Upload a CSV file or provide a CSV URL to create/update this project’s
        knowledge base.
      </Typography>
      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
        When the KB is processing or completed, uploading a new one is disabled
        to avoid inconsistent states.
      </Typography>
    </Box>
  );
  return (
    <>
      {/* Button + status chip (right side) */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap" // 👈 lets it wrap nicely on small widths
      >
        {["failed", null, ""].includes(statusData?.status || "") ? (
          <Tooltip title={uploadKbInfo}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={handleOpenKbDialog}
              >
                Upload KB
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Tooltip title={uploadKbInfo}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={handleOpenKbDialog}
                disabled
              >
                Upload KB
              </Button>
            </span>
          </Tooltip>
        )}

        {projectId && (
          <>
            <Tooltip title={tooltipContent}>
              <Chip
                size="small"
                label={chipLabel}
                color={chipColor}
                variant={statusData ? "filled" : "outlined"}
              />
            </Tooltip>

            {!["completed", "failed"].includes(statusData?.status || "") && (
              <IconButton onClick={() => loadStatus()}>
                <RefreshRounded />
              </IconButton>
            )}
          </>
        )}
      </Stack>

      {/* Dialog */}
      <Dialog
        open={kbDialogOpen}
        onClose={handleCloseKbDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Manage Knowledge Base</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Chunking Size"
                type="number"
                value={chunkingSize}
                onChange={(e) => setChunkingSize(e.target.value)}
                inputProps={{ min: 1 }}
                fullWidth
              />
              <Tooltip title="Max characters in each chunk. Recommended: 800–1500.">
                <InfoOutlined fontSize="small" color="action" />
              </Tooltip>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Overlapping Size"
                type="number"
                value={overlappingSize}
                onChange={(e) => setOverlappingSize(e.target.value)}
                inputProps={{ min: 0 }}
                fullWidth
              />
              <Tooltip title="How many characters overlap between chunks to retain context. Recommended: 100–250.">
                <InfoOutlined fontSize="small" color="action" />
              </Tooltip>
            </Stack>

            {/* File upload */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  CSV File
                </Typography>
                <Tooltip title='Must be .csv and contain a "text" column. You may also include optional label columns.'>
                  <InfoOutlined fontSize="small" color="action" />
                </Tooltip>
              </Stack>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={handleFileChange}
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  onClick={triggerFileInput}
                >
                  {kbFile ? "Change file" : "Upload CSV"}
                </Button>
                {kbFile && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {kbFile.name}
                  </Typography>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Only CSV allowed. Must contain a column with header{" "}
                <code>"text"</code>.
              </Typography>
            </Box>

            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              OR
            </Typography>

            {/* URL field */}
            <TextField
              label="URL (optional)"
              placeholder="https://example.com/docs.csv"
              value={kbUrl}
              onChange={(e) => setKbUrl(e.target.value)}
              fullWidth
            />
            <Typography variant="caption" color="text.secondary">
              Either a CSV file or a URL is required (but not both).
            </Typography>

            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  onClick={handleDownloadSampleCsv}
                  variant="outlined"
                  color="primary"
                >
                  Download sample CSV
                </Button>

                <Tooltip title="Download a sample CSV template to prepare your knowledge data.">
                  <InfoOutlined fontSize="small" color="action" />
                </Tooltip>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseKbDialog} disabled={kbSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitKb}
            disabled={kbSubmitting}
            variant="contained"
          >
            {kbSubmitting ? "Uploading…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
