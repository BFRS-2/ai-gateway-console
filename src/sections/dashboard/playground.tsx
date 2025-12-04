"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Grid,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Tabs,
  Tab,
  Slider,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Alert,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";
import TitleRoundedIcon from "@mui/icons-material/TitleRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import SettingsBackupRestoreRoundedIcon from "@mui/icons-material/SettingsBackupRestoreRounded";

import serviceManagementService from "src/api/services/serviceManagement.service";
import playgroundService from "src/api/services/playground.service";
import { ModelRow, ProviderRow } from "./serviceComponents/dynamicServiceForm";

// ------------------------- Types -------------------------

type PlaygroundServiceKey =
  | "summarization"
  | "chatCompletion"
  | "chatbot"
  | "embedding"
  | "ocr";

// ---------------------- Helper Section -------------------

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        borderColor: (t) => t.palette.divider,
        bgcolor: (t) =>
          t.palette.mode === "dark"
            ? "rgba(255,255,255,0.02)"
            : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          {right}
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}

// ===================== MAIN PLAYGROUND =====================

export default function DockyardPlayground() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [models, setModels] = useState<ModelRow[]>([]);

  // now these store NAMES (not ids)
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  const [service, setService] = useState<PlaygroundServiceKey>("summarization");

  const [loadingMeta, setLoadingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Fetch providers + models on mount
  useEffect(() => {
    let ignore = false;
    async function fetchMeta() {
      try {
        setLoadingMeta(true);
        setMetaError(null);

        const [providersRes, modelsRes] = await Promise.all([
          serviceManagementService.getAllProviders(),
          serviceManagementService.getAllModels(),
        ]);

        if (ignore) return;

        const provData: ProviderRow[] = providersRes?.data;
        console.log("🚀 ~ fetchMeta ~ provData:", provData);
        const modelData: ModelRow[] = modelsRes?.data;
        console.log("🚀 ~ fetchMeta ~ modelData:", modelData);

        setProviders(provData);
        setModels(modelData);
      } catch (err) {
        console.error("Failed to load providers/models", err);
        setMetaError("Failed to load providers/models");
      } finally {
        if (!ignore) setLoadingMeta(false);
      }
    }

    fetchMeta();
    return () => {
      ignore = true;
    };
  }, []);

  // Models allowed for the current service
  const serviceModels = useMemo(() => {
    const serviceLc = service.toLowerCase().replace(/\s+/g, "");

    return models.filter((m) => {
      const allowed = Array.isArray(m.allowed_services)
        ? m.allowed_services.map((s) => s.toLowerCase().replace(/\s+/g, ""))
        : [];

      console.log("🚀 allowed:", allowed);
      console.log("🚀 serviceLc:", serviceLc);

      return (
        m.status?.toLowerCase() === "active" && allowed.includes(serviceLc)
      );
    });
  }, [models, service]);

  // Providers that have at least one active model for the current service
  const serviceProviders = useMemo(() => {
    console.log("🚀 ~ DockyardPlayground ~ serviceModels:", serviceModels);

    // model.provider is PROVIDER NAME
    const providerNames = new Set(serviceModels.map((m) => m.provider));

    return providers.filter(
      (p) =>
        p.status?.toLowerCase() === "active" && providerNames.has(p.name)
    );
  }, [providers, serviceModels]);

  // Models further filtered by currently selected provider (by provider NAME)
  const filteredModels = useMemo(() => {
    if (!selectedProvider) return serviceModels;
    return serviceModels.filter((m) => m.provider === selectedProvider);
  }, [serviceModels, selectedProvider]);

  // Ensure selectedProvider is valid for this service (by NAME)
  useEffect(() => {
    if (serviceProviders.length === 0) {
      setSelectedProvider("");
      setSelectedModel("");
      return;
    }

    if (
      !selectedProvider ||
      !serviceProviders.some((p) => p.name === selectedProvider)
    ) {
      const firstProviderName = serviceProviders[0].name;
      setSelectedProvider(firstProviderName);
    }
  }, [serviceProviders, selectedProvider]);

  // Ensure selectedModel is valid for this service + provider (by NAME)
  useEffect(() => {
    if (filteredModels.length === 0) {
      setSelectedModel("");
      return;
    }

    if (!selectedModel || !filteredModels.some((m) => m.name === selectedModel)) {
      setSelectedModel(filteredModels[0].name);
    }
  }, [filteredModels, selectedModel]);

  const currentProviderLabel = selectedProvider || "Provider";
  const currentModelLabel = selectedModel || "Model";

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        p:2,
        bgcolor: (t) =>
          t.palette.mode === "dark" ? "background.default" : "grey.50",
      }}
    >
      {/* Header / AppBar-ish */}
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
          Playground
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" color="primary" label={currentProviderLabel} />
          <Chip size="small" variant="outlined" label={currentModelLabel} />
        </Stack>
      </Box>

      {/* Content area */}
      <Box
        sx={{
          flex: 1,
          p: { xs: 2, md: 3 },
        }}
      >
        <Stack spacing={3}>
          {/* Provider & Model selection */}
          <Section
            title="Provider & Model"
            right={
              loadingMeta ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <LinearProgress sx={{ width: 120 }} />
                  <Typography variant="caption" color="text.secondary">
                    Loading registry…
                  </Typography>
                </Stack>
              ) : metaError ? (
                <Alert severity="error" sx={{ py: 0.5 }}>
                  {metaError}
                </Alert>
              ) : null
            }
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="prov">Provider</InputLabel>
                  <Select
                    labelId="prov"
                    label="Provider"
                    value={selectedProvider}
                    onChange={(e) =>
                      setSelectedProvider(e.target.value as string)
                    }
                  >
                    {serviceProviders.map((p) => (
                      <MenuItem key={p.id} value={p.name}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth size="small">
                  <InputLabel id="model">Model</InputLabel>
                  <Select
                    labelId="model"
                    label="Model"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as string)}
                  >
                    {filteredModels.map((m) => (
                      <MenuItem key={m.id} value={m.name}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Section>

          {/* Service Tabs */}
          <Section
            title="Service"
          >
            <Tabs
              value={service}
              onChange={(_, v) => setService(v)}
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
            >
              <Tab
                icon={<SummarizeRoundedIcon fontSize="small" />}
                iconPosition="start"
                label="Summarization"
                value="summarization"
              />
              <Tab
                icon={<ChatBubbleOutlineRoundedIcon fontSize="small" />}
                iconPosition="start"
                label="Chat Completion"
                value="chatCompletion"
              />
              {/* <Tab
                icon={<ChatBubbleOutlineRoundedIcon fontSize="small" />}
                iconPosition="start"
                label="Chatbot (RAG)"
                value="chatbot"
              /> */}
              <Tab
                icon={<TitleRoundedIcon fontSize="small" />}
                iconPosition="start"
                label="Embedding"
                value="embedding"
              />
              <Tab
                icon={<ImageRoundedIcon fontSize="small" />}
                iconPosition="start"
                label="OCR"
                value="ocr"
              />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {service === "summarization" && (
                <SummarizationPanel
                  provider={selectedProvider} // name
                  model={selectedModel}       // name
                />
              )}
              {service === "chatCompletion" && (
                <ChatCompletionPanel
                  provider={selectedProvider}
                  model={selectedModel}
                />
              )}
              {service === "chatbot" && (
                <ChatbotPanel
                  provider={selectedProvider}
                  model={selectedModel}
                />
              )}
              {service === "embedding" && (
                <EmbeddingPanel
                  provider={selectedProvider}
                  model={selectedModel}
                />
              )}
              {service === "ocr" && (
                <OcrPanel provider={selectedProvider} model={selectedModel} />
              )}
            </Box>
          </Section>
        </Stack>
      </Box>
    </Box>
  );
}

// ==================== PANELS ====================

// 1. Summarization
function SummarizationPanel({
  provider,
  model,
}: {
  provider: string;
  model: string;
}) {
  const [text, setText] = useState(
    "Paste any long text here and test your Summarization API."
  );
  const [style, setStyle] = useState<"brief" | "balanced" | "detailed">(
    "balanced"
  );
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [wordCount, setWordCount] = useState(200);
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<string>("");
  const [raw, setRaw] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setOut("");
    setRaw(null);
    setError(null);
    try {
      const res = await playgroundService.summarize({
        user_prompt: text,
        model,
        provider,
        temperature,
        max_tokens: maxTokens,
        word_count: wordCount,
      });

      setRaw(res);
      const summary = res?.data?.summary || JSON.stringify(res, null, 2);
      setOut(summary);
    } catch (err) {
      console.error(err);
      setError(err?.message ?? "Summarization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStyleChange = (
    _: React.MouseEvent<HTMLElement>,
    next: "brief" | "balanced" | "detailed" | null
  ) => {
    if (!next) return;
    setStyle(next);
    if (next === "brief") {
      setWordCount(80);
    } else if (next === "balanced") {
      setWordCount(200);
    } else {
      setWordCount(400);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={7}>
        <Typography variant="subtitle2" sx={{ mb: 2}}>
          Input
        </Typography>
        <TextField
          label="Input Text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
          multiline
          minRows={8}
          size="small"
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mt: 1 }}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={style}
            onChange={handleStyleChange}
          >
            <ToggleButton value="brief">Brief</ToggleButton>
            <ToggleButton value="balanced">Balanced</ToggleButton>
            <ToggleButton value="detailed">Detailed</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            label="Word Count"
            type="number"
            size="small"
            sx={{ width: 140 }}
            value={wordCount}
            onChange={(e) => setWordCount(Number(e.target.value) || 0)}
          />
        </Stack>
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="caption">
            Temperature: {temperature.toFixed(2)}
          </Typography>
          <Slider
            value={temperature}
            onChange={(_, v) => setTemperature(v as number)}
            min={0}
            max={1}
            step={0.01}
          />
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 2 }}
          justifyContent="flex-start"
        >
          <Button
            onClick={run}
            variant="contained"
            disabled={loading}
            startIcon={<SummarizeRoundedIcon />}
          >
            Summarize
          </Button>
          <Button
            onClick={() => {
              setText("");
              setOut("");
              setRaw(null);
              setError(null);
            }}
            startIcon={<RestartAltRoundedIcon />}
          >
            Reset
          </Button>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Grid>
      <Grid item xs={12} md={5}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Output
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            height: 320, // fixed height
            overflow: "auto", // scroll when long
          }}
        >
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          <Typography
            whiteSpace="pre-wrap"
            variant="body2"
            color="text.secondary"
          >
            {out || (loading ? "Generating…" : "Run to see summary")}
          </Typography>

          {raw && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: "monospace" }}
              >
                Raw:
              </Typography>
              <Typography
                component="pre"
                sx={{
                  fontSize: 11,
                  mt: 0.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "monospace",
                }}
              >
                {JSON.stringify(raw, null, 2)}
              </Typography>
            </>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

// 2. Chat Completion (single-turn, /chat/completion)
function ChatCompletionPanel({
  provider,
  model,
}: {
  provider: string;
  model: string;
}) {
  const [userPrompt, setUserPrompt] = useState(
    "What is the capital of France?"
  );
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant that provides accurate and concise answers."
  );
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [raw, setRaw] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!userPrompt.trim()) return;
    setLoading(true);
    setAnswer("");
    setRaw(null);
    setError(null);
    try {
      const res = await playgroundService.chatCompletion({
        user_prompt: userPrompt,
        model,
        provider,
        temperature,
        max_tokens: maxTokens,
        system_prompt: systemPrompt,
      });

      setRaw(res);
      const text = res?.data?.answer || JSON.stringify(res, null, 2);
      setAnswer(text);
    } catch (err) {
      console.error(err);
      setError(err?.message ?? "Chat completion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={7}>
         <Typography variant="subtitle2" sx={{ mb: 2}}>
          Input
        </Typography>
        <TextField
          label="System Prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          size="small"
        />
        <TextField
          sx={{ mt: 2 }}
          label="User Prompt"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          fullWidth
          multiline
          minRows={4}
          size="small"
        />
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Box flex={1}>
            <Typography variant="caption">
              Temperature: {temperature.toFixed(2)}
            </Typography>
            <Slider
              value={temperature}
              onChange={(_, v) => setTemperature(v as number)}
              min={0}
              max={1}
              step={0.01}
            />
          </Box>
          <TextField
            label="Max Tokens"
            type="number"
            size="small"
            sx={{ width: 140 }}
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value) || 0)}
          />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={run}
            disabled={loading}
            startIcon={<SendRoundedIcon />}
          >
            Send
          </Button>
          <Button
            onClick={() => {
              setUserPrompt("");
              setAnswer("");
              setRaw(null);
              setError(null);
            }}
            startIcon={<SettingsBackupRestoreRoundedIcon />}
          >
            Reset
          </Button>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Grid>
      <Grid item xs={12} md={5}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Output
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            height: 340, // fixed height
            overflow: "auto",
          }}
        >
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          <Typography variant="body2" whiteSpace="pre-wrap">
            {answer ||
              (loading ? "Waiting for response…" : "Run to see output")}
          </Typography>
          {raw && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: "monospace" }}
              >
                Raw:
              </Typography>
              <Typography
                component="pre"
                sx={{
                  fontSize: 11,
                  mt: 0.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "monospace",
                }}
              >
                {JSON.stringify(raw, null, 2)}
              </Typography>
            </>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

// 3. Chatbot (multi-turn, /chat with RAG options)
function ChatbotPanel({
  provider,
  model,
}: {
  provider: string;
  model: string;
}) {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [draft, setDraft] = useState("What is artificial intelligence?");
  const [ragLimit, setRagLimit] = useState(5);
  const [ragThreshold, setRagThreshold] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  const send = async () => {
    if (!draft.trim()) return;
    const userMsg = { role: "user" as const, content: draft };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setLoading(true);
    setError(null);

    try {
      const userId =
        typeof window !== "undefined"
          ? localStorage.getItem("userId") ?? "playground-user"
          : "playground-user";

      const res = await playgroundService.chatbot({
        query: userMsg.content,
        model,
        provider,
        rag_limit: ragLimit,
        rag_threshold: ragThreshold,
        userId,
      });

      const replyText = res?.data?.answer || JSON.stringify(res, null, 2);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyText },
      ]);
    } catch (err) {
      console.error(err);
      setError(err?.message ?? "Chatbot call failed");
    } finally {
      setLoading(false);
      setTimeout(
        () =>
          scroller.current?.scrollTo({
            top: scroller.current.scrollHeight,
            behavior: "smooth",
          }),
        50
      );
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
         <Typography variant="subtitle2" sx={{ mb: 2}}>
          Input
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            height: 360,
            overflow: "auto",
            borderRadius: 2,
          }}
          ref={scroller}
        >
          <Stack spacing={1}>
            {messages.map((m, i) => (
              <Stack
                key={i}
                direction="row"
                spacing={1}
                alignItems="flex-start"
              >
                <Avatar sx={{ width: 28, height: 28 }}>
                  {m.role === "user" ? "U" : "A"}
                </Avatar>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.2,
                    maxWidth: "100%",
                    bgcolor: (t) =>
                      m.role === "user"
                        ? t.palette.background.paper
                        : t.palette.action.selected,
                  }}
                >
                  <Typography variant="body2" whiteSpace="pre-wrap">
                    {m.content}
                  </Typography>
                </Paper>
              </Stack>
            ))}
            {loading && (
              <Typography variant="caption">Assistant is thinking…</Typography>
            )}
          </Stack>
        </Paper>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            placeholder="Ask something…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            size="small"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton color="primary" onClick={send} disabled={loading}>
                    <SendRoundedIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button onClick={() => setMessages([])}>Clear</Button>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </Grid>
      <Grid item xs={12} md={4}>
        <Alert severity="info" icon={<ChatBubbleOutlineRoundedIcon />}>
          This panel calls your <b>/api/v1/chat</b> endpoint with RAG settings.
        </Alert>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={2}>
          <TextField
            label="RAG Limit"
            type="number"
            size="small"
            value={ragLimit}
            onChange={(e) => setRagLimit(Number(e.target.value) || 0)}
          />
          <Box>
            <Typography variant="caption">
              RAG Threshold: {ragThreshold.toFixed(2)}
            </Typography>
            <Slider
              value={ragThreshold}
              onChange={(_, v) => setRagThreshold(v as number)}
              min={0}
              max={1}
              step={0.01}
            />
          </Box>
        </Stack>
      </Grid>
    </Grid>
  );
}

// 4. Embedding
function EmbeddingPanel({
  provider,
  model,
}: {
  provider: string;
  model: string;
}) {
  const [text, setText] = useState(
    "Vectorize this text to test /api/v1/embedding."
  );
  const [vec, setVec] = useState<number[] | null>(null);
  const [raw, setRaw] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setVec(null);
    setRaw(null);
    setError(null);
    try {
      const res = await playgroundService.embed({
        text,
        provider,
        model,
      });

      setRaw(res);

      const vector =
        res?.data?.vector ||
        res?.data?.embedding ||
        res;

      if (Array.isArray(vector)) {
        setVec(vector as number[]);
      } else {
        setVec(null);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message ?? "Embedding failed");
    } finally {
      setLoading(false);
    }
  };

  const preview = useMemo(
    () =>
      vec
        ? vec
            .slice(0, 8)
            .map((n) => n.toFixed(3))
            .join(", ") + " …"
        : "",
    [vec]
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={7}>
         <Typography variant="subtitle2" sx={{ mb: 2}}>
          Input
        </Typography>
        <TextField
          label="Text"
          fullWidth
          multiline
          minRows={6}
          size="small"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={run} disabled={loading}>
            Embed
          </Button>
          <Button
            onClick={() => {
              setText("");
              setVec(null);
              setRaw(null);
              setError(null);
            }}
          >
            Reset
          </Button>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Grid>
      <Grid item xs={12} md={5}>
         <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Output
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            height: 320, // fixed
            overflow: "auto",
          }}
        >
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          {vec ? (
            <>
              <Typography variant="body2">Dimension: {vec.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Preview: {preview}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Run to see vector output
            </Typography>
          )}

          {raw && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: "monospace" }}
              >
                Raw:
              </Typography>
              <Typography
                component="pre"
                sx={{
                  fontSize: 11,
                  mt: 0.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "monospace",
                }}
              >
                {JSON.stringify(raw, null, 2)}
              </Typography>
            </>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

// 5. OCR (pdf/image)
function OcrPanel({ provider, model }: { provider: string; model: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image">("image");
  const [text, setText] = useState("");
  const [raw, setRaw] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (f.type === "application/pdf") {
        setFileType("pdf");
      } else {
        setFileType("image");
      }
    }
  };

  const run = async () => {
    if (!file) return;
    setLoading(true);
    setText("");
    setRaw(null);
    setError(null);
    try {
      const res = await playgroundService.ocr({
        file,
        file_type: fileType,
        model,
        provider,
      });

      setRaw(res);
      const extracted =
        res?.data?.text ||
        res?.data?.content ||
        JSON.stringify(res, null, 2);
      setText(extracted);
    } catch (err) {
      console.error(err);
      setError(err?.message ?? "OCR failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
         <Typography variant="subtitle2" sx={{ mb: 2}}>
          Input
        </Typography>
        <Stack spacing={2}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadRoundedIcon />}
          >
            {file ? file.name : "Upload Image/PDF"}
            <input
              hidden
              type="file"
              accept="image/*,application/pdf"
              onChange={onPick}
            />
          </Button>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={fileType}
            onChange={(_, v) => v && setFileType(v)}
          >
            <ToggleButton value="image">Image</ToggleButton>
            <ToggleButton value="pdf">PDF</ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={run}
              disabled={!file || loading}
            >
              Extract Text
            </Button>
            <Button
              onClick={() => {
                setFile(null);
                setText("");
                setRaw(null);
                setError(null);
              }}
            >
              Reset
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </Stack>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Output
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            height: 360, // fixed
            overflow: "auto",
          }}
        >
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          <Typography
            variant="body2"
            whiteSpace="pre-wrap"
            color="text.secondary"
          >
            {text ||
              (loading
                ? "Processing…"
                : "Upload a file and run OCR to see the extracted text.")}
          </Typography>

          {raw && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: "monospace" }}
              >
                Raw:
              </Typography>
              <Typography
                component="pre"
                sx={{
                  fontSize: 11,
                  mt: 0.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "monospace",
                }}
              >
                {JSON.stringify(raw, null, 2)}
              </Typography>
            </>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
