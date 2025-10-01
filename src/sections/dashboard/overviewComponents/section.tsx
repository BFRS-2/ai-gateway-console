import { Box, Typography } from "@mui/material";

export default function Section({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="h6">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}