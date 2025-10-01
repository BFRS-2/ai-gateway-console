"use client"

import React, { useMemo, useRef, useState } from 'react';
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
} from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import SummarizeRoundedIcon from '@mui/icons-material/SummarizeRounded';
import TitleRoundedIcon from '@mui/icons-material/TitleRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import HeadphonesRoundedIcon from '@mui/icons-material/HeadphonesRounded';

// ----------------------------------------------
// Types
// ----------------------------------------------
type ProviderKey = 'openai' | 'google' | 'anthropic';

type ServiceKey =
  | 'summarization'
  | 'chatbot'
  | 'embedding'
  | 'ocr'
  | 'voice2voice';

// ----------------------------------------------
// Mock model registry (replace with API)
// ----------------------------------------------
const MODEL_REGISTRY: Record<ProviderKey, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  anthropic: ['claude-3.5-sonnet', 'claude-3-haiku'],
};

// ----------------------------------------------
// Mock API client (replace with Dockyard backend)
// ----------------------------------------------
const mockLatency = (min = 400, max = 1200) =>
  new Promise((r) => setTimeout(r, Math.floor(Math.random() * (max - min)) + min));

async function runSummarize(params: {
  provider: ProviderKey;
  model: string;
  text: string;
  style: 'brief' | 'balanced' | 'detailed';
  temperature: number;
}): Promise<string> {
  await mockLatency();
  const len = params.text?.split(/\s+/).length || 0;
  const target = params.style === 'brief' ? Math.max(1, Math.floor(len * 0.2)) : params.style === 'detailed' ? Math.max(1, Math.floor(len * 0.6)) : Math.max(1, Math.floor(len * 0.35));
  return `→ Summary (${params.style}, T=${params.temperature.toFixed(2)}) for ${len} words using ${params.provider}/${params.model}\n\n${params.text.split(/\s+/).slice(0, target).join(' ')} …`;
}

async function runChat(params: { provider: ProviderKey; model: string; messages: { role: 'user' | 'assistant' | 'system'; content: string }[] }): Promise<string> {
  await mockLatency();
  const last = params.messages.filter((m) => m.role === 'user').pop()?.content ?? '';
  return `🤖 (${params.provider}/${params.model}) Reply to: ${last.slice(0, 120)} …`;
}

async function runEmbed(params: { provider: ProviderKey; model: string; text: string }): Promise<number[]> {
  await mockLatency();
  // fake vector
  const dim = 32;
  const vec = Array.from({ length: dim }, (_, i) => Math.sin(i + params.text.length / 7));
  return vec;
}

async function runOCR(params: { provider: ProviderKey; model: string; file: File }): Promise<string> {
  await mockLatency(800, 1600);
  return `Extracted text from: ${params.file.name}\n\n(placeholder) Lorem ipsum dolor sit amet…`;
}

async function runVoice2Voice(params: { provider: ProviderKey; model: string; file: File; voice: string }): Promise<Blob> {
  await mockLatency(1200, 2200);
  // return a short silent wav blob placeholder
  const sampleRate = 8000; const seconds = 1.0; const length = sampleRate * seconds; const buffer = new ArrayBuffer(44 + length * 2); const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  // WAV header
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + length * 2, true); writeStr(8, 'WAVE'); writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeStr(36, 'data'); view.setUint32(40, length * 2, true);
  // silence samples already zeroed
  return new Blob([buffer], { type: 'audio/wav' });
}

// ----------------------------------------------
// Helper
// ----------------------------------------------
function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          {right}
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}

// ----------------------------------------------
// Main Playground
// ----------------------------------------------
export default function DockyardMuiPlayground() {
  const [provider, setProvider] = useState<ProviderKey>('openai');
  const [model, setModel] = useState<string>(MODEL_REGISTRY['openai'][0]);
  const [service, setService] = useState<ServiceKey>('summarization');

  // reset model when provider changes
  React.useEffect(() => { setModel(MODEL_REGISTRY[provider][0]); }, [provider]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={800}>Dockyard Playground</Typography>
        <Typography variant="body2" color="text.secondary">Choose a provider & model, pick a service, tweak inputs, and run. Pure MUI, dark-mode friendly.</Typography>

        <Section title="Provider & Model">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="prov">Provider</InputLabel>
                <Select labelId="prov" label="Provider" value={provider} onChange={(e) => setProvider(e.target.value as ProviderKey)}>
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="google">Google</MenuItem>
                  <MenuItem value="anthropic">Anthropic</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <FormControl fullWidth>
                <InputLabel id="model">Model</InputLabel>
                <Select labelId="model" label="Model" value={model} onChange={(e) => setModel(e.target.value)}>
                  {MODEL_REGISTRY[provider].map((m) => (
                    <MenuItem value={m} key={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Section>

        <Section
          title="Service"
          right={<Typography variant="caption" color="text.secondary">Summarization • Chatbot • Embedding • OCR • Voice→Voice</Typography>}
        >
          <Tabs value={service} onChange={(_, v) => setService(v)} variant="scrollable" scrollButtons allowScrollButtonsMobile>
            <Tab icon={<SummarizeRoundedIcon fontSize="small" />} iconPosition="start" label="Summarization" value="summarization" />
            <Tab icon={<ChatBubbleOutlineRoundedIcon fontSize="small" />} iconPosition="start" label="Chatbot" value="chatbot" />
            <Tab icon={<TitleRoundedIcon fontSize="small" />} iconPosition="start" label="Embedding" value="embedding" />
            <Tab icon={<ImageRoundedIcon fontSize="small" />} iconPosition="start" label="OCR" value="ocr" />
            <Tab icon={<HeadphonesRoundedIcon fontSize="small" />} iconPosition="start" label="Voice→Voice" value="voice2voice" />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            {service === 'summarization' && (
              <SummarizationPanel provider={provider} model={model} />
            )}
            {service === 'chatbot' && (
              <ChatbotPanel provider={provider} model={model} />
            )}
            {service === 'embedding' && (
              <EmbeddingPanel provider={provider} model={model} />
            )}
            {service === 'ocr' && (
              <OcrPanel provider={provider} model={model} />
            )}
            {service === 'voice2voice' && (
              <Voice2VoicePanel provider={provider} model={model} />
            )}
          </Box>
        </Section>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------
// Summarization Panel
// ----------------------------------------------
function SummarizationPanel({ provider, model }: { provider: ProviderKey; model: string }) {
  const [text, setText] = useState('Paste any long text and get a quick summary.');
  const [style, setStyle] = useState<'brief' | 'balanced' | 'detailed'>('balanced');
  const [temperature, setTemperature] = useState(0.3);
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState('');

  const run = async () => {
    setLoading(true); setOut('');
    const res = await runSummarize({ provider, model, text, style, temperature });
    setOut(res); setLoading(false);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={7}>
        <TextField
          label="Input Text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth multiline minRows={8}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {(['brief', 'balanced', 'detailed'] as const).map((s) => (
            <Chip
              key={s}
              label={s}
              color={style === s ? 'primary' : 'default'}
              onClick={() => setStyle(s)}
              variant={style === s ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Stack>
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="caption">Temperature: {temperature.toFixed(2)}</Typography>
          <Slider value={temperature} onChange={(_, v) => setTemperature(v as number)} min={0} max={1} step={0.01} />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button onClick={run} variant="contained" disabled={loading} startIcon={<SummarizeRoundedIcon />}>Summarize</Button>
          <Button onClick={() => { setText(''); setOut(''); }} startIcon={<RestartAltRoundedIcon />}>Reset</Button>
        </Stack>
      </Grid>
      <Grid item xs={12} md={5}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Output</Typography>
        <Paper variant="outlined" sx={{ p: 2, minHeight: 240 }}>
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          <Typography whiteSpace="pre-wrap" variant="body2" color="text.secondary">{out || (loading ? 'Generating…' : 'Run to see summary')}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

// ----------------------------------------------
// Chatbot Panel
// ----------------------------------------------
function ChatbotPanel({ provider, model }: { provider: ProviderKey; model: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [draft, setDraft] = useState('Hello!');
  const [loading, setLoading] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);

  const send = async () => {
    if (!draft.trim()) return;
    const next = [...messages, { role: 'user' as const, content: draft }];
    setMessages(next); setDraft(''); setLoading(true);
    const reply = await runChat({ provider, model, messages: next.map((m) => ({ ...m })) as any });
    setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    setLoading(false);
    setTimeout(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }), 50);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Paper variant="outlined" sx={{ p: 2, height: 360, overflow: 'auto' }} ref={scroller}>
          <Stack spacing={1}>
            {messages.map((m, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                <Avatar sx={{ width: 28, height: 28 }}>{m.role === 'user' ? 'U' : 'A'}</Avatar>
                <Paper variant="outlined" sx={{ p: 1.2, bgcolor: (t) => m.role === 'user' ? t.palette.background.paper : t.palette.action.selected }}>
                  <Typography variant="body2" whiteSpace="pre-wrap">{m.content}</Typography>
                </Paper>
              </Stack>
            ))}
            {loading && <Typography variant="caption">Assistant is typing…</Typography>}
          </Stack>
        </Paper>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton color="primary" onClick={send} disabled={loading}><SendRoundedIcon /></IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button onClick={() => setMessages([])}>Clear</Button>
        </Stack>
      </Grid>
      <Grid item xs={12} md={4}>
        <Alert severity="info" icon={<ChatBubbleOutlineRoundedIcon />}>
          This is a lightweight chat panel. Wire it to Dockyard's /chat endpoint to stream tokens.
        </Alert>
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">Tips</Typography>
        <Typography variant="body2">Use system prompts and RAG to ground responses.</Typography>
      </Grid>
    </Grid>
  );
}

// ----------------------------------------------
// Embedding Panel
// ----------------------------------------------
function EmbeddingPanel({ provider, model }: { provider: ProviderKey; model: string }) {
  const [text, setText] = useState('Vectorize this text to get embeddings.');
  const [vec, setVec] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setVec(null);
    const v = await runEmbed({ provider, model, text });
    setVec(v); setLoading(false);
  };

  const preview = useMemo(() => (vec ? vec.slice(0, 8).map((n) => n.toFixed(3)).join(', ') + ' …' : ''), [vec]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={7}>
        <TextField label="Text" fullWidth multiline minRows={6} value={text} onChange={(e) => setText(e.target.value)} />
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={run} disabled={loading}>Embed</Button>
          <Button onClick={() => { setText(''); setVec(null); }}>Reset</Button>
        </Stack>
      </Grid>
      <Grid item xs={12} md={5}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Vector</Typography>
        <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          {vec ? (
            <>
              <Typography variant="body2">Dimension: {vec.length}</Typography>
              <Typography variant="body2" color="text.secondary">Preview: {preview}</Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">Run to see vector output</Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

// ----------------------------------------------
// OCR Panel
// ----------------------------------------------
function OcrPanel({ provider, model }: { provider: ProviderKey; model: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const run = async () => {
    if (!file) return;
    setLoading(true); setText('');
    const res = await runOCR({ provider, model, file });
    setText(res); setLoading(false);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Button variant="outlined" component="label" startIcon={<CloudUploadRoundedIcon />}>
          {file ? file.name : 'Upload Image/PDF'}
          <input hidden type="file" accept="image/*,application/pdf" onChange={onPick} />
        </Button>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={run} disabled={!file || loading}>Extract Text</Button>
          <Button onClick={() => { setFile(null); setText(''); }}>Reset</Button>
        </Stack>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Output</Typography>
        <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          <Typography variant="body2" whiteSpace="pre-wrap" color="text.secondary">{text || (loading ? 'Processing…' : 'Upload a file and run OCR')}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

// ----------------------------------------------
// Voice→Voice Panel
// ----------------------------------------------
function Voice2VoicePanel({ provider, model }: { provider: ProviderKey; model: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [voice, setVoice] = useState('alloy');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const run = async () => {
    if (!file) return;
    setLoading(true); setAudioUrl(null);
    const blob = await runVoice2Voice({ provider, model, file, voice });
    const url = URL.createObjectURL(blob);
    setAudioUrl(url); setLoading(false);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Stack spacing={2}>
          <Button variant="outlined" component="label" startIcon={<GraphicEqRoundedIcon />}>
            {file ? file.name : 'Upload Source Audio (.wav/.mp3)'}
            <input hidden type="file" accept="audio/*" onChange={onPick} />
          </Button>
          <FormControl fullWidth>
            <InputLabel id="voice">Output Voice</InputLabel>
            <Select labelId="voice" label="Output Voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
              <MenuItem value="alloy">Alloy</MenuItem>
              <MenuItem value="verse">Verse</MenuItem>
              <MenuItem value="edge">Edge</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={run} disabled={!file || loading}>Convert</Button>
            <Button onClick={() => { setFile(null); setAudioUrl(null); }}>Reset</Button>
          </Stack>
        </Stack>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Output</Typography>
        <Paper variant="outlined" sx={{ p: 2, minHeight: 160 }}>
          {loading && <LinearProgress sx={{ mb: 1 }} />}
          {audioUrl ? (
            <audio controls src={audioUrl} style={{ width: '100%' }} />
          ) : (
            <Typography variant="body2" color="text.secondary">Upload audio and run conversion</Typography>) }
        </Paper>
      </Grid>
    </Grid>
  );
}
