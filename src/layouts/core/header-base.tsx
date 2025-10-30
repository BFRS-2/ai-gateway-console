"use client";

import type { NavSectionProps } from "src/components/nav-section";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import { styled, useTheme } from "@mui/material/styles";

import { paths } from "src/routes/paths";
import { RouterLink } from "src/routes/components";

import { Logo } from "src/components/logo";

import { HeaderSection } from "./header-section";
import { Searchbar } from "../components/searchbar";
import { MenuButton } from "../components/menu-button";
import { SignInButton } from "../components/sign-in-button";
import { AccountDrawer } from "../components/account-drawer";
import { SettingsButton } from "../components/settings-button";
import { LanguagePopover } from "../components/language-popover";
import { ContactsPopover } from "../components/contacts-popover";
import { WorkspacesPopover } from "../components/workspaces-popover";
import { NotificationsDrawer } from "../components/notifications-drawer";

import type { HeaderSectionProps } from "./header-section";
import type { AccountDrawerProps } from "../components/account-drawer";
import type { ContactsPopoverProps } from "../components/contacts-popover";
import type { LanguagePopoverProps } from "../components/language-popover";
import type { WorkspacesPopoverProps } from "../components/workspaces-popover";
import type { NotificationsDrawerProps } from "../components/notifications-drawer";
import AppSelector from "src/components/nav-section/app-selector";
import authService, { Organization } from "src/api/services/auth.service";
import projectService, { Project } from "src/api/services/project.service";
import { OrganizationWithProjects } from "src/app/dashboard/layout";
import { selectOrganizationProject, setOrganizationProjectMapping } from "src/stores/slicers/orgProject";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import organizationService from "src/api/services/organization.service";
import {
  generateOrganizationName,
  generateProjectName,
} from "src/utils/nameGenerator";

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

export type HeaderBaseProps = HeaderSectionProps & {
  onOpenNav: () => void;
  data?: {
    nav?: NavSectionProps["data"];
    account?: AccountDrawerProps["data"];
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
  useEffect(() => {
    authService
      .getUserInfo()
      .then((res) => {
        if (res.success === true) {
          const user = res.data.user;
          localStorage.setItem("_user", JSON.stringify(user));
        }
      })
      .catch((err) => {
        console.error("Error fetching user info:", err);
      });

    organizationService.getAll().then((orgs) => {
      const organizations: Organization[] = orgs?.data?.organizations;
      if (organizations.length === 0) {
        createDefaultSetup();
      } else {
        projectService.getAll().then((projs) => {
          const projects = projs?.data?.projects || [];
          if (projects.length === 0) {
            createProject(organizations[0].id);
          } else {
            console.log(
              "🚀 ~ HeaderBase ~ orgs, projs:",
              organizations,
              projects
            );
            saveOrgProject(organizations, projects);
          }
        });
      }
    });
  }, []);

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

  const saveOrgProject = (org: Organization[], project: Project[]) => {
    const orgWithProjects: OrganizationWithProjects[] = mergeOrgsWithProjects(
      org,
      project
    );
    console.log("🚀 ~ saveOrgProject ~  org,", org, project);

    dispatch(setOrganizationProjectMapping(orgWithProjects));
    // pick first org and project to select by default
    const firstOrg = orgWithProjects[0];
    const firstProject = firstOrg?.projects?.[0];
    if (firstOrg) {
      dispatch(
        selectOrganizationProject({
          organizationId: firstOrg.id,
          organizationName: firstOrg.name,
          projectId: firstProject?.id ?? "",
          projectName: firstProject?.name ?? "",
        })
      );
    }
    // save to redux
  };
  const createProject = (organizationId: string) => {
    if (!organizationId) return;
    projectService
      .create({ name: generateProjectName(), organization_id: organizationId })
      .then((projRes) => {
        if (projRes.success === true) {
          const project = projRes.data;
        }
      });
  };

  const createOrganization = (cb: Function) => {
    organizationService
      .create({ name: generateOrganizationName() })
      .then((orgRes) => {
        if (orgRes.success === true) {
          const org = orgRes.data.organization;
          cb(org);
        }
      });
  };

  const createDefaultSetup = () =>
    createOrganization((org: Organization) => {
      createProject(org.id);
    });

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

            {/* -- Workspace popover -- */}
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
              {localization && (
                <LanguagePopover data-slot="localization" data={data?.langs} />
              )}

              {/* -- Notifications popover -- */}
              {notifications && (
                <NotificationsDrawer
                  data-slot="notifications"
                  data={data?.notifications}
                />
              )}

              {/* -- Contacts popover -- */}
              {contacts && (
                <ContactsPopover data-slot="contacts" data={data?.contacts} />
              )}

              {/* -- Settings button -- */}
              {/* {settings && <SettingsButton data-slot="settings" />} */}

              {/* -- Account drawer -- */}
              {account && (
                <AccountDrawer data-slot="account" data={data?.account} />
              )}

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
