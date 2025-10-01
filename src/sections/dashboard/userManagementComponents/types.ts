export type Role = 'Admin' | 'Developer' | 'Viewer' | 'Finance' | 'Compliance';

export type AccessRef = {
  type: 'team' | 'project';
  id: string;
  name: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  roles: Role[];        // <-- roles array
  status: 'active' | 'blocked';
  lastActiveAt?: string;
  accesses: AccessRef[]; // teams/projects this user has access to
};

export type TeamLite = { id: string; name: string };
export type ProjectLite = { id: string; name: string; teamId: string };
