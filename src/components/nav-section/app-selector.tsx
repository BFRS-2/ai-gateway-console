import { useState } from "react";
import { generateFromString } from "generate-avatar";
import { useSelector, useDispatch } from "react-redux";
import {
  Stack,
  Button,
  Popover,
  MenuItem,
  useTheme,
  Typography,
  Divider,
  Tooltip,
  Box,
} from "@mui/material";

import { RootState } from "src/stores/store";
import { Iconify } from "../iconify";
import { selectOrganizationProject } from "src/stores/slicers/orgProject";
import { Project } from "src/sections/dashboard/projectManagementComponents/types";
import { OrganizationWithProjects } from "src/app/dashboard/layout";

export default function AppSelector(props: { sx?: any }) {
  const selected = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );
  console.log("🚀 ~ AppSelector ~ selected:", selected)

  const organizationProjects = useSelector(
    (state: RootState) =>
      state.orgProject.organizationProjects as OrganizationWithProjects[]
  );

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const dispatch = useDispatch();
  const theme = useTheme();

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleOrgSelect = (org: OrganizationWithProjects) => {
    // dispatch org + its projects
    const payload = {
      organizationId: org.id,
      organizationName: org.name,
      // no projectId/projectName because we are NOT selecting project here
      projects: org.projects || [],
    };
    dispatch(selectOrganizationProject(payload));
    handleClose();
  };

  // in case nothing is selected yet, you can early-return null
  if (!selected?.organizationId) return null;

  // const projectsCount =
  //   Array.isArray(selected.projects) ? selected.projects.length : 0;

  return (
    <>
      <Tooltip
        title={`Currently using organization ${selected.organizationName}`}
      >
        <Button
          onClick={handleClick}
          variant="outlined"
          sx={{ minWidth: "200px", height: "auto", ...props.sx }}
          className="appSelectorBtn"
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            sx={{ width: "100%" }}
          >
            <Stack direction="row" gap={1} alignItems="center">
              {selected.organizationId && (
                <img
                    // generate avatar from org id
                  src={`data:image/svg+xml;utf8,${generateFromString(
                    `${selected.organizationId}`
                  )}`}
                  alt="organization avatar"
                  height="30px"
                  style={{ borderRadius: "5px" }}
                />
              )}
              <Stack alignItems="flex-start">
                <Typography
                  fontSize={12}
                  variant="body2"
                  color={theme.palette.grey[500]}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    maxWidth: "200px",
                  }}
                >
                  <Box
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flexGrow: 1,
                    }}
                  >
                    {selected.organizationName}
                  </Box>
                  {open ? (
              <Iconify icon="solar:alt-arrow-down-bold" width={16} />
            ) : (
              <Iconify icon="solar:alt-arrow-right-bold" width={16} />
            )}
                </Typography>
              </Stack>
            </Stack>

            
          </Stack>
        </Button>
      </Tooltip>

      {/* Popover: pick Organization */}
      <Popover
        open={open}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        anchorEl={anchorEl}
        onClose={handleClose}
      >
        <Tooltip title="Select the organization from here." placement="right">
          <Typography
            sx={{
              p: 1,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              cursor: "info",
            }}
            variant="body2"
          >
            Select Organization
            <span>
              <Iconify
                icon="solar:info-circle-line-duotone"
                width="24"
                height="24"
              />
            </span>
          </Typography>
        </Tooltip>
        <Divider sx={{ mb: 1 }} />
        {organizationProjects.map((org) => (
          <MenuItem
            onClick={() => handleOrgSelect(org)}
            sx={{ minWidth: "270px" }}
            key={org.id}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ width: "100%" }}
              alignItems="center"
            >
              <Box>
                {org.name}
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: "text.secondary" }}
                >
                  {org.projects?.length
                    ? `${org.projects.length} project${
                        org.projects.length > 1 ? "s" : ""
                      }`
                    : "No projects"}
                </Typography>
              </Box>
              <span>
                {selected?.organizationId === org.id && (
                  <Iconify
                    icon="tabler:check"
                    width={13}
                    sx={{ mr: 2, ml: 2 }}
                  />
                )}
              </span>
            </Stack>
          </MenuItem>
        ))}
      </Popover>
    </>
  );
}
