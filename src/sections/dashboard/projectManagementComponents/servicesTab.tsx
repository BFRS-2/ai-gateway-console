"use client";

import { Box } from "@mui/material";
import { ServicesPage } from "../serviceComponents/ServicesPage";

export function ServicesTab({ projectId }: { projectId: string }) {
  return (
    <Box sx={{ p: 2 }}>
      <ServicesPage projectId={projectId} />
    </Box>
  );
}
