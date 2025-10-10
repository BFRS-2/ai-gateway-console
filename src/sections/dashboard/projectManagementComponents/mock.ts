import { Team, ServiceConfig } from './types';

const mkService = (p: Partial<ServiceConfig>): ServiceConfig => ({
  id: crypto.randomUUID(),
  kind: 'chatbot',
  name: 'Chatbot',
  status: 'active',
  metrics: { calls30d: 0, costINR30d: 0 },
  onUpdate: () => {},
  ...p,
});

export const MOCK_TEAMS: Team[] = [
  {
    id: 't1',
    name: 'Trends',
    projects: [
      {
        id: 'p1',
        name: 'AOV Insights',
        teamId: 't1',
        status: 'active',
        owners: ['a@shiprocket.com'],
        budgetINR: 200000,
        spendINR30d: 82000,
        services: [
          mkService({ kind: 'embeddings', name: 'Embeddings', model: 'text-embedding-3-large', metrics:{ calls30d: 420, costINR30d: 12000 }}),
          mkService({ kind: 'summarization', name: 'Summarizer', model: 'gpt-4o-mini', metrics:{ calls30d: 2600, costINR30d: 38000, p95ms: 850 }}),
        ],
        members: [
          { id: 'u1', name: 'Ashish Gupta', email: 'ashish@shiprocket.com', role: 'Admin', lastActiveAt: '2025-09-30 10:05' },
          { id: 'u2', name: 'Priya', email: 'priya@shiprocket.com', role: 'Developer' },
        ],
        activity: [
          { id: 'a1', ts: '2025-09-30 09:40', actor: 'Ashish', entity: 'service', action: 'updated config', detail: 'Summarizer temperature 0.2 → 0.1' },
          { id: 'a2', ts: '2025-09-29 19:10', actor: 'Priya', entity: 'document', action: 'added doc', detail: 'cities_kpi.csv' },
        ],
        documents: [
          { id: 'd1', name: 'Policies.pdf', type: 'pdf', sizeKB: 2400, updatedAt: '2025-09-29 14:11', ragAttached: true },
          { id: 'd2', name: 'cities_kpi.csv', type: 'csv', sizeKB: 820, updatedAt: '2025-09-29 19:09', ragAttached: true },
        ],
      },
    ],
  },
  {
    id: 't2',
    name: 'Copilot',
    projects: [
      {
        id: 'p2',
        name: 'Seller Care Voice',
        teamId: 't2',
        status: 'active',
        owners: ['copilot@shiprocket.com'],
        budgetINR: 350000,
        spendINR30d: 168000,
        services: [
          mkService({ kind: 'voice', name: 'Voice Model', model: 'gpt-4o-realtime', metrics:{ calls30d: 1800, costINR30d: 99000, p95ms: 240 } }),
          mkService({ kind: 'chatbot', name: 'Chatbot', model: 'claude-3.5', metrics:{ calls30d: 5300, costINR30d: 54000, p95ms: 780 } }),
          mkService({ kind: 'ocr', name: 'OCR', language: 'en', metrics:{ calls30d: 370, costINR30d: 4000 } }),
        ],
        members: [
          { id: 'u3', name: 'Rahul', email: 'rahul@shiprocket.com', role: 'Admin' },
          { id: 'u4', name: 'Anita', email: 'anita@shiprocket.com', role: 'Viewer' },
        ],
        activity: [
          { id: 'a3', ts: '2025-09-30 08:20', actor: 'Rahul', entity: 'service', action: 'ran OCR batch', detail: '82 receipts' },
        ],
        documents: [
          { id: 'd3', name: 'voice_prompts.md', type: 'doc', updatedAt: '2025-09-28 12:40', ragAttached: false },
        ],
      },
    ],
  },
];

export const findTeamById = (id: string) => MOCK_TEAMS.find(t => t.id === id);
export const findProjectById = (teamId: string, projectId: string) =>
  findTeamById(teamId)?.projects.find(p => p.id === projectId);
