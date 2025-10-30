"use client";
import { CONFIG } from "src/config-global";
import { DashboardLayout } from "src/layouts/dashboard";

import { AuthGuard } from "src/auth/guard";
import { useEffect } from "react";
import authService, { Organization } from "src/api/services/auth.service";
import organizationService from "src/api/services/organization.service";
import { generateOrganizationName } from "src/utils/nameGenerator";
import projectService, { Project } from "src/api/services/project.service";

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};
export interface OrganizationWithProjects extends Organization {
  projects: Project[];
}
export default function Layout({ children }: Props) {
  if (CONFIG.auth.skip) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }
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
      console.log("🚀 ~ Layout ~ orgs:", orgs);
      if (orgs.length === 0) {
        createDefaultSetup();
      } else {
        projectService.getAll().then((projs) => {
          if (projs.length === 0) {
            createProject(orgs[0].id);
          } else {
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

    const orgWithProjects: OrganizationWithProjects = mergeOrgsWithProjects(org, project)
    // save to redux
  };
  const createProject = (organizationId: string) => {
    if (!organizationId) return;
    projectService
      .create({ name: "Default Project", organization_id: organizationId })
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
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
