"use client"

import { useMemo, useState } from 'react';
import {
  Box, Grid, Stack, Typography, TextField, MenuItem, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Service, ServiceKind } from './types';
import { SERVICES } from './mock';
import { ServiceCard } from './ServiceCard';
import ServiceDetailsDialog from './ServiceDetailsDrawer';

const KIND_FILTER: ('All' | ServiceKind)[] = ['All', 'ocr', 'summarization', 'embeddings', 'voice', 'chatbot'];
const STATUS_FILTER: ('All' | 'enabled' | 'disabled')[] = ['All', 'enabled', 'disabled'];

export function ServicesPage() {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<'All' | ServiceKind>('All');
  const [status, setStatus] = useState<'All' | 'enabled' | 'disabled'>('All');

  const [drawer, setDrawer] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>(SERVICES);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return services.filter((svc) => {
      const textOk = !s || svc.title.toLowerCase().includes(s) || svc.description.toLowerCase().includes(s);
      const kindOk = kind === 'All' || svc.kind === kind;
      const statusOk = status === 'All' || (status === 'enabled' ? svc.enabled : !svc.enabled);
      return textOk && kindOk && statusOk;
    });
  }, [services, search, kind, status]);

  const onToggle = (svc: Service, enabled: boolean) => {
    setServices((prev) => prev.map((s) => (s.id === svc.id ? { ...s, enabled } : s)));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Services</Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            fullWidth
            placeholder="Search services"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} /> }}
          />
          <TextField select size="small" label="Kind" value={kind} onChange={(e) => setKind(e.target.value as any)} sx={{ minWidth: 200 }}>
            {KIND_FILTER.map((k) => (
              <MenuItem key={k} value={k}>{k}</MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value as any)} sx={{ minWidth: 200 }}>
            {STATUS_FILTER.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {filtered.map((svc) => (
          <Grid item xs={12} sm={6} lg={4} key={svc.id}>
            <ServiceCard
              service={svc}
              onOpen={(s) => setDrawer(s)}
              onToggle={onToggle}
            />
          </Grid>
        ))}
        {filtered.length === 0 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="body2" color="text.secondary">No services found</Typography>
          </Box>
        )}
      </Grid>

      <ServiceDetailsDialog
        open={!!drawer}
        onClose={() => setDrawer(null)}
        service={drawer as any}
        // onEnableChange={onToggle as any}
      />
    </Stack>
  );
}
