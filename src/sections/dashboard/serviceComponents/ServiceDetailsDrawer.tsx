import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Divider,
  Chip,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export type ServiceKind = 'ocr' | 'summarization' | 'embeddings' | 'voice' | 'chatbot';

export type ModelOption = {
  id: string;
  displayName: string;
  provider: string;
  tier?: string;
  notes?: any;
};

export type ServiceEndpoint = {
  title: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
};

export type ServiceDocs = {
  description?: string;
  usageNotes?: string[];
  endpoints?: ServiceEndpoint[];
  codeSamples?: {
    node?: string;
    python?: string;
    curl?: string;
  };
};

export type Service = {
  id: string;
  name: string;
  kind: ServiceKind;
  status: 'active' | 'paused';
  currentModelId?: string;
  models?: ModelOption[];
  docs?: ServiceDocs;
  useCases?: string[];
};

function CodeBlock({ title, code }: { title: string; code?: string }) {
  if (!code) return null;
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
  };
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Tooltip title="Copy">
          <IconButton size="small" onClick={onCopy}>
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1,
          overflowX: 'auto',        // <-- only the code block scrolls
          overflowY: 'hidden',
          bgcolor: 'background.default',
          borderRadius: 1,
          fontSize: 13,
          lineHeight: 1.5,
          maxWidth: '100%',
        }}
      >
        <code>{code}</code>
      </Box>
    </Paper>
  );
}

function JsonPreview({ value }: { value: unknown }) {
  if (value == null) return null;
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1,
        overflowX: 'auto',
        overflowY: 'hidden',
        bgcolor: 'background.default',
        borderRadius: 1,
        fontSize: 13,
        lineHeight: 1.5,
        maxWidth: '100%',
      }}
    >
      <code>{JSON.stringify(value, null, 2)}</code>
    </Box>
  );
}

export default function ServiceDetailsDialog({
  open,
  onClose,
  service,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  service: Service | null;
  onUpdate?: (partial: Partial<Service>) => void;
}) {
  const serviceId = useMemo(() => service?.id ?? '__none__', [service?.id]);

  const [tab, setTab] = useState(0);
  const [enabled, setEnabled] = useState<boolean>(service?.status === 'active');

  const models = (service?.models ?? []) as ModelOption[];
  const [modelId, setModelId] = useState<string>(service?.currentModelId ?? models?.[0]?.id ?? '');
  const selectedModel = useMemo(() => models.find((m) => m.id === modelId), [models, modelId]);

  useEffect(() => {
    setTab(0);
    setEnabled(service?.status === 'active');
    setModelId(service?.currentModelId ?? models?.[0]?.id ?? '');
  }, [serviceId]); // re-init when a different service opens

  const toggleEnabled = (v: boolean) => {
    setEnabled(v);
    onUpdate?.({ status: v ? 'active' : 'paused' });
  };

  const changeModel = (nextId: string) => {
    setModelId(nextId);
    onUpdate?.({ currentModelId: nextId });
  };

  const statusChipColor =
    service?.status === 'active' ? 'success' : service?.status === 'paused' ? 'default' : 'default';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md" // md gives ~900px; change to "lg" if you want more room
      PaperProps={{
        sx: {
          m: 0,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ pr: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Typography variant="h6" component="span">{service?.name ?? 'Service'}</Typography>
          <Chip size="small" label={service?.kind ?? ''} variant="outlined" />
          <Chip size="small" label={service?.status ?? ''} color={statusChipColor as any} variant="outlined" />
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          // ensure the dialog content never causes horizontal scroll
          overflowX: 'hidden',
          '& *': { minWidth: 0 }, // prevent flex children from expanding
        }}
      >
        {!service ? (
          <Typography variant="body2" color="text.secondary">Select a service to view details.</Typography>
        ) : (
          <Stack spacing={2}>
            {/* Controls grid (wraps neatly, no overflow) */}
            <Grid container spacing={2} columns={{ xs: 6, sm: 12 }}>
              <Grid item xs={6} sm="auto">
                <FormControlLabel
                  control={<Switch checked={enabled} onChange={(_, v) => toggleEnabled(v)} />}
                  label={enabled ? 'Enabled' : 'Disabled'}
                />
              </Grid>
              <Grid item xs={6} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Model"
                  size="small"
                  value={modelId}
                  onChange={(e) => changeModel(e.target.value as string)}
                >
                  {models.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.displayName} {m.tier ? `• ${m.tier}` : ''} ({m.provider})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm="auto" display="flex" alignItems="center">
                <Chip size="small" label={selectedModel?.displayName ?? '—'} />
              </Grid>
              {service.useCases?.length ? (
                <Grid item xs={6} sm="auto" display="flex" alignItems="center">
                  <Chip size="small" label={`${service.useCases.length} use cases`} />
                </Grid>
              ) : null}
            </Grid>

            <Divider />

            {/* Tabs */}
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Overview" />
              <Tab label="Docs" />
              <Tab label="Samples" />
              <Tab label="SDKs" />
              <Tab label="cURL" />
            </Tabs>

            {/* Panels */}
            <Box sx={{ pt: 2 }}>
              {tab === 0 && (
                <Stack spacing={2}>
                  <Typography variant="subtitle1">What it does</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.docs?.description ?? 'No description provided.'}
                  </Typography>

                  {service.useCases?.length ? (
                    <>
                      <Typography variant="subtitle1">Common Use Cases</Typography>
                      <Stack spacing={0.5}>
                        {service.useCases.map((u) => (
                          <Typography key={u} variant="body2">• {u}</Typography>
                        ))}
                      </Stack>
                    </>
                  ) : null}

                  {service.docs?.endpoints?.length ? (
                    <>
                      <Typography variant="subtitle1">Endpoints</Typography>
                      <Stack spacing={1}>
                        {service.docs.endpoints.map((e, idx) => (
                          <Paper key={idx} variant="outlined" sx={{ p: 1.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                              <Chip size="small" label={e.method} color="info" />
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                {e.path}
                              </Typography>
                              <Typography variant="body2" sx={{ ml: { xs: 0, sm: 'auto' } }}>
                                {e.title}
                              </Typography>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </>
                  ) : null}
                </Stack>
              )}

              {tab === 1 && (
                <Stack spacing={2}>
                  <Typography variant="subtitle1">Usage Notes</Typography>
                  {service.docs?.usageNotes?.length ? (
                    <Stack spacing={0.5}>
                      {service.docs.usageNotes.map((n, i) => (
                        <Typography key={i} variant="body2">• {n}</Typography>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No notes available.</Typography>
                  )}

                  {selectedModel?.notes && (
                    <>
                      <Typography variant="subtitle1" sx={{ mt: 1 }}>Model Notes</Typography>
                      <JsonPreview value={selectedModel.notes} />
                    </>
                  )}
                </Stack>
              )}

              {tab === 2 && (
                <Stack spacing={2}>
                  <CodeBlock title="Node.js" code={service.docs?.codeSamples?.node} />
                  <CodeBlock title="Python" code={service.docs?.codeSamples?.python} />
                </Stack>
              )}

              {tab === 3 && (
                <Stack spacing={1}>
                  <Typography variant="body2">• JavaScript/TypeScript SDK — <code>@shiprocket/dockyard-sdk</code></Typography>
                  <Typography variant="body2">• Python SDK — <code>dockyard</code></Typography>
                  <Typography variant="caption" color="text.secondary">
                    Install via npm/pip and set <code>DOCKYARD_API_KEY</code>.
                  </Typography>
                </Stack>
              )}

              {tab === 4 && (
                <Stack spacing={2}>
                  <CodeBlock title="cURL" code={service.docs?.codeSamples?.curl} />
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
