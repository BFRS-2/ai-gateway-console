import { Card, CardHeader, CardContent, Stack, Chip, Switch, FormControlLabel, Typography, Button } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import { Service } from './types';

export function ServiceCard({
  service,
  onOpen,
  onToggle,
}: {
  service: Service;
  onOpen: (svc: Service) => void;
  onToggle: (svc: Service, enabled: boolean) => void;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardHeader
        title={service.title}
        subheader={service.description}
        action={
          <FormControlLabel
            control={<Switch checked={service.enabled} onChange={(_, v) => onToggle(service, v)} />}
            label={service.enabled ? 'Enabled' : 'Disabled'}
          />
        }
      />
      <CardContent>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {service.models.slice(0, 3).map((m) => (
            <Chip key={m.id} label={m.displayName} size="small" variant="outlined" />
          ))}
          {service.models.length > 3 && <Chip size="small" label={`+${service.models.length - 3} models`} />}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Use cases: {service.useCases.join(' • ')}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button size="small" variant="contained" endIcon={<LaunchIcon />} onClick={() => onOpen(service)}>
            Open Docs
          </Button>
          <Button size="small" variant="outlined" onClick={() => onOpen(service)}>
            Samples
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
