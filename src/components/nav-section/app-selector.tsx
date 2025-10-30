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
import { selectProject } from "src/stores/slicers/orgProject";
import { Iconify } from "../iconify";


export default function AppSelector(props: { sx?: any }) {
  const selectedProjectApp: null | {
    projectName: string;
    projectId: string;
    appId: string;
    appName: string;
  } = useSelector((state: RootState) => state.projectApp.selectedProjectApp);

  const projectAppMapping = useSelector(
    (state: RootState) => state.projectApp.projectApp
  );

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [nestedAnchorEl, setNestedAnchorEl] = useState<
    (EventTarget & HTMLLIElement) | null
  >(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // gaService.projectWidgetClick();
    setAnchorEl(event.currentTarget);
  };
  const [apps, setApps] = useState<{ id: string; name: string }[]>([]);

  const handleClose = () => {
    setAnchorEl(null);
  };
  const [selectedProject, setSelectedProject] = useState<null | {
    id: string;
    name: string;
    apps: { id: string; name: string }[];
  }>(null);
  const handleNestedClick = (
    event: MouseEvent<HTMLLIElement, MouseEvent>,
    currProject: {
      id: string;
      name: string;
      apps: { id: string; name: string }[];
    }
  ) => {
    setSelectedProject(currProject);
    setApps(currProject.apps);
    setNestedAnchorEl(event.currentTarget);
  };
  const dispatch = useDispatch();

  const handleNestedClose = (
    e: MouseEvent<HTMLLIElement, globalThis.MouseEvent>,
    resason: string,
    currApp?: { id: string; name: string }
  ) => {
    if (currApp?.id) {
      const currSelectedProjectApp = {
        projectId: selectedProject?.id,
        projectName: selectedProject?.name,
        appId: currApp.id,
        appName: currApp.name,
      };

      dispatch(selectProject(currSelectedProjectApp));
      handleClose();
    }

    setNestedAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const theme = useTheme();

  return (
    selectedProjectApp?.appId && (
      <>
        <Tooltip
          title={`Currently using app ${selectedProjectApp?.appName} under the project ${selectedProjectApp?.projectName}`}
        >
          <Button
            onClick={handleClick}
            variant="outlined"
            sx={{
              minWidth: "200px",
              height: "auto",
              ...props.sx,
              // maxWidth:"250px"
            }}
            className={`appSelectorBtn`}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="baseline"
              sx={{
                width: "100%",
              }}
            >
              <Stack direction="row" gap={1} alignItems="center">
                {selectedProjectApp?.appId && selectedProjectApp?.projectId && (
                  <img
                    src={`data:image/svg+xml;utf8,${generateFromString(
                      `${selectedProjectApp?.appId}_${selectedProjectApp?.projectId}`
                    )}`}
                    alt="app avatar"
                    height="30px"
                    style={{
                      borderRadius: "5px",
                    }}
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
                      All Projects{" "}
                      <Iconify
                        icon="solar:alt-arrow-right-line-duotone"
                        width={16}
                        style={{
                          verticalAlign: "middle", // Ensures icon aligns with the text
                        }}
                      />{" "}
                      {selectedProjectApp?.projectName}
                    </Box>
                  </Typography>
                  <Typography fontSize={14}>
                    {selectedProjectApp?.appName}
                  </Typography>
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

        <Popover
          open={open}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          anchorEl={anchorEl}
          onClose={handleClose}
        >
          <Tooltip title="Select the project from here." placement="right">
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
          <Divider
            sx={{
              mb: 1,
            }}
          ></Divider>
          {projectAppMapping.map(
            (projects: {
              id: string;
              name: string;
              apps: { id: string; name: string }[];
            }) => (
              <MenuItem
                onClick={(e) => handleNestedClick(e as any, projects)}
                sx={{
                  minWidth: "270px",
                }}
                key={projects.id}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{
                    width: "100%",
                  }}
                  alignItems="center"
                >
                  {" "}
                  {projects.name}{" "}
                  <span>
                    {selectedProjectApp?.projectId == projects.id && (
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
            )
          )}
        </Popover>
        <Popover
          open={Boolean(nestedAnchorEl)}
          anchorEl={nestedAnchorEl}
          onClose={(
            e: MouseEvent<HTMLLIElement, globalThis.MouseEvent>,
            r: string
          ) => handleNestedClose(e, r)}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <Tooltip title="Select the app from the list" placement="right">
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
              Select Apps
              <span>
                <Iconify
                  icon="solar:info-circle-line-duotone"
                  width="24"
                  height="24"
                />
              </span>
            </Typography>
          </Tooltip>
          <Divider
            sx={{
              mb: 1,
            }}
          ></Divider>
          {apps.map((items: { id: string; name: string }) => (
            <MenuItem
              key={items.id}
              onClick={(e: MouseEvent<HTMLLIElement, globalThis.MouseEvent>) =>
                handleNestedClose(e, "", items)
              }
              sx={{
                minWidth: "220px",
              }}
            >
              <Stack
                justifyContent={"space-between"}
                direction={"row"}
                alignItems={"center"}
                sx={{
                  width: "100%",
                }}
              >
                {items.name}

                {selectedProjectApp?.appId == items.id && (
                  <Iconify icon="tabler:check" width={13} sx={{ mr: 2 }} />
                )}
              </Stack>
            </MenuItem>
          ))}
        </Popover>
      </>
    )
  );
}
