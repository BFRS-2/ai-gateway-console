"use client"

import { useMemo, useState } from 'react';
import {
  Box, Stack, Typography, TextField, MenuItem, Paper, Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/PersonAddAlt1';
import { Role } from './userManagementComponents/types';
import { useDebouncedValue } from './userManagementComponents/useDebouncedValue';
import { MOCK_USERS } from './userManagementComponents/mock';
import { UserTable } from './userManagementComponents/UserTable';

const ROLE_FILTERS: (Role | 'All')[] = ['All', 'Admin', 'Developer', 'Viewer', 'Finance', 'Compliance'];
const STATUS_FILTERS: ('All' | 'active' | 'blocked')[] = ['All', 'active', 'blocked'];

export function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | 'All'>('All');
  const [status, setStatus] = useState<'All' | 'active' | 'blocked'>('All');

  const debouncedSearch = useDebouncedValue(search, 300);

  // TODO: replace MOCK_USERS with data from API hook and move filtering server-side if desired
  const filtered = useMemo(() => {
    const text = debouncedSearch.trim().toLowerCase();
    return MOCK_USERS.filter((u) => {
      const textOk = !text || u.name.toLowerCase().includes(text) || u.email.toLowerCase().includes(text);
      const roleOk = role === 'All' || u.roles.includes(role);
      const statusOk = status === 'All' || u.status === status;
      return textOk && roleOk && statusOk;
    });
  }, [debouncedSearch, role, status]);

  return (
    <Stack spacing={2}>
      <Typography variant="h4">User Management</Typography>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            fullWidth
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} /> }}
            size="small"
          />
          <TextField
            select
            label="Role"
            size="small"
            value={role}
            onChange={(e) => setRole(e.target.value as Role | 'All')}
            sx={{ minWidth: 160 }}
          >
            {ROLE_FILTERS.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Status"
            size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            sx={{ minWidth: 160 }}
          >
            {STATUS_FILTERS.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>

          <Box flex={1} />
          <Button variant="contained" startIcon={<AddIcon />}>Invite User</Button>
        </Stack>
      </Paper>

      {/* Table */}
      <UserTable rows={filtered} />
    </Stack>
  );
}
