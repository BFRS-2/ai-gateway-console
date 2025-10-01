// src/sections/services/ServicesCatalog.tsx
import { useState } from 'react';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Chip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { ServiceDetailsDrawer } from '../projectManagementComponents/serviceDetailDrawer';
import { ServiceConfig } from '../projectManagementComponents/types';

export type ServiceKind = 'ocr' | 'summarization' | 'embeddings' | 'voice' | 'chatbot';

export type Service = {
  id: string;
  name: string;
  kind: ServiceKind;
  status: 'active' | 'paused';
  currentModel?: string;
  models?: string[];               // <- dropdown options
  docs?: {                         // <- docs/samples/specs
    description?: string;
    usageNotes?: string[];
    endpoints?: Array<{ title: string; path: string; method: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'; }>;
    codeSamples?: {
      node?: string;
      python?: string;
      curl?: string;
    };
  };
  useCases?: string[];
};

const MOCK: Service[] = [
  {
    id: 's1',
    name: 'OCR',
    kind: 'ocr',
    status: 'active',
    currentModel: 'ocr-paddle-v2',
    models: ['ocr-paddle-v2', 'ocr-vision-pro', 'ocr-fast-lite'],
    useCases: ['Invoice parsing', 'KYC extraction', 'Receipt OCR'],
    docs: {
      description: 'High-accuracy text extraction from images and PDFs.',
      usageNotes: ['Supports PNG, JPG, PDF (<= 10MB).', 'Multi-language with auto-detect.'],
      endpoints: [{ title: 'Extract Text', path: '/v1/ocr/extract', method: 'POST' }],
      codeSamples: {
        curl: `curl -X POST "$BASE_URL/v1/ocr/extract" \\
  -H "Authorization: Bearer $API_KEY" \\
  -F "file=@/path/invoice.jpg"`,
        node: `import fetch from 'node-fetch';
const form = new FormData();
form.append('file', fs.createReadStream('invoice.jpg'));
const res = await fetch(\`\${BASE_URL}/v1/ocr/extract\`, {
  method: 'POST',
  headers: { Authorization: \`Bearer \${API_KEY}\` },
  body: form
});
console.log(await res.json());`,
        python: `import requests
files = {'file': open('invoice.jpg','rb')}
r = requests.post(f"{BASE_URL}/v1/ocr/extract", headers={"Authorization": f"Bearer {API_KEY}"}, files=files)
print(r.json())`,
      },
    },
  },
  {
    id: 's2',
    name: 'Summarization',
    kind: 'summarization',
    status: 'active',
    currentModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'claude-3.5-haiku', 'gemini-1.5-flash'],
    useCases: ['Ticket summary', 'Long email TL;DR', 'RCA briefs'],
    docs: {
      description: 'Abstractive summarization tuned for support and RCA.',
      usageNotes: ['Max 50k tokens input with auto-chunking.', 'JSON schema outputs supported.'],
      endpoints: [{ title: 'Summarize', path: '/v1/summarize', method: 'POST' }],
      codeSamples: {
        curl: `curl -X POST "$BASE_URL/v1/summarize" -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"<long text>", "model":"gpt-4o-mini", "tone":"neutral"}'`,
        node: `const res = await fetch(\`\${BASE_URL}/v1/summarize\`, {
  method: 'POST',
  headers: { 'Authorization': \`Bearer \${API_KEY}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, model: 'gpt-4o-mini', tone: 'neutral' })
});
console.log(await res.json());`,
        python: `import requests, json
payload = {"text": text, "model":"gpt-4o-mini", "tone":"neutral"}
r = requests.post(f"{BASE_URL}/v1/summarize", headers={"Authorization": f"Bearer {API_KEY}", "Content-Type":"application/json"}, data=json.dumps(payload))
print(r.json())`,
      },
    },
  },
];

export function ServicesCatalog() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ServiceConfig | null>(null);

  return (
    <>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Kind</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Model</TableCell>
                <TableCell align="right">Docs</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {MOCK.map(s => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.kind}</TableCell>
                  <TableCell>
                    <Chip size="small" label={s.status} color={s.status === 'active' ? 'success' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell>{s.currentModel ?? '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelected({
                          ...s,
                          onUpdate: () => {}, // Provide a no-op or actual handler as needed
                        });
                        setOpen(true);
                      }}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {MOCK.length === 0 && (
                <TableRow><TableCell colSpan={5}>No services</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Keyed child => guarantees fresh body each selection */}
      <ServiceDetailsDrawer
        key={selected?.id ?? '__none__'}
        open={open}
        onClose={() => setOpen(false)}
        service={selected}
      />
    </>
  );
}
