import { Card, Grid, TextField, Typography, Stack } from "@mui/material";
import LabelWithHelp from "./LabelWithHelp";
import { BuilderConfig } from "../types";

export default function AgentNodeStep({
  config,
  onChange,
}: {
  config: BuilderConfig;
  onChange: (updater: (prev: BuilderConfig) => BuilderConfig) => void;
}) {
  return (
    <Card sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Basic Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Define the system prompt and execution limits for your agent.
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Agent name"
              value={config.agent.name}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  agent: { ...prev.agent, name: e.target.value },
                }))
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label={
                <LabelWithHelp
                  label="Max Execution Step"
                  helpText="Maximum number of reasoning/tool steps the agent can take before stopping."
                />
              }
              type="number"
              value={config.agent.maxSteps}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  agent: { ...prev.agent, maxSteps: Number(e.target.value) },
                }))
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="System prompt"
              value={config.agent.systemPrompt}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  agent: { ...prev.agent, systemPrompt: e.target.value },
                }))
              }
              fullWidth
              multiline
              minRows={4}
            />
          </Grid>
        </Grid>
      </Stack>
    </Card>
  );
}
