"use client";

import type { NavSectionProps } from "src/components/nav-section";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import {
  styled,
  useTheme,
} from "@mui/material/styles";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

import { paths } from "src/routes/paths";
import { RouterLink } from "src/routes/components";

import { Logo } from "src/components/logo";

import { HeaderSection, HeaderSectionProps } from "./header-section";
import { Searchbar } from "../components/searchbar";
import { MenuButton } from "../components/menu-button";
import { SignInButton } from "../components/sign-in-button";

import AppSelector from "src/components/nav-section/app-selector";

import authService, { Organization } from "src/api/services/auth.service";
import projectService, { Project } from "src/api/services/project.service";
import organizationService from "src/api/services/organization.service";

import { OrganizationWithProjects } from "src/app/dashboard/layout";
import {
  selectOrganizationProject,
  setOrganizationProjectMapping,
} from "src/stores/slicers/orgProject";

import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState } from "src/stores/store";

import {
  generateOrganizationName,
  generateProjectName,
} from "src/utils/nameGenerator";

import AccountPopover from "../components/account-popover";
import { enqueueSnackbar } from "notistack";

// ----------------------------------------------------------------------

const StyledDivider = styled("span")(({ theme }) => ({
  width: 1,
  height: 10,
  flexShrink: 0,
  display: "none",
  position: "relative",
  alignItems: "center",
  flexDirection: "column",
  marginLeft: theme.spacing(2.5),
  marginRight: theme.spacing(2.5),
  backgroundColor: "currentColor",
  color: theme.vars.palette.divider,
  "&::before, &::after": {
    top: -5,
    width: 3,
    height: 3,
    content: '""',
    flexShrink: 0,
    borderRadius: "50%",
    position: "absolute",
    backgroundColor: "currentColor",
  },
  "&::after": { bottom: -5, top: "auto" },
}));

// ----------------------------------------------------------------------
// Persistence helpers (safe on client)
// ----------------------------------------------------------------------

type StoredSelection = {
  organizationId: string;
};

const STORAGE_KEY = "orgProject:selected";

function readStoredSelection(): StoredSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSelection) : null;
  } catch {
    return null;
  }
}

function writeStoredSelection(sel: StoredSelection) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
  } catch {
    // ignore
  }
}

// ----------------------------------------------------------------------
// Selection resolver
// ----------------------------------------------------------------------

function resolveSelection(
  orgs: OrganizationWithProjects[],
  stored: StoredSelection | null
): {
  organizationId: string;
  organizationName: string;
  projects: Project[];
} | null {
  if (!orgs.length) return null;

  if (stored?.organizationId) {
    const org = orgs.find((o) => o.id === stored.organizationId);
    if (org) {
      return {
        organizationId: org.id,
        organizationName: org.name,
        projects: org.projects ?? [],
      };
    }
  }

  const firstOrg = orgs[0];
  return {
    organizationId: firstOrg.id,
    organizationName: firstOrg.name,
    projects: firstOrg.projects ?? [],
  };
}

// ----------------------------------------------------------------------

export type HeaderBaseProps = HeaderSectionProps & {
  onOpenNav: () => void;
  data?: {
    nav?: NavSectionProps["data"];
    langs?: any;
    contacts?: any;
    workspaces?: any;
    notifications?: any;
  };
  slots?: {
    navMobile?: {
      topArea?: React.ReactNode;
      bottomArea?: React.ReactNode;
    };
  };
  slotsDisplay?: {
    signIn?: boolean;
    account?: boolean;
    helpLink?: boolean;
    settings?: boolean;
    purchase?: boolean;
    contacts?: boolean;
    searchbar?: boolean;
    workspaces?: boolean;
    menuButton?: boolean;
    localization?: boolean;
    notifications?: boolean;
  };
};

export function HeaderBase({
  sx,
  data,
  slots,
  slotProps,
  onOpenNav,
  layoutQuery,
  slotsDisplay: {
    signIn = true,
    helpLink = true,
    searchbar = true,
    menuButton = true,
  } = {},
  ...other
}: HeaderBaseProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // new dialog state
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);

  useEffect(() => {
    try {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("jwt_access_token")
          : null;
      setIsAuthenticated(Boolean(token));
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  const selected = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selected?.organizationId) {
      writeStoredSelection({
        organizationId: selected.organizationId,
      });
    }
  }, [selected?.organizationId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    authService
      .getUserInfo()
      .then((res) => {
        if (res?.success === true) {
          const user = res.data.user;
          try {
            localStorage.setItem("_user", JSON.stringify(user));
          } catch {}
        }
      })
      .catch((err) => {
        console.error("Error fetching user info:", err);
      });

    bootstrapOrgsAndProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      if (!isAuthenticated) return;
      bootstrapOrgsAndProjects();
    };

    window.addEventListener("fetch_org_project", handler as EventListener);
    return () => {
      window.removeEventListener("fetch_org_project", handler as EventListener);
    };
  }, [isAuthenticated]);

  async function bootstrapOrgsAndProjects() {
    try {
      const orgsResp = await organizationService.getAll();
      if(orgsResp.status_code === 401){
        return
      }
      const organizations: Organization[] =
        orgsResp?.data || [];
      if (!organizations.length) {
        // await createDefaultSetup();
        // return await bootstrapOrgsAndProjects();
      }
      const projsResp = await projectService.getAll();
      const projects: Project[] = projsResp?.data || [];
      if (!projects.length) {
        // await createProject(organizations[0].id);
        // return await bootstrapOrgsAndProjects();
      }

      saveOrgProject(organizations, projects);
    } catch (err) {
      console.error("Bootstrap error:", err);
    }
  }

  function mergeOrgsWithProjects(
    organizations: Organization[],
    projects: Project[]
  ): OrganizationWithProjects[] {
    const projectMap = projects.reduce<Record<string, Project[]>>(
      (acc, project) => {
        const orgId = project.organization_id;
        if (!acc[orgId]) acc[orgId] = [];
        acc[orgId].push(project);
        return acc;
      },
      {}
    );

    return organizations.map((org) => ({
      ...org,
      projects: projectMap[org.id] || [],
    }));
  }

  function saveOrgProject(orgs: Organization[], projs: Project[]) {
    const orgWithProjects: OrganizationWithProjects[] =
      mergeOrgsWithProjects(orgs, projs);

    dispatch(setOrganizationProjectMapping(orgWithProjects));

    const stored = readStoredSelection();
    const selection = resolveSelection(orgWithProjects, stored);

    if (selection) {
      dispatch(
        selectOrganizationProject({
          organizationId: selection.organizationId,
          organizationName: selection.organizationName,
          projects: selection.projects ?? [],
        })
      );

      writeStoredSelection({
        organizationId: selection.organizationId,
      });
    }
  }

  async function createProject(organizationId: string) {
    if (!organizationId) return;
    try {
      const projRes = await projectService.create({
        name: generateProjectName(),
        organization_id: organizationId,
      });
      if (projRes?.success === true) {
        // caller re-fetches
      }
    } catch (e) {
      console.error("createProject error:", e);
    }
  }

  async function createOrganization(cb?: (org: Organization) => void) {
    try {
      const orgRes = await organizationService.create({
        name: generateOrganizationName(),
      });
      if (orgRes?.success === true) {
        const org: Organization = orgRes.data.organization;
        cb?.(org);
      }
    } catch (e) {
      console.error("createOrganization error:", e);
    }
  }

  function createDefaultSetup() {
    return createOrganization((org: Organization) => {
      createProject(org.id);
    });
  }

  // new: handle create org from dialog
const handleCreateOrgFromDialog = async () => {
  if (!orgName.trim()) return;
  try {
    setCreatingOrg(true);
    const res = await organizationService.create({
      name: orgName.trim(),
    });
    if (res?.success) {
      const newOrg = res.data.organization as Organization;

      // refresh org + project mapping
      const orgsResp = await organizationService.getAll();
      const projsResp = await projectService.getAll();

      const organizations: Organization[] =
        orgsResp?.data || [];
      const projects: Project[] = projsResp?.data || [];

      const orgWithProjects = mergeOrgsWithProjects(organizations, projects);
      dispatch(setOrganizationProjectMapping(orgWithProjects));
      enqueueSnackbar("Org created", {variant : "success"})
      // find the newly created org in mapping
      const found = orgWithProjects.find((o) => o.id === newOrg.id);
      if (found) {
        dispatch(
          selectOrganizationProject({
            organizationId: found.id,
            organizationName: found.name,
            projects: found.projects ?? [],
          })
        );

        writeStoredSelection({ organizationId: found.id });
      }
    }
    else{
        enqueueSnackbar(res.error.payload.message, {variant : "error"})
    }

    setOrgDialogOpen(false);
    setOrgName("");
  } catch (err) {
    console.log("🚀 ~ handleCreateOrgFromDialog ~ err:", err)
    enqueueSnackbar(err.payload.message, {variant : "error"})
    console.error("create organization (manual) error:", err);
  } finally {
    setCreatingOrg(false);
  }
};

  return (
    <>
      <HeaderSection
        sx={sx}
        layoutQuery={layoutQuery}
        slots={{
          ...slots,
          leftAreaStart: slots?.leftAreaStart,
          leftArea: (
            <>
              {slots?.leftAreaStart}

              {menuButton && (
                <MenuButton
                  data-slot="menu-button"
                  onClick={onOpenNav}
                  sx={{
                    mr: 1,
                    ml: -1,
                    [theme.breakpoints.up(layoutQuery)]: {
                      display: "none",
                    },
                  }}
                />
              )}

              <Logo data-slot="logo" />

              <StyledDivider data-slot="divider" />

              {/* Org selector */}
              <AppSelector />

              {/* Create org button */}
              {isAuthenticated && <Button
                size="small"
                variant="outlined"
                color="primary"
                sx={{ ml: 1 }}
                onClick={() => setOrgDialogOpen(true)}

              >
                Create organization
              </Button>}

              {slots?.leftAreaEnd}
            </>
          ),
          rightArea: (
            <>
              {slots?.rightAreaStart}

              <Box
                data-area="right"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.5 },
                }}
              >
                {helpLink && isAuthenticated  && (
                  <Link
                    data-slot="help-link"
                    href={paths.faqs}
                    component={RouterLink}
                    color="inherit"
                    sx={{ typography: "subtitle2" }}
                  >
                    Need help?
                  </Link>
                )}

                {searchbar && (
                  <Searchbar data-slot="searchbar" data={data?.nav} />
                )}

               { isAuthenticated  && <AccountPopover />}

                {signIn && <SignInButton />}
              </Box>

              {slots?.rightAreaEnd}
            </>
          ),
        }}
        slotProps={slotProps}
        {...other}
      />

      {/* create org modal */}
      <Dialog
        open={orgDialogOpen}
        onClose={() => !creatingOrg && setOrgDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Create organization</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Organization name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOrgDialogOpen(false)}
            disabled={creatingOrg}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateOrgFromDialog}
            variant="contained"
            disabled={creatingOrg}
          >
            {creatingOrg ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
