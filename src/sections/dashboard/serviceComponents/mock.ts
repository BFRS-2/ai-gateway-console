import { Service } from './types';

const JS_FETCH = (service: string) => `// JavaScript (fetch)
const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_BASE}/v1/${service}\`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Dockyard-Key': process.env.NEXT_PUBLIC_DOCKYARD_KEY!,
  },
  body: JSON.stringify({
    input: "your input here",
    options: { model: "gpt-4o-mini" }
  })
});
const data = await res.json();
console.log(data);`;

const TS_AXIOS = (service: string) => `// TypeScript (axios)
import axios from "axios";

type Payload = {
  input: string;
  options?: { model?: string; [k: string]: any };
};

const payload: Payload = {
  input: "your input here",
  options: { model: "gpt-4o-mini" }
};

const { data } = await axios.post(
  \`\${import.meta.env.VITE_API_BASE}/v1/${service}\`,
  payload,
  { headers: { "X-Dockyard-Key": import.meta.env.VITE_DOCKYARD_KEY } }
);
console.log(data);`;

const PY_REQUESTS = (service: string) => `# Python (requests)
import os, requests

payload = {
  "input": "your input here",
  "options": { "model": "gpt-4o-mini" }
}

r = requests.post(
  f"{os.environ['API_BASE']}/v1/${service}",
  json=payload,
  headers={ "X-Dockyard-Key": os.environ['DOCKYARD_KEY'] }
)
print(r.json())`;

const CURL = (service: string) => `curl -X POST "$API_BASE/v1/${service}" \\
  -H "Content-Type: application/json" \\
  -H "X-Dockyard-Key: $DOCKYARD_KEY" \\
  -d '{
    "input": "your input here",
    "options": { "model": "gpt-4o-mini" }
  }'`;

export const SERVICES: Service[] = [
  {
    id: 'svc_ocr',
    kind: 'ocr',
    title: 'OCR',
    description: 'High-accuracy OCR for receipts, invoices, PDFs & images.',
    enabled: true,
    models: [
      { id: 'ocr-vision-pro', displayName: 'OCR Vision Pro', provider: 'internal', tier: 'pro', notes: 'Best for invoices/POs.' },
      { id: 'gemini-1.5-pro-vision', displayName: 'Gemini 1.5 Pro (Vision)', provider: 'google', tier: 'pro' },
    ],
    useCases: [
      'Invoice extraction (total, taxes, line items)',
      'KYC document parsing',
      'Receipt and label scanning',
    ],
    doc: {
      markdown: `### OCR Quickstart
Send an image URL or base64 data. For PDFs, multi-page is supported with batch output.

**Request shape**
\`\`\`json
{ "input": "<image-url-or-base64>", "options": { "model": "ocr-vision-pro", "lang": "en" } }
\`\`\``,
      sampleCurl: CURL('ocr'),
      samples: {
        javascript: JS_FETCH('ocr'),
        typescript: TS_AXIOS('ocr'),
        python: PY_REQUESTS('ocr'),
        curl: CURL('ocr'),
      }
    }
  },
  {
    id: 'svc_sum',
    kind: 'summarization',
    title: 'Summarization',
    description: 'Fast abstractive summarization with optional style controls.',
    enabled: true,
    models: [
      { id: 'gpt-4o-mini', displayName: 'GPT-4o Mini', provider: 'openai', tier: 'standard' },
      { id: 'claude-3.5-sonnet', displayName: 'Claude 3.5 Sonnet', provider: 'anthropic', tier: 'pro' },
    ],
    useCases: [
      'Meeting notes → exec summary',
      'Ticket threads → TL;DR',
      'Policy docs → concise bullets',
    ],
    doc: {
      markdown: `### Summarization Quickstart
Pass raw text or URLs; control tone/length via options.

**Request**
\`\`\`json
{ "input": "long text...", "options": { "model": "gpt-4o-mini", "tone": "formal", "length": "short" } }
\`\`\``,
      sampleCurl: CURL('summarize'),
      samples: {
        javascript: JS_FETCH('summarize'),
        typescript: TS_AXIOS('summarize'),
        python: PY_REQUESTS('summarize'),
        curl: CURL('summarize'),
      }
    }
  },
  {
    id: 'svc_embed',
    kind: 'embeddings',
    title: 'Embeddings',
    description: 'High-dimension embeddings for search & RAG.',
    enabled: true,
    models: [
      { id: 'text-embedding-3-large', displayName: 'text-embedding-3-large', provider: 'openai', tier: 'pro', context: 'N/A', notes: 'Best for RAG corpora.' },
      { id: 'embed-english-v3', displayName: 'Cohere embed-english-v3', provider: 'cohere', tier: 'standard' },
    ],
    useCases: [
      'RAG indexing',
      'Semantic search',
      'Deduplication & clustering',
    ],
    doc: {
      markdown: `### Embeddings Quickstart
Send an array of strings. You’ll receive vectors back.

**Request**
\`\`\`json
{ "input": ["doc1", "doc2"], "options": { "model": "text-embedding-3-large" } }
\`\`\``,
      sampleCurl: CURL('embeddings'),
      samples: {
        javascript: JS_FETCH('embeddings'),
        typescript: TS_AXIOS('embeddings'),
        python: PY_REQUESTS('embeddings'),
        curl: CURL('embeddings'),
      }
    }
  },
  {
    id: 'svc_voice',
    kind: 'voice',
    title: 'Voice Models',
    description: 'Realtime voice (TTS/STT) with interruption support.',
    enabled: true,
    models: [
      { id: 'gpt-4o-realtime-preview', displayName: 'gpt-4o-realtime-preview', provider: 'openai', tier: 'realtime' },
    ],
    useCases: [
      'Seller Care voice bot',
      'IVR bridge',
      'Voice notes summarization',
    ],
    doc: {
      markdown: `### Voice Quickstart
WebSocket or WebRTC session. Send audio frames; receive transcripts + TTS.

**HTTP bootstrap**
\`\`\`json
{ "input": "start", "options": { "model": "gpt-4o-realtime-preview" } }
\`\`\``,
      sampleCurl: CURL('voice/session'),
      samples: {
        javascript: JS_FETCH('voice/session'),
        typescript: TS_AXIOS('voice/session'),
        python: PY_REQUESTS('voice/session'),
        curl: CURL('voice/session'),
      }
    }
  },
  {
    id: 'svc_chat',
    kind: 'chatbot',
    title: 'Chatbot',
    description: 'Unified chat with tools & multi-RAG routing.',
    enabled: true,
    models: [
      { id: 'gpt-4o', displayName: 'GPT-4o', provider: 'openai', tier: 'pro' },
      { id: 'claude-3.5-sonnet', displayName: 'Claude 3.5 Sonnet', provider: 'anthropic', tier: 'pro' },
      { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', provider: 'google', tier: 'pro' },
    ],
    useCases: [
      'Policies Q&A',
      'Order support',
      'Internal copilots',
    ],
    doc: {
      markdown: `### Chatbot Quickstart
Send a messages array; optionally attach tools and RAG ids.

**Request**
\`\`\`json
{
  "input": [{ "role": "user", "content": "Hello!" }],
  "options": { "model": "gpt-4o", "rags": ["policy_rag", "support_kb"] }
}
\`\`\``,
      sampleCurl: CURL('chat'),
      samples: {
        javascript: JS_FETCH('chat'),
        typescript: TS_AXIOS('chat'),
        python: PY_REQUESTS('chat'),
        curl: CURL('chat'),
      }
    }
  }
];
