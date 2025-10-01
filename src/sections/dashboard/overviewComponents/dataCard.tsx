import { Card, useTheme, Typography, CardContent, Stack } from "@mui/material";

const DataCard = (props: any) => {
  const theme = useTheme();
  return (
    <Card>
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          ...props.styles.background,
        }}
      >
        <Stack>
          <Typography variant="h4" sx={props.styles.value}>
            {props.value}
          </Typography>
          <Typography variant="subtitle2" color={theme.palette.text.secondary}>
            {props.title}
          </Typography>
        </Stack>
        <img src={props.icon} alt={props.title} />
      </CardContent>
    </Card>
  );
};
// bgGradient({
//     direction: "135deg",
//     startColor: alpha(theme.palette["primary"].light, 0.2),
//     endColor: alpha(theme.palette["primary"].main, 0.2),
//   }),
export default DataCard;
