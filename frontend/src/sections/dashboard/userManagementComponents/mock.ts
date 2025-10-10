import { User, TeamLite, ProjectLite } from './types';

export const MOCK_TEAMS: TeamLite[] = [
  { id: 't1', name: 'Trends' },
  { id: 't2', name: 'Copilot' },
  { id: 't3', name: 'API Platform' },
];

export const MOCK_PROJECTS: ProjectLite[] = [
  { id: 'p1', name: 'AOV Insights', teamId: 't1' },
  { id: 'p2', name: 'Seller Care Voice', teamId: 't2' },
  { id: 'p3', name: 'Dockyard', teamId: 't3' },
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Ashish Gupta',
    email: 'ashish@shiprocket.com',
    roles: ['Admin', 'Developer'],
    status: 'active',
    lastActiveAt: '2025-09-30 10:05',
    accesses: [{ type: 'project', id: 'p3', name: 'Dockyard' }, { type: 'team', id: 't1', name: 'Trends' }],
  },
  {
    id: 'u2',
    name: 'Priya Sharma',
    email: 'priya@shiprocket.com',
    roles: ['Developer'],
    status: 'active',
    lastActiveAt: '2025-09-29 18:40',
    accesses: [{ type: 'project', id: 'p1', name: 'AOV Insights' }],
  },
  {
    id: 'u3',
    name: 'Rahul Verma',
    email: 'rahul@shiprocket.com',
    roles: ['Viewer', 'Compliance'],
    status: 'blocked',
    lastActiveAt: '2025-09-26 11:16',
    accesses: [{ type: 'team', id: 't2', name: 'Copilot' }],
  },
];
