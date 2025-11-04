"use client";

import type { NavSectionProps } from "src/components/nav-section";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { styled, useTheme } from "@mui/material/styles";

import { paths } from "src/routes/paths";
import { RouterLink } from "src/routes/components";

import { Logo } from "src/components/logo";

import { HeaderSection } from "./header-section";
import { Searchbar } from "../components/searchbar";
import { MenuButton } from "../components/menu-button";
import { SignInButton } from "../components/sign-in-button";
// import { AccountDrawer } from "../components/account-drawer";
import { SettingsButton } from "../components/settings-button";
// import { LanguagePopover } from "../components/language-popover";
// import { ContactsPopover } from "../components/contacts-popover";
// import { WorkspacesPopover } from "../components/workspaces-popover";
// import { NotificationsDrawer } from "../components/notifications-drawer";

import type { HeaderSectionProps } from "./header-section";
// import type { AccountDrawerProps } from "../components/account-drawer";
import type { ContactsPopoverProps } from "../components/contacts-popover";
import type { LanguagePopoverProps } from "../components/language-popover";
import type { WorkspacesPopoverProps } from "../components/workspaces-popover";
import type { NotificationsDrawerProps } from "../components/notifications-drawer";

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
import { useEffect, useMemo, useState } from "react";
import { RootState } from "src/stores/store";

import {
  generateOrganizationName,
  generateProjectName,
} from "src/utils/nameGenerator";

import AccountPopover from "../components/account-popover";

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
  projectId: string; // may be "" if none
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
    // ignore quota/availability errors
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
  projectId: string;
  projectName: string;
} | null {
  if (!orgs.length) return null;

  // 1) Try previous stored selection if still valid
  if (stored?.organizationId) {
    const org = orgs.find((o) => o.id === stored.organizationId);
    if (org) {
      const proj =
        (stored.projectId &&
          org.projects?.find((p) => p.id === stored.projectId)) ||
        org.projects?.[0];

      return {
        organizationId: org.id,
        organizationName: org.name,
        projectId: proj?.id ?? "",
        projectName: proj?.name ?? "",
      };
    }
  }

  // 2) Fallback to first org (and its first project)
  const firstOrg = orgs[0];
  const firstProj = firstOrg.projects?.[0];

  return {
    organizationId: firstOrg.id,
    organizationName: firstOrg.name,
    projectId: firstProj?.id ?? "",
    projectName: firstProj?.name ?? "",
  };
}

// ----------------------------------------------------------------------

export type HeaderBaseProps = HeaderSectionProps & {
  onOpenNav: () => void;
  data?: {
    nav?: NavSectionProps["data"];
    // account?: AccountDrawerProps["data"];
    langs?: LanguagePopoverProps["data"];
    contacts?: ContactsPopoverProps["data"];
    workspaces?: WorkspacesPopoverProps["data"];
    notifications?: NotificationsDrawerProps["data"];
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
    account = true,
    helpLink = true,
    settings = true,
    purchase = true,
    contacts = true,
    searchbar = true,
    workspaces = true,
    menuButton = true,
    localization = true,
    notifications = true,
  } = {},
  ...other
}: HeaderBaseProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
   useEffect(() => {
    // runs only on client
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

  // keep localStorage in sync when user changes selection anywhere (e.g., AppSelector)
  const selected = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selected?.organizationId) {
      writeStoredSelection({
        organizationId: selected.organizationId,
        projectId: selected.projectId ?? "",
      });
    }
  }, [selected?.organizationId, selected?.projectId]);

  // On mount (if authed): fetch orgs+projects, create defaults if needed, then map and select
  useEffect(() => {
    if (!isAuthenticated) return;

    // hydrate user info (optional)
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

    // main bootstrap flow
    bootstrapOrgsAndProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ------------------------------
  // Data plumbing
  // ------------------------------

  // Event listener to allow external parts of the app to trigger a refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (ev: Event) => {
      // Only run when authenticated
      if (!isAuthenticated) return;
      try {
        bootstrapOrgsAndProjects();
      } catch (err) {
        console.error("fetch_org_project handler error:", err);
      }
    };

    window.addEventListener("fetch_org_project", handler as EventListener);
    return () => {
      window.removeEventListener("fetch_org_project", handler as EventListener);
    };
  }, [isAuthenticated]);


  async function bootstrapOrgsAndProjects() {
    try {
      const orgsResp = await organizationService.getAll();
      const organizations: Organization[] =
        orgsResp?.data?.organizations || [];

      if (!organizations.length) {
        await createDefaultSetup();
        return await bootstrapOrgsAndProjects();
      }

      const projsResp = await projectService.getAll();
      const projects: Project[] = projsResp?.data?.projects || [];

      if (!projects.length) {
        await createProject(organizations[0].id);
        // refetch after creation
        return await bootstrapOrgsAndProjects();
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

    // set mapping
    dispatch(setOrganizationProjectMapping(orgWithProjects));

    // resolve previous selection or default
    const stored = readStoredSelection();
    const selection = resolveSelection(orgWithProjects, stored);

    if (selection) {
      dispatch(
        selectOrganizationProject({
          organizationId: selection.organizationId,
          organizationName: selection.organizationName,
          projectId: selection.projectId,
          projectName: selection.projectName,
        })
      );

      // persist for next reload
      writeStoredSelection({
        organizationId: selection.organizationId,
        projectId: selection.projectId,
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
        // no-op; caller refetches
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

  return (
    <HeaderSection
      sx={sx}
      layoutQuery={layoutQuery}
      slots={{
        ...slots,
        leftAreaStart: slots?.leftAreaStart,
        leftArea: (
          <>
            {slots?.leftAreaStart}

            {/* -- Menu button -- */}
            {menuButton && (
              <MenuButton
                data-slot="menu-button"
                onClick={onOpenNav}
                sx={{
                  mr: 1,
                  ml: -1,
                  [theme.breakpoints.up(layoutQuery)]: { display: "none" },
                }}
              />
            )}

            {/* -- Logo -- */}
            <Logo data-slot="logo" />

            {/* -- Divider -- */}
            <StyledDivider data-slot="divider" />

            {/* -- Workspace selector -- */}
            {/* {workspaces && <WorkspacesPopover data-slot="workspaces" data={data?.workspaces} />} */}
            <AppSelector />

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
              {/* -- Help link -- */}
              {helpLink && (
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

              {/* -- Searchbar -- */}
              {searchbar && (
                <Searchbar data-slot="searchbar" data={data?.nav} />
              )}

              {/* -- Language popover -- */}
              {/* {localization && (
                <LanguagePopover data-slot="localization" data={data?.langs} />
              )} */}

              {/* -- Notifications drawer -- */}
              {/* {notifications && (
                <NotificationsDrawer
                  data-slot="notifications"
                  data={data?.notifications}
                />
              )} */}

              {/* -- Contacts popover -- */}
              {/* {contacts && (
                <ContactsPopover data-slot="contacts" data={data?.contacts} />
              )} */}

              {/* -- Settings button -- */}
              {/* {settings && <SettingsButton data-slot="settings" />} */}

              {/* -- Account drawer / popover -- */}
              {/* {account && (
                <AccountDrawer data-slot="account" data={data?.account} />
              )} */}
              <AccountPopover />

              {/* -- Sign in button -- */}
              {signIn && <SignInButton />}

              {/* -- Purchase button -- */}
              {/* {purchase && (
                <Button
                  data-slot="purchase"
                  variant="contained"
                  rel="noopener"
                  target="_blank"
                  href={paths.minimalStore}
                  sx={{
                    display: 'none',
                    [theme.breakpoints.up(layoutQuery)]: { display: 'inline-flex' },
                  }}
                >
                  Purchase
                </Button>
              )} */}
            </Box>

            {slots?.rightAreaEnd}
          </>
        ),
      }}
      slotProps={slotProps}
      {...other}
    />
  );
}
