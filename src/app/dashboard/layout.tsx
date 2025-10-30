"use client";
import { CONFIG } from "src/config-global";
import { DashboardLayout } from "src/layouts/dashboard";

import { AuthGuard } from "src/auth/guard";
import ReduxProvider from "./provider";
import { Organization } from "src/api/services/auth.service";
import { Project } from "src/api/services/project.service";

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

  return (
    <AuthGuard>
      <ReduxProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </ReduxProvider>
    </AuthGuard>
  );
}
