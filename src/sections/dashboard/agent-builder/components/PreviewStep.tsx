import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import type { AgentKey } from "src/api/services/agentBuilder.service";
import { useSnackbar } from "notistack";
import { WidgetConfig } from "../types";
import {
  buildIntegrationSnippet,
} from "../widgetConfig";
import WidgetPreview from "./WidgetPreview";

type PreviewStepProps = {
  config: WidgetConfig;
  onChange: Dispatch<SetStateAction<WidgetConfig>>;
  agentId: string;
  /** Full key, known only right after generation. */
  agentKey?: string;
  agentKeys?: AgentKey[];
  agentKeyBusy?: boolean;
  onGenerateAgentKey?: (name: string) => void | Promise<void>;
  onDeleteAgentKey?: (name: string) => void | Promise<void>;
  /** Re-reads the key list from the API; the panel keeps no local copy. */
  onRefreshAgentKeys?: () => void | Promise<void>;
};

export default function PreviewStep({
  config,
  onChange,
  agentId,
  agentKey = "",
  agentKeys = [],
  agentKeyBusy = false,
  onGenerateAgentKey,
  onDeleteAgentKey,
  onRefreshAgentKeys,
}: PreviewStepProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [newKeyName, setNewKeyName] = useState("default");
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [keyPendingDelete, setKeyPendingDelete] = useState<string | null>(null);
  // A revealed key can also arrive from agent creation, so the dialog shows
  // its reveal stage only when the value changes while the dialog is open.
  const [keyBeforeGenerate, setKeyBeforeGenerate] = useState("");
  // The gateway allows at most two keys per agent and refuses to delete the
  // last one. Both are server-enforced; these are conveniences, not the gate.
  const AGENT_KEY_MAX = 2;
  const atKeyLimit = agentKeys.length >= AGENT_KEY_MAX;
  const isLastKey = agentKeys.length <= 1;
  const hasAgentKey = agentKeys.length > 0;
  const widgetAgentId = agentId;
  const widgetConfig = useMemo(() => {
    const nextConfig = config as any;
    return {
      ...nextConfig,
      widget: {
        ...(nextConfig?.widget || {}),
        enabled: nextConfig?.widget?.enabled ?? true,
      },
    };
  }, [config]);
  const widgetLayouts = widgetConfig?.widget?.layouts || {};
  const integrationSnippet = buildIntegrationSnippet(widgetAgentId, agentKey);

  const showGeneratedKey =
    keyDialogOpen && Boolean(agentKey) && agentKey !== keyBeforeGenerate;

  const handleOpenKeyDialog = () => {
    setKeyBeforeGenerate(agentKey);
    setNewKeyName(
      agentKeys.some((item) => item.name === "default") ? "" : "default"
    );
    setKeyDialogOpen(true);
  };

  const handleCloseKeyDialog = () => {
    setKeyDialogOpen(false);
    // The new key is never inserted locally - the list comes back from the
    // API once the dialog is done with it.
    if (showGeneratedKey) onRefreshAgentKeys?.();
  };

  const handleConfirmDeleteKey = async () => {
    if (!keyPendingDelete) return;
    // Awaited so the dialog stays up until the gateway has answered - the
    // parent re-reads the list before this resolves.
    await onDeleteAgentKey?.(keyPendingDelete);
    setKeyPendingDelete(null);
  };

  const handleGenerateKey = () => {
    const name = newKeyName.trim();
    if (!name) return;
    setKeyBeforeGenerate(agentKey);
    onGenerateAgentKey?.(name);
  };

  const handleCopySnippet = async (snippet: string, label: string) => {
    try {
      await navigator.clipboard.writeText(snippet);
      enqueueSnackbar(`${label} copied`, { variant: "success" });
    } catch (error) {
      enqueueSnackbar(`Unable to copy ${label}`, { variant: "error" });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).ShiprocketAgentWidgetConfig = widgetConfig;
  }, [widgetConfig]);

  const setLayout = (layout: "bubble" | "drawer" | "fullscreen") => {
    onChange((prev) => {
      const next = prev as any;
      return {
        ...next,
        widget: {
          ...next.widget,
          type: layout,
          layouts: {
            ...next.widget.layouts,
            bubble: {
              ...next.widget.layouts.bubble,
              enabled: layout === "bubble",
            },
            drawer: {
              ...next.widget.layouts.drawer,
              enabled: layout === "drawer",
            },
            fullscreen: {
              ...next.widget.layouts.fullscreen,
              enabled: layout === "fullscreen",
            },
          },
        },
      };
    });
  };

  const updateThemeVariant = (updater: (variant: any) => any) => {
    onChange((prev) => {
      const next = prev as any;
      const currentTheme = next.widget.theme || {};
      const light = currentTheme.light || {};
      const dark = currentTheme.dark || {};
      return {
        ...next,
        widget: {
          ...next.widget,
          theme: {
            ...currentTheme,
            light: updater(light),
            dark: updater(dark),
          },
        },
      };
    });
  };

  const updateThemeColor = (key: string, value: string) => {
    updateThemeVariant((variant) => ({
      ...variant,
      colors: { ...(variant.colors || {}), [key]: value },
    }));
  };

  const suggestionsValue =
    widgetConfig?.widget?.messages?.suggestions?.join(", ") || "";
  const supportedLocalesValue =
    widgetConfig?.widget?.i18n?.supportedLocales?.join(", ") || "";
  const gradientStopsValue =
    widgetConfig?.widget?.theme?.dark?.gradient?.stops?.join(", ") || "";
  const themeColors = widgetConfig?.widget?.theme?.dark?.colors || {};
  const themeGradient = widgetConfig?.widget?.theme?.dark?.gradient || {};
  const themeTypography = widgetConfig?.widget?.theme?.dark?.typography || {};
  const themeShape = widgetConfig?.widget?.theme?.dark?.shape || {};
  const themeEffects = widgetConfig?.widget?.theme?.dark?.effects || {};
  const themeDensity = widgetConfig?.widget?.theme?.dark?.density || "normal";
  const i18nDefaultLocale = widgetConfig?.widget?.i18n?.defaultLocale || "en";
  const i18nStrings =
    widgetConfig?.widget?.i18n?.strings?.[i18nDefaultLocale] || {};
  const supportedLocalesList =
    widgetConfig?.widget?.i18n?.supportedLocales?.length > 0
      ? widgetConfig.widget.i18n.supportedLocales
      : ["en"];

  return (
    <Grid container spacing={2} alignItems="stretch">
      <Grid item xs={12} md={5}>
        {Boolean(agentId) && (
          <Card sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <VpnKeyRoundedIcon color="primary" />
                </Box>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  sx={{ flex: 1, minWidth: 0 }}
                >
                  <Typography variant="subtitle1">Connect your site</Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    color={hasAgentKey ? "success" : "warning"}
                    label={hasAgentKey ? "Key active" : "Key required"}
                  />
                </Stack>
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="subtitle2">Agent keys</Typography>
                {agentKeys.length > 0 ? (
                  <Stack divider={<Divider flexItem />}>
                    {agentKeys.map((item) => (
                      <Stack
                        key={item.name}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ py: 1 }}
                      >
                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {item.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontFamily: "monospace" }}
                            noWrap
                          >
                            {item.key || "••••••••"}
                            {item.created_at
                              ? ` · created ${new Date(
                                  item.created_at
                                ).toLocaleDateString()}`
                              : ""}
                          </Typography>
                        </Stack>
                        <Tooltip
                          title={
                            isLastKey
                              ? "An agent must keep at least one key"
                              : "Delete key"
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={agentKeyBusy || isLastKey}
                              onClick={() => setKeyPendingDelete(item.name)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No keys yet. Generate one to activate the embed code.
                  </Typography>
                )}
                {isLastKey && hasAgentKey && (
                  <Typography variant="caption" color="text.secondary">
                    An agent must keep at least one key, so this one cannot be
                    deleted. Generate a second key first, then delete it.
                  </Typography>
                )}

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Tooltip
                    title={
                      atKeyLimit
                        ? `Limit of ${AGENT_KEY_MAX} keys reached — delete one first`
                        : ""
                    }
                  >
                    <span>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        disabled={agentKeyBusy || atKeyLimit}
                        onClick={handleOpenKeyDialog}
                      >
                        Generate new key
                      </Button>
                    </span>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CodeRoundedIcon />}
                    onClick={() => setEmbedDialogOpen(true)}
                  >
                    Get embed code
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        )}
        <Dialog
          open={Boolean(keyPendingDelete)}
          onClose={agentKeyBusy ? undefined : () => setKeyPendingDelete(null)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Delete this key?</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Any page still embedding{" "}
                <Box component="code" sx={{ fontFamily: "monospace" }}>
                  {keyPendingDelete}
                </Box>{" "}
                stops working as soon as this key is deleted, and the key
                cannot be restored.
              </Typography>
              <Alert severity="warning" sx={{ py: 0.5 }}>
                Update the embed code on your site with another key first.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              color="inherit"
              disabled={agentKeyBusy}
              onClick={() => setKeyPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              disabled={agentKeyBusy}
              onClick={handleConfirmDeleteKey}
            >
              {agentKeyBusy ? "Deleting…" : "Delete key"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={embedDialogOpen}
          onClose={() => setEmbedDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Embed code</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <TextField
                value={integrationSnippet}
                multiline
                minRows={10}
                fullWidth
                InputProps={{
                  readOnly: true,
                  sx: { fontFamily: "monospace" },
                }}
              />
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.divider, 0.06),
                }}
              >
                <Stack spacing={0.75}>
                  <Typography variant="caption" fontWeight={600}>
                    Replace before you ship
                  </Typography>
                  {[
                    {
                      token: "YOUR_AGENT_KEY",
                      text: "the key you generated",
                    },
                    {
                      token: "USER_ID",
                      text: "your visitor’s own id, which scopes their chat history",
                    },
                    {
                      token: "YOUR_AUTH_TOKEN",
                      text: "optional, forwarded to your tools; drop it if unused",
                    },
                  ].map((item) => (
                    <Typography
                      key={item.token}
                      variant="caption"
                      color="text.secondary"
                    >
                      <Box
                        component="code"
                        sx={{ fontFamily: "monospace", color: "text.primary" }}
                      >
                        {item.token}
                      </Box>
                      {` — ${item.text}`}
                    </Typography>
                  ))}
                </Stack>
              </Box>
              {agentKey ? (
                <Typography variant="caption" color="success.main">
                  This snippet already carries the key you just generated -
                  copy it as it is.
                </Typography>
              ) : agentKeys.length > 0 ? (
                <Typography variant="caption" color="text.secondary">
                  Stored keys are masked, so yours cannot be filled in here.
                  Paste the one you saved, or generate a new key if it is
                  lost.
                </Typography>
              ) : (
                <Typography variant="caption" color="warning.main">
                  Generate a key first — the placeholder will not
                  authenticate.
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Note: For the widget’s full-screen mode, use a separate page
                URL for the implementation.
              </Typography>

            <Accordion
              disableGutters
              elevation={0}
              sx={{
                bgcolor: "transparent",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 0, minHeight: 0 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <InfoOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2">
                    How the key is used
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <Stack
                  spacing={1}
                  component="ul"
                  sx={{ pl: 2.5, my: 0, color: "text.secondary" }}
                >
                  <Typography variant="caption" component="li">
                    It goes in the snippet’s{" "}
                    <Box component="code" sx={{ fontFamily: "monospace" }}>
                      agent-key
                    </Box>{" "}
                    attribute. The widget then sends it as the{" "}
                    <Box component="code" sx={{ fontFamily: "monospace" }}>
                      x-agent-key
                    </Box>{" "}
                    header on its config, chat and history calls.
                  </Typography>
                  <Typography variant="caption" component="li">
                    It sits in your page’s HTML, so visitors can read it.
                    Treat it as an identifier for this agent, not as a server
                    secret, and rotate it if it is abused.
                  </Typography>
                  <Typography variant="caption" component="li">
                    Two slots let you rotate without downtime: generate the
                    second key, update the snippet on your site, then delete
                    the old key.
                  </Typography>
                  <Typography variant="caption" component="li">
                    Keys are stored masked. The full value is shown once,
                    immediately after you generate it.
                  </Typography>
                </Stack>
              </AccordionDetails>
            </Accordion>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button color="inherit" onClick={() => setEmbedDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<ContentCopyIcon />}
              onClick={() =>
                handleCopySnippet(integrationSnippet, "Integration code")
              }
            >
              Copy code
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={keyDialogOpen}
          onClose={agentKeyBusy ? undefined : handleCloseKeyDialog}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>
            {showGeneratedKey ? "Your new agent key" : "Generate agent key"}
          </DialogTitle>
          <DialogContent>
            {showGeneratedKey ? (
              <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                <Alert severity="warning" sx={{ py: 0.5 }}>
                  Copy this key now. It is shown only once and cannot be
                  retrieved again.
                </Alert>
                <TextField
                  value={agentKey}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: "monospace" },
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopySnippet(agentKey, "Agent key")}
                >
                  Copy key
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Next, use “Get embed code” to drop it into your page.
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={2} sx={{ pt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Name the key so you can tell your keys apart later. The full
                  value is shown once, on the next screen.
                </Typography>
                <TextField
                  label="Key name"
                  value={newKeyName}
                  onChange={(event) => setNewKeyName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleGenerateKey();
                    }
                  }}
                  size="small"
                  fullWidth
                  autoFocus
                  disabled={agentKeyBusy}
                  helperText="A label for you, e.g. website or staging"
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            {showGeneratedKey ? (
              <Button variant="contained" onClick={handleCloseKeyDialog}>
                Done
              </Button>
            ) : (
              <>
                <Button
                  color="inherit"
                  disabled={agentKeyBusy}
                  onClick={handleCloseKeyDialog}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={agentKeyBusy || !newKeyName.trim() || atKeyLimit}
                  onClick={handleGenerateKey}
                >
                  {agentKeyBusy ? "Generating…" : "Generate"}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
        <Card sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Configuration</Typography>
            <Typography variant="body2" color="text.secondary">
              Customize agent behavior, settings, and preferences.
            </Typography>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Important settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Layout</Typography>
                    <FormControl fullWidth>
                      <InputLabel id="layout-type-label">
                        Layout type
                      </InputLabel>
                      <Select
                        labelId="layout-type-label"
                        label="Layout type"
                        value={widgetConfig?.widget?.type || "bubble"}
                        onChange={(e) =>
                          setLayout(
                            e.target.value as "bubble" | "drawer" | "fullscreen"
                          )
                        }
                      >
                        <MenuItem value="bubble">Bubble</MenuItem>
                        <MenuItem value="drawer">Drawer</MenuItem>
                        <MenuItem value="fullscreen">Fullscreen</MenuItem>
                      </Select>
                    </FormControl>
                    {widgetConfig?.widget?.type === "bubble" && (
                      <Stack spacing={1.5}>
                        <FormControl fullWidth>
                          <InputLabel id="bubble-position-label">
                            Bubble position
                          </InputLabel>
                          <Select
                            labelId="bubble-position-label"
                            label="Bubble position"
                            value={
                              widgetLayouts?.bubble?.position || "bottom-right"
                            }
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      bubble: {
                                        ...next.widget.layouts.bubble,
                                        position: e.target.value,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          >
                            <MenuItem value="bottom-right">
                              Bottom right
                            </MenuItem>
                            <MenuItem value="bottom-left">Bottom left</MenuItem>
                          </Select>
                        </FormControl>
                        <Stack direction="row" spacing={2}>
                          <TextField
                            label="Offset X"
                            type="number"
                            value={widgetLayouts?.bubble?.offset?.x ?? 20}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      bubble: {
                                        ...next.widget.layouts.bubble,
                                        offset: {
                                          ...next.widget.layouts.bubble.offset,
                                          x: Number(e.target.value),
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                          <TextField
                            label="Offset Y"
                            type="number"
                            value={widgetLayouts?.bubble?.offset?.y ?? 20}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      bubble: {
                                        ...next.widget.layouts.bubble,
                                        offset: {
                                          ...next.widget.layouts.bubble.offset,
                                          y: Number(e.target.value),
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                        </Stack>
                      </Stack>
                    )}
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Theme</Typography>
                    <FormControl fullWidth>
                      <InputLabel id="theme-mode-label">Theme mode</InputLabel>
                      <Select
                        labelId="theme-mode-label"
                        label="Theme mode"
                        value={widgetConfig?.widget?.theme?.mode || "dark"}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                theme: {
                                  ...next.widget.theme,
                                  mode: e.target.value,
                                },
                              },
                            };
                          })
                        }
                      >
                        <MenuItem value="auto">Auto</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="light">Light</MenuItem>
                      </Select>
                    </FormControl>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Primary color"
                        value={themeColors.primary || ""}
                        onChange={(e) =>
                          updateThemeColor("primary", e.target.value)
                        }
                        type="color"
                        InputLabelProps={{ shrink: true }}
                        sx={{ maxWidth: 180 }}
                        fullWidth
                      />
                      <TextField
                        label="Accent color"
                        value={themeColors.accent || ""}
                        onChange={(e) =>
                          updateThemeColor("accent", e.target.value)
                        }
                        type="color"
                        InputLabelProps={{ shrink: true }}
                        sx={{ maxWidth: 180 }}
                        fullWidth
                      />
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Header</Typography>
                    <TextField
                      label="Title"
                      value={widgetConfig?.widget?.header?.title || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              header: {
                                ...next.widget.header,
                                title: e.target.value,
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <TextField
                      label="Subtitle"
                      value={widgetConfig?.widget?.header?.subtitle || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              header: {
                                ...next.widget.header,
                                subtitle: e.target.value,
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Messages</Typography>
                    <TextField
                      label="Welcome message"
                      value={widgetConfig?.widget?.messages?.welcome || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              messages: {
                                ...next.widget.messages,
                                welcome: e.target.value,
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <TextField
                      label="Placeholder"
                      value={widgetConfig?.widget?.messages?.placeholder || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              messages: {
                                ...next.widget.messages,
                                placeholder: e.target.value,
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <TextField
                      label="Suggestions"
                      helperText="Comma-separated suggestions."
                      value={suggestionsValue}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              messages: {
                                ...next.widget.messages,
                                suggestions: e.target.value
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Message input</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.composer?.enterToSend
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  composer: {
                                    ...next.widget.composer,
                                    enterToSend: e.target.checked,
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Enter to send"
                    />
                    <TextField
                      label="Max chars"
                      type="number"
                      value={widgetConfig?.widget?.composer?.maxChars || 0}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              composer: {
                                ...next.widget.composer,
                                maxChars: Number(e.target.value),
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Behavior</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.behavior?.defaultOpen
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  behavior: {
                                    ...next.widget.behavior,
                                    defaultOpen: e.target.checked,
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Open by default"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.behavior?.autoOpen?.enabled
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  behavior: {
                                    ...next.widget.behavior,
                                    autoOpen: {
                                      ...next.widget.behavior.autoOpen,
                                      enabled: e.target.checked,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Auto open"
                    />
                    <TextField
                      label="Auto open delay (ms)"
                      type="number"
                      value={
                        widgetConfig?.widget?.behavior?.autoOpen?.delayMs || 0
                      }
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              behavior: {
                                ...next.widget.behavior,
                                autoOpen: {
                                  ...next.widget.behavior.autoOpen,
                                  delayMs: Number(e.target.value),
                                },
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Advanced settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Layout details</Typography>
                    {widgetConfig?.widget?.type === "bubble" && (
                      <Stack spacing={2}>
                        <Stack spacing={1}>
                          <Typography variant="subtitle2">Launcher</Typography>
                          <FormControl fullWidth>
                            <InputLabel id="launcher-variant-label">
                              Variant
                            </InputLabel>
                            <Select
                              labelId="launcher-variant-label"
                              label="Variant"
                              value={
                                widgetLayouts?.bubble?.launcher?.variant ||
                                "bubble"
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          launcher: {
                                            ...next.widget.layouts.bubble
                                              .launcher,
                                            variant: e.target.value,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            >
                              <MenuItem value="bubble">Bubble</MenuItem>
                              <MenuItem value="button">Button</MenuItem>
                            </Select>
                          </FormControl>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={Boolean(
                                  widgetLayouts?.bubble?.launcher?.showLabel
                                )}
                                onChange={(e) =>
                                  onChange((prev) => {
                                    const next = prev as any;
                                    return {
                                      ...next,
                                      widget: {
                                        ...next.widget,
                                        layouts: {
                                          ...next.widget.layouts,
                                          bubble: {
                                            ...next.widget.layouts.bubble,
                                            launcher: {
                                              ...next.widget.layouts.bubble
                                                .launcher,
                                              showLabel: e.target.checked,
                                            },
                                          },
                                        },
                                      },
                                    };
                                  })
                                }
                              />
                            }
                            label="Show label"
                          />
                          <TextField
                            label="Label"
                            value={widgetLayouts?.bubble?.launcher?.label || ""}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      bubble: {
                                        ...next.widget.layouts.bubble,
                                        launcher: {
                                          ...next.widget.layouts.bubble
                                            .launcher,
                                          label: e.target.value,
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Icon"
                              value={
                                widgetLayouts?.bubble?.launcher?.icon || ""
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          launcher: {
                                            ...next.widget.layouts.bubble
                                              .launcher,
                                            icon: e.target.value,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                            <FormControl fullWidth>
                              <InputLabel id="launcher-size-label">
                                Size
                              </InputLabel>
                              <Select
                                labelId="launcher-size-label"
                                label="Size"
                                value={
                                  widgetLayouts?.bubble?.launcher?.size || "md"
                                }
                                onChange={(e) =>
                                  onChange((prev) => {
                                    const next = prev as any;
                                    return {
                                      ...next,
                                      widget: {
                                        ...next.widget,
                                        layouts: {
                                          ...next.widget.layouts,
                                          bubble: {
                                            ...next.widget.layouts.bubble,
                                            launcher: {
                                              ...next.widget.layouts.bubble
                                                .launcher,
                                              size: e.target.value,
                                            },
                                          },
                                        },
                                      },
                                    };
                                  })
                                }
                              >
                                <MenuItem value="sm">Small</MenuItem>
                                <MenuItem value="md">Medium</MenuItem>
                                <MenuItem value="lg">Large</MenuItem>
                              </Select>
                            </FormControl>
                          </Stack>
                        </Stack>

                        <Stack spacing={1}>
                          <Typography variant="subtitle2">Panel</Typography>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Panel width"
                              type="number"
                              value={widgetLayouts?.bubble?.panel?.width || 0}
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            width: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                            <TextField
                              label="Panel height"
                              type="number"
                              value={widgetLayouts?.bubble?.panel?.height || 0}
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            height: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                          </Stack>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Min width"
                              type="number"
                              value={
                                widgetLayouts?.bubble?.panel?.minWidth || 0
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            minWidth: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                            <TextField
                              label="Min height"
                              type="number"
                              value={
                                widgetLayouts?.bubble?.panel?.minHeight || 0
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            minHeight: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                          </Stack>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Max width"
                              type="number"
                              value={
                                widgetLayouts?.bubble?.panel?.maxWidth || 0
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            maxWidth: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                            <TextField
                              label="Max height"
                              type="number"
                              value={
                                widgetLayouts?.bubble?.panel?.maxHeight || 0
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            maxHeight: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                          </Stack>
                          <FormControl fullWidth>
                            <InputLabel id="mobile-behavior-label">
                              Mobile behavior
                            </InputLabel>
                            <Select
                              labelId="mobile-behavior-label"
                              label="Mobile behavior"
                              value={
                                widgetLayouts?.bubble?.panel?.mobileBehavior ||
                                "fullscreen"
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            mobileBehavior: e.target.value,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            >
                              <MenuItem value="fullscreen">Fullscreen</MenuItem>
                              <MenuItem value="inline">Inline</MenuItem>
                            </Select>
                          </FormControl>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={Boolean(
                                  widgetLayouts?.bubble?.panel?.backdrop
                                    ?.enabled
                                )}
                                onChange={(e) =>
                                  onChange((prev) => {
                                    const next = prev as any;
                                    return {
                                      ...next,
                                      widget: {
                                        ...next.widget,
                                        layouts: {
                                          ...next.widget.layouts,
                                          bubble: {
                                            ...next.widget.layouts.bubble,
                                            panel: {
                                              ...next.widget.layouts.bubble
                                                .panel,
                                              backdrop: {
                                                ...next.widget.layouts.bubble
                                                  .panel.backdrop,
                                                enabled: e.target.checked,
                                              },
                                            },
                                          },
                                        },
                                      },
                                    };
                                  })
                                }
                              />
                            }
                            label="Backdrop"
                          />
                          {widgetLayouts?.bubble?.panel?.backdrop?.enabled && (
                            <TextField
                              label="Backdrop blur"
                              type="number"
                              value={
                                widgetLayouts?.bubble?.panel?.backdrop?.blur ??
                                0
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        bubble: {
                                          ...next.widget.layouts.bubble,
                                          panel: {
                                            ...next.widget.layouts.bubble.panel,
                                            backdrop: {
                                              ...next.widget.layouts.bubble
                                                .panel.backdrop,
                                              blur: Number(e.target.value),
                                            },
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                          )}
                        </Stack>
                      </Stack>
                    )}
                    {widgetConfig?.widget?.type === "drawer" && (
                      <Stack spacing={1.5}>
                        <FormControl fullWidth>
                          <InputLabel id="drawer-side-label">Side</InputLabel>
                          <Select
                            labelId="drawer-side-label"
                            label="Side"
                            value={widgetLayouts?.drawer?.side || "right"}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      drawer: {
                                        ...next.widget.layouts.drawer,
                                        side: e.target.value,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          >
                            <MenuItem value="right">Right</MenuItem>
                            <MenuItem value="left">Left</MenuItem>
                          </Select>
                        </FormControl>
                        <Stack direction="row" spacing={2}>
                          <TextField
                            label="Width"
                            type="number"
                            value={widgetLayouts?.drawer?.width || 0}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      drawer: {
                                        ...next.widget.layouts.drawer,
                                        width: Number(e.target.value),
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                          <TextField
                            label="Max width"
                            type="number"
                            value={widgetLayouts?.drawer?.maxWidth || 0}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      drawer: {
                                        ...next.widget.layouts.drawer,
                                        maxWidth: Number(e.target.value),
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                        </Stack>
                        <TextField
                          label="Mobile width"
                          value={widgetLayouts?.drawer?.mobileWidth || "100%"}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  layouts: {
                                    ...next.widget.layouts,
                                    drawer: {
                                      ...next.widget.layouts.drawer,
                                      mobileWidth: e.target.value,
                                    },
                                  },
                                },
                              };
                            })
                          }
                          fullWidth
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={Boolean(
                                widgetLayouts?.drawer?.backdrop?.enabled
                              )}
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        drawer: {
                                          ...next.widget.layouts.drawer,
                                          backdrop: {
                                            ...next.widget.layouts.drawer
                                              .backdrop,
                                            enabled: e.target.checked,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            />
                          }
                          label="Backdrop"
                        />
                        {widgetLayouts?.drawer?.backdrop?.enabled && (
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Backdrop blur"
                              type="number"
                              value={widgetLayouts?.drawer?.backdrop?.blur ?? 0}
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        drawer: {
                                          ...next.widget.layouts.drawer,
                                          backdrop: {
                                            ...next.widget.layouts.drawer
                                              .backdrop,
                                            blur: Number(e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                              fullWidth
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={Boolean(
                                    widgetLayouts?.drawer?.backdrop
                                      ?.closeOnClick
                                  )}
                                  onChange={(e) =>
                                    onChange((prev) => {
                                      const next = prev as any;
                                      return {
                                        ...next,
                                        widget: {
                                          ...next.widget,
                                          layouts: {
                                            ...next.widget.layouts,
                                            drawer: {
                                              ...next.widget.layouts.drawer,
                                              backdrop: {
                                                ...next.widget.layouts.drawer
                                                  .backdrop,
                                                closeOnClick: e.target.checked,
                                              },
                                            },
                                          },
                                        },
                                      };
                                    })
                                  }
                                />
                              }
                              label="Close on click"
                            />
                          </Stack>
                        )}
                        <Stack direction="row" spacing={2}>
                          <FormControl fullWidth>
                            <InputLabel id="drawer-animation-label">
                              Animation
                            </InputLabel>
                            <Select
                              labelId="drawer-animation-label"
                              label="Animation"
                              value={
                                widgetLayouts?.drawer?.animation?.type ||
                                "slide"
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        drawer: {
                                          ...next.widget.layouts.drawer,
                                          animation: {
                                            ...next.widget.layouts.drawer
                                              .animation,
                                            type: e.target.value,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            >
                              <MenuItem value="slide">Slide</MenuItem>
                              <MenuItem value="fade">Fade</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                            label="Duration (ms)"
                            type="number"
                            value={
                              widgetLayouts?.drawer?.animation?.durationMs ?? 0
                            }
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      drawer: {
                                        ...next.widget.layouts.drawer,
                                        animation: {
                                          ...next.widget.layouts.drawer
                                            .animation,
                                          durationMs: Number(e.target.value),
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                        </Stack>
                        <TextField
                          label="Trigger button text"
                          value={widgetLayouts?.drawer?.btn_text || ""}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  layouts: {
                                    ...next.widget.layouts,
                                    drawer: {
                                      ...next.widget.layouts.drawer,
                                      btn_text: e.target.value,
                                    },
                                  },
                                },
                              };
                            })
                          }
                          fullWidth
                        />
                      </Stack>
                    )}
                    {widgetConfig?.widget?.type === "fullscreen" && (
                      <Stack spacing={1.5}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={Boolean(
                                widgetLayouts?.fullscreen?.backdrop?.enabled
                              )}
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        fullscreen: {
                                          ...next.widget.layouts.fullscreen,
                                          backdrop: {
                                            ...next.widget.layouts.fullscreen
                                              .backdrop,
                                            enabled: e.target.checked,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            />
                          }
                          label="Backdrop"
                        />
                        <Stack direction="row" spacing={2}>
                          <TextField
                            label="Backdrop blur"
                            type="number"
                            value={
                              widgetLayouts?.fullscreen?.backdrop?.blur ?? 0
                            }
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      fullscreen: {
                                        ...next.widget.layouts.fullscreen,
                                        backdrop: {
                                          ...next.widget.layouts.fullscreen
                                            .backdrop,
                                          blur: Number(e.target.value),
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={Boolean(
                                  widgetLayouts?.fullscreen?.backdrop
                                    ?.closeOnClick
                                )}
                                onChange={(e) =>
                                  onChange((prev) => {
                                    const next = prev as any;
                                    return {
                                      ...next,
                                      widget: {
                                        ...next.widget,
                                        layouts: {
                                          ...next.widget.layouts,
                                          fullscreen: {
                                            ...next.widget.layouts.fullscreen,
                                            backdrop: {
                                              ...next.widget.layouts.fullscreen
                                                .backdrop,
                                              closeOnClick: e.target.checked,
                                            },
                                          },
                                        },
                                      },
                                    };
                                  })
                                }
                              />
                            }
                            label="Close on click"
                          />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                          <FormControl fullWidth>
                            <InputLabel id="fullscreen-animation-label">
                              Animation
                            </InputLabel>
                            <Select
                              labelId="fullscreen-animation-label"
                              label="Animation"
                              value={
                                widgetLayouts?.fullscreen?.animation?.type ||
                                "fade"
                              }
                              onChange={(e) =>
                                onChange((prev) => {
                                  const next = prev as any;
                                  return {
                                    ...next,
                                    widget: {
                                      ...next.widget,
                                      layouts: {
                                        ...next.widget.layouts,
                                        fullscreen: {
                                          ...next.widget.layouts.fullscreen,
                                          animation: {
                                            ...next.widget.layouts.fullscreen
                                              .animation,
                                            type: e.target.value,
                                          },
                                        },
                                      },
                                    },
                                  };
                                })
                              }
                            >
                              <MenuItem value="fade">Fade</MenuItem>
                              <MenuItem value="slide">Slide</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                            label="Duration (ms)"
                            type="number"
                            value={
                              widgetLayouts?.fullscreen?.animation
                                ?.durationMs ?? 0
                            }
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    layouts: {
                                      ...next.widget.layouts,
                                      fullscreen: {
                                        ...next.widget.layouts.fullscreen,
                                        animation: {
                                          ...next.widget.layouts.fullscreen
                                            .animation,
                                          durationMs: Number(e.target.value),
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                            fullWidth
                          />
                        </Stack>
                      </Stack>
                    )}
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Theme details</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Updates apply to both light and dark palettes.
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="Background"
                        type="color"
                        value={themeColors.background || ""}
                        onChange={(e) =>
                          updateThemeColor("background", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Surface"
                        type="color"
                        value={themeColors.surface || ""}
                        onChange={(e) =>
                          updateThemeColor("surface", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Surface alt"
                        type="color"
                        value={themeColors.surfaceAlt || ""}
                        onChange={(e) =>
                          updateThemeColor("surfaceAlt", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Text"
                        type="color"
                        value={themeColors.text || ""}
                        onChange={(e) =>
                          updateThemeColor("text", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Muted text"
                        type="color"
                        value={themeColors.mutedText || ""}
                        onChange={(e) =>
                          updateThemeColor("mutedText", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Border"
                        type="color"
                        value={themeColors.border || ""}
                        onChange={(e) =>
                          updateThemeColor("border", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Danger"
                        type="color"
                        value={themeColors.danger || ""}
                        onChange={(e) =>
                          updateThemeColor("danger", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Warning"
                        type="color"
                        value={themeColors.warning || ""}
                        onChange={(e) =>
                          updateThemeColor("warning", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Success"
                        type="color"
                        value={themeColors.success || ""}
                        onChange={(e) =>
                          updateThemeColor("success", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(themeGradient?.enabled)}
                          onChange={(e) =>
                            updateThemeVariant((variant) => ({
                              ...variant,
                              gradient: {
                                ...(variant.gradient || {}),
                                enabled: e.target.checked,
                              },
                            }))
                          }
                        />
                      }
                      label="Enable gradient"
                    />
                    <Stack direction="row" spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel id="gradient-type-label">
                          Gradient type
                        </InputLabel>
                        <Select
                          labelId="gradient-type-label"
                          label="Gradient type"
                          value={themeGradient?.type || "linear"}
                          onChange={(e) =>
                            updateThemeVariant((variant) => ({
                              ...variant,
                              gradient: {
                                ...(variant.gradient || {}),
                                type: e.target.value,
                              },
                            }))
                          }
                        >
                          <MenuItem value="linear">Linear</MenuItem>
                          <MenuItem value="radial">Radial</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Angle"
                        type="number"
                        value={themeGradient?.angle ?? 0}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            gradient: {
                              ...(variant.gradient || {}),
                              angle: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                    </Stack>
                    <TextField
                      label="Gradient stops"
                      helperText="Comma-separated colors."
                      value={gradientStopsValue}
                      onChange={(e) =>
                        updateThemeVariant((variant) => ({
                          ...variant,
                          gradient: {
                            ...(variant.gradient || {}),
                            stops: e.target.value
                              .split(",")
                              .map((stop: string) => stop.trim())
                              .filter(Boolean),
                          },
                        }))
                      }
                      fullWidth
                    />

                    <TextField
                      label="Font family"
                      value={themeTypography?.fontFamily || ""}
                      onChange={(e) =>
                        updateThemeVariant((variant) => ({
                          ...variant,
                          typography: {
                            ...(variant.typography || {}),
                            fontFamily: e.target.value,
                          },
                        }))
                      }
                      fullWidth
                    />
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Base font size"
                        type="number"
                        value={themeTypography?.baseFontSize ?? 0}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            typography: {
                              ...(variant.typography || {}),
                              baseFontSize: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                      <TextField
                        label="Scale"
                        type="number"
                        value={themeTypography?.scale ?? 1}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            typography: {
                              ...(variant.typography || {}),
                              scale: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Radius"
                        type="number"
                        value={themeShape?.radius ?? 0}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            shape: {
                              ...(variant.shape || {}),
                              radius: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                      <TextField
                        label="Bubble radius"
                        type="number"
                        value={themeShape?.bubbleRadius ?? 0}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            shape: {
                              ...(variant.shape || {}),
                              bubbleRadius: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                      <TextField
                        label="Border width"
                        type="number"
                        value={themeShape?.borderWidth ?? 0}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            shape: {
                              ...(variant.shape || {}),
                              borderWidth: Number(e.target.value),
                            },
                          }))
                        }
                        fullWidth
                      />
                    </Stack>
                    <FormControl fullWidth>
                      <InputLabel id="density-label">Density</InputLabel>
                      <Select
                        labelId="density-label"
                        label="Density"
                        value={themeDensity}
                        onChange={(e) =>
                          updateThemeVariant((variant) => ({
                            ...variant,
                            density: e.target.value,
                          }))
                        }
                      >
                        <MenuItem value="compact">Compact</MenuItem>
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="comfortable">Comfortable</MenuItem>
                      </Select>
                    </FormControl>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(themeEffects?.blurGlass)}
                            onChange={(e) =>
                              updateThemeVariant((variant) => ({
                                ...variant,
                                effects: {
                                  ...(variant.effects || {}),
                                  blurGlass: e.target.checked,
                                },
                              }))
                            }
                          />
                        }
                        label="Blur glass"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              themeEffects?.reducedMotionRespect
                            )}
                            onChange={(e) =>
                              updateThemeVariant((variant) => ({
                                ...variant,
                                effects: {
                                  ...(variant.effects || {}),
                                  reducedMotionRespect: e.target.checked,
                                },
                              }))
                            }
                          />
                        }
                        label="Respect reduced motion"
                      />
                      <FormControl sx={{ minWidth: 160 }}>
                        <InputLabel id="shadow-label">Shadow</InputLabel>
                        <Select
                          labelId="shadow-label"
                          label="Shadow"
                          value={themeEffects?.shadow || "md"}
                          onChange={(e) =>
                            updateThemeVariant((variant) => ({
                              ...variant,
                              effects: {
                                ...(variant.effects || {}),
                                shadow: e.target.value,
                              },
                            }))
                          }
                        >
                          <MenuItem value="sm">Small</MenuItem>
                          <MenuItem value="md">Medium</MenuItem>
                          <MenuItem value="lg">Large</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Header actions</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.header?.logo?.enabled
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  header: {
                                    ...next.widget.header,
                                    logo: {
                                      ...next.widget.header.logo,
                                      enabled: e.target.checked,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Show logo"
                    />
                    <TextField
                      label="Logo URL"
                      value={widgetConfig?.widget?.header?.logo?.url || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              header: {
                                ...next.widget.header,
                                logo: {
                                  ...next.widget.header.logo,
                                  url: e.target.value,
                                },
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.header?.actions?.showClose
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    header: {
                                      ...next.widget.header,
                                      actions: {
                                        ...next.widget.header.actions,
                                        showClose: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Close"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.header?.actions
                                ?.showMinimize
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    header: {
                                      ...next.widget.header,
                                      actions: {
                                        ...next.widget.header.actions,
                                        showMinimize: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Minimize"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.header?.actions?.showReset
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    header: {
                                      ...next.widget.header,
                                      actions: {
                                        ...next.widget.header.actions,
                                        showReset: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Reset"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.header?.actions?.showPopout
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    header: {
                                      ...next.widget.header,
                                      actions: {
                                        ...next.widget.header.actions,
                                        showPopout: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Popout"
                      />
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Message details</Typography>
                    <Stack direction="row" spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel id="timestamp-format-label">
                          Timestamp format
                        </InputLabel>
                        <Select
                          labelId="timestamp-format-label"
                          label="Timestamp format"
                          value={
                            widgetConfig?.widget?.messages?.timestamp?.format ||
                            "relative"
                          }
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  messages: {
                                    ...next.widget.messages,
                                    timestamp: {
                                      ...next.widget.messages.timestamp,
                                      format: e.target.value,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        >
                          <MenuItem value="relative">Relative</MenuItem>
                          <MenuItem value="absolute">Absolute</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl fullWidth>
                        <InputLabel id="typing-style-label">
                          Typing style
                        </InputLabel>
                        <Select
                          labelId="typing-style-label"
                          label="Typing style"
                          value={
                            widgetConfig?.widget?.messages?.typingIndicator
                              ?.style || "dots"
                          }
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  messages: {
                                    ...next.widget.messages,
                                    typingIndicator: {
                                      ...next.widget.messages.typingIndicator,
                                      style: e.target.value,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        >
                          <MenuItem value="dots">Dots</MenuItem>
                          <MenuItem value="bar">Bar</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.messages?.timestamp?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    messages: {
                                      ...next.widget.messages,
                                      timestamp: {
                                        ...next.widget.messages.timestamp,
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Timestamps"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.messages?.typingIndicator
                                ?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    messages: {
                                      ...next.widget.messages,
                                      typingIndicator: {
                                        ...next.widget.messages.typingIndicator,
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Typing indicator"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.messages?.readReceipts
                                ?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    messages: {
                                      ...next.widget.messages,
                                      readReceipts: {
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Read receipts"
                      />
                    </Stack>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.messages?.messageStyles
                                ?.user?.avatar?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    messages: {
                                      ...next.widget.messages,
                                      messageStyles: {
                                        ...(next.widget.messages
                                          .messageStyles || {}),
                                        user: {
                                          ...(next.widget.messages.messageStyles
                                            ?.user || {}),
                                          avatar: {
                                            ...(next.widget.messages
                                              .messageStyles?.user?.avatar ||
                                              {}),
                                            enabled: e.target.checked,
                                          },
                                        },
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="User avatar"
                      />
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">
                      Behavior details
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.behavior?.closeOnEsc
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    behavior: {
                                      ...next.widget.behavior,
                                      closeOnEsc: e.target.checked,
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Close on Esc"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.behavior
                                ?.closeOnOutsideClick
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    behavior: {
                                      ...next.widget.behavior,
                                      closeOnOutsideClick: e.target.checked,
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Close on outside"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.behavior?.focusTrap
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    behavior: {
                                      ...next.widget.behavior,
                                      focusTrap: e.target.checked,
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Focus trap"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.behavior?.autoOpen
                                ?.oncePerSession
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    behavior: {
                                      ...next.widget.behavior,
                                      autoOpen: {
                                        ...next.widget.behavior.autoOpen,
                                        oncePerSession: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Auto open once"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.behavior
                                ?.persistConversation?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    behavior: {
                                      ...next.widget.behavior,
                                      persistConversation: {
                                        ...next.widget.behavior
                                          .persistConversation,
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Persist conversation"
                      />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel id="persist-storage-label">
                          Storage
                        </InputLabel>
                        <Select
                          labelId="persist-storage-label"
                          label="Storage"
                          value={
                            widgetConfig?.widget?.behavior?.persistConversation
                              ?.storage || "localStorage"
                          }
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  behavior: {
                                    ...next.widget.behavior,
                                    persistConversation: {
                                      ...next.widget.behavior
                                        .persistConversation,
                                      storage: e.target.value,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        >
                          <MenuItem value="localStorage">
                            Local storage
                          </MenuItem>
                          <MenuItem value="sessionStorage">
                            Session storage
                          </MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Storage key"
                        value={
                          widgetConfig?.widget?.behavior?.persistConversation
                            ?.key || ""
                        }
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                behavior: {
                                  ...next.widget.behavior,
                                  persistConversation: {
                                    ...next.widget.behavior.persistConversation,
                                    key: e.target.value,
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="TTL (days)"
                        type="number"
                        value={
                          widgetConfig?.widget?.behavior?.persistConversation
                            ?.ttlDays || 0
                        }
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                behavior: {
                                  ...next.widget.behavior,
                                  persistConversation: {
                                    ...next.widget.behavior.persistConversation,
                                    ttlDays: Number(e.target.value),
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                      <TextField
                        label="Rate limit (per min)"
                        type="number"
                        value={
                          widgetConfig?.widget?.behavior?.rateLimit
                            ?.maxMessagesPerMinute || 0
                        }
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                behavior: {
                                  ...next.widget.behavior,
                                  rateLimit: {
                                    ...next.widget.behavior.rateLimit,
                                    maxMessagesPerMinute: Number(
                                      e.target.value
                                    ),
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                    </Stack>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.behavior?.rateLimit?.enabled
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  behavior: {
                                    ...next.widget.behavior,
                                    rateLimit: {
                                      ...next.widget.behavior.rateLimit,
                                      enabled: e.target.checked,
                                    },
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Enable rate limit"
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Analytics</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            widgetConfig?.widget?.analytics?.enabled
                          )}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  analytics: {
                                    ...next.widget.analytics,
                                    enabled: e.target.checked,
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Enable analytics"
                    />
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.analytics?.ga4?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    analytics: {
                                      ...next.widget.analytics,
                                      ga4: {
                                        ...next.widget.analytics.ga4,
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="GA4 enabled"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.analytics?.ga4?.debug
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    analytics: {
                                      ...next.widget.analytics,
                                      ga4: {
                                        ...next.widget.analytics.ga4,
                                        debug: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="GA4 debug"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(
                              widgetConfig?.widget?.analytics?.clarity?.enabled
                            )}
                            onChange={(e) =>
                              onChange((prev) => {
                                const next = prev as any;
                                return {
                                  ...next,
                                  widget: {
                                    ...next.widget,
                                    analytics: {
                                      ...next.widget.analytics,
                                      clarity: {
                                        ...next.widget.analytics.clarity,
                                        enabled: e.target.checked,
                                      },
                                    },
                                  },
                                };
                              })
                            }
                          />
                        }
                        label="Clarity enabled"
                      />
                    </Stack>
                    <TextField
                      label="GA4 measurement ID"
                      value={
                        widgetConfig?.widget?.analytics?.ga4?.measurementId ||
                        ""
                      }
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              analytics: {
                                ...next.widget.analytics,
                                ga4: {
                                  ...next.widget.analytics.ga4,
                                  measurementId: e.target.value,
                                },
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <TextField
                      label="Clarity project ID"
                      value={
                        widgetConfig?.widget?.analytics?.clarity?.projectId ||
                        ""
                      }
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              analytics: {
                                ...next.widget.analytics,
                                clarity: {
                                  ...next.widget.analytics.clarity,
                                  projectId: e.target.value,
                                },
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">
                      Internationalization
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(widgetConfig?.widget?.i18n?.enabled)}
                          onChange={(e) =>
                            onChange((prev) => {
                              const next = prev as any;
                              return {
                                ...next,
                                widget: {
                                  ...next.widget,
                                  i18n: {
                                    ...next.widget.i18n,
                                    enabled: e.target.checked,
                                  },
                                },
                              };
                            })
                          }
                        />
                      }
                      label="Enable i18n"
                    />
                    <TextField
                      label="Supported locales"
                      helperText="Comma-separated locales."
                      value={supportedLocalesValue}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              i18n: {
                                ...next.widget.i18n,
                                supportedLocales: e.target.value
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <FormControl fullWidth>
                      <InputLabel id="default-locale-label">
                        Default locale
                      </InputLabel>
                      <Select
                        labelId="default-locale-label"
                        label="Default locale"
                        value={i18nDefaultLocale}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                i18n: {
                                  ...next.widget.i18n,
                                  defaultLocale: e.target.value,
                                },
                              },
                            };
                          })
                        }
                      >
                        {supportedLocalesList.map((locale: string) => (
                          <MenuItem key={locale} value={locale}>
                            {locale}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Title"
                      value={i18nStrings.title || ""}
                      onChange={(e) =>
                        onChange((prev) => {
                          const next = prev as any;
                          return {
                            ...next,
                            widget: {
                              ...next.widget,
                              i18n: {
                                ...next.widget.i18n,
                                strings: {
                                  ...next.widget.i18n.strings,
                                  [i18nDefaultLocale]: {
                                    ...next.widget.i18n.strings?.[
                                      i18nDefaultLocale
                                    ],
                                    title: e.target.value,
                                  },
                                },
                              },
                            },
                          };
                        })
                      }
                      fullWidth
                    />
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Input placeholder"
                        value={i18nStrings.inputPlaceholder || ""}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                i18n: {
                                  ...next.widget.i18n,
                                  strings: {
                                    ...next.widget.i18n.strings,
                                    [i18nDefaultLocale]: {
                                      ...next.widget.i18n.strings?.[
                                        i18nDefaultLocale
                                      ],
                                      inputPlaceholder: e.target.value,
                                    },
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                      <TextField
                        label="Send label"
                        value={i18nStrings.send || ""}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                i18n: {
                                  ...next.widget.i18n,
                                  strings: {
                                    ...next.widget.i18n.strings,
                                    [i18nDefaultLocale]: {
                                      ...next.widget.i18n.strings?.[
                                        i18nDefaultLocale
                                      ],
                                      send: e.target.value,
                                    },
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Close label"
                        value={i18nStrings.close || ""}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                i18n: {
                                  ...next.widget.i18n,
                                  strings: {
                                    ...next.widget.i18n.strings,
                                    [i18nDefaultLocale]: {
                                      ...next.widget.i18n.strings?.[
                                        i18nDefaultLocale
                                      ],
                                      close: e.target.value,
                                    },
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                      <TextField
                        label="Reset label"
                        value={i18nStrings.reset || ""}
                        onChange={(e) =>
                          onChange((prev) => {
                            const next = prev as any;
                            return {
                              ...next,
                              widget: {
                                ...next.widget,
                                i18n: {
                                  ...next.widget.i18n,
                                  strings: {
                                    ...next.widget.i18n.strings,
                                    [i18nDefaultLocale]: {
                                      ...next.widget.i18n.strings?.[
                                        i18nDefaultLocale
                                      ],
                                      reset: e.target.value,
                                    },
                                  },
                                },
                              },
                            };
                          })
                        }
                        fullWidth
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={7}>
        <Box sx={{ position: "sticky", top: "60px" }}>
          <WidgetPreview
            config={widgetConfig}
            agentId={widgetAgentId}
            apiKey=""
            userId=""
            authToken=""
          />
        </Box>
      </Grid>
    </Grid>
  );
}
