import { Box, IconButton, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function LabelWithHelp({
  label,
  helpText,
}: {
  label: string;
  helpText?: string;
}) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      <span>{label}</span>
      {helpText ? (
        <Tooltip title={helpText} arrow>
          <IconButton
            size="small"
            sx={{ p: 0, ml: 0.25 }}
            aria-label={`${label} info`}
          >
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}
