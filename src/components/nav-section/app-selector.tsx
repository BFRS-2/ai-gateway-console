import { useState, MouseEvent } from "react";
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

type ProjectLite = { id: string; name: string };
type OrganizationWithProjectsLite = {
  id: string;
  name: string;
  projects: ProjectLite[];
};

export default function AppSelector(props: { sx?: any }) {
  const selected = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );

  const organizationProjects = useSelector(
    (state: RootState) =>
      state.orgProject.organizationProjects as OrganizationWithProjectsLite[]
  );
  console.log("🚀 ~ AppSelector ~ organizationProjects:", organizationProjects);

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [nestedAnchorEl, setNestedAnchorEl] = useState<HTMLLIElement | null>(
    null
  );

  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<null | {
    id: string;
    name: string;
    projects: ProjectLite[];
  }>(null);

  const dispatch = useDispatch();
  const theme = useTheme();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleNestedClick = (
    event: MouseEvent<HTMLLIElement>,
    currOrg: { id: string; name: string; projects: ProjectLite[] }
  ) => {
    setSelectedOrg(currOrg);
    setProjects(currOrg.projects);
    setNestedAnchorEl(event.currentTarget as HTMLLIElement);
  };

  const handleNestedClose = (
    _e: MouseEvent<HTMLLIElement>,
    _reason: string,
    currProject?: ProjectLite
  ) => {
    if (currProject?.id && selectedOrg) {
      const payload = {
        organizationId: selectedOrg.id,
        organizationName: selectedOrg.name,
        projectId: currProject.id,
        projectName: currProject.name,
      };
      dispatch(selectOrganizationProject(payload));
      handleClose();
    }
    setNestedAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    selected?.projectId && (
      <>
        <Tooltip
          title={`Currently using project ${selected.projectName} under the organization ${selected.organizationName}`}
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
                {selected.projectId && selected.organizationId && (
                  <img
                    src={`data:image/svg+xml;utf8,${generateFromString(
                      `${selected.projectId}_${selected.organizationId}`
                    )}`}
                    alt="project avatar"
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
                      All Organizations{" "}
                      <Iconify
                        icon="solar:alt-arrow-right-line-duotone"
                        width={16}
                        style={{ verticalAlign: "middle" }}
                      />{" "}
                      {selected.organizationName}
                    </Box>
                  </Typography>
                  <Typography fontSize={14}>{selected.projectName}</Typography>
                </Stack>
              </Stack>

              {open ? (
                <Iconify icon="solar:alt-arrow-down-bold" width={16} />
              ) : (
                <Iconify icon="solar:alt-arrow-right-bold" width={16} />
              )}
            </Stack>
          </Button>
        </Tooltip>

        {/* First popover: pick Organization */}
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
              onClick={(e) => handleNestedClick(e, org)}
              sx={{ minWidth: "270px" }}
              key={org.id}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ width: "100%" }}
                alignItems="center"
              >
                {org.name}
                <span>
                  {selected?.organizationId === org.id && (
                    <Iconify
                      icon="tabler:check"
                      width={13}
                      sx={{ mr: 2, ml: 2 }}
                    />
                  )}
                  <Iconify
                    icon="solar:alt-arrow-right-line-duotone"
                    width={13}
                  />
                </span>
              </Stack>
            </MenuItem>
          ))}
        </Popover>

        {/* Second popover: pick Project within Organization */}
        <Popover
          open={Boolean(nestedAnchorEl)}
          anchorEl={nestedAnchorEl}
          onClose={(e, r) => handleNestedClose(e as any, r as any)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <Tooltip title="Select the project from the list" placement="right">
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
              Select Project
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
          {projects.map((p) => (
            <MenuItem
              key={p.id}
              onClick={(e) => handleNestedClose(e as any, "", p)}
              sx={{ minWidth: "220px" }}
            >
              <Stack
                justifyContent="space-between"
                direction="row"
                alignItems="center"
                sx={{ width: "100%" }}
              >
                {p.name}
                {selected?.projectId === p.id && (
                  <Iconify icon="tabler:check" width={13} sx={{ mr: 2 }} />
                )}
              </Stack>
            </MenuItem>
          ))}
          {projects.length === 0 && (
            <MenuItem disabled sx={{ minWidth: "220px" }}>
              No projects found
            </MenuItem>
          )}
        </Popover>
      </>
    )
  );
}
