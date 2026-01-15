"use client";
import { CONFIG } from "src/config-global";
import { DashboardLayout } from "src/layouts/dashboard";
import { AuthGuard } from "src/auth/guard";
import { SnackbarProvider } from "notistack";

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  if (CONFIG.auth.skip) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <AuthGuard>
        {children}
    </AuthGuard>
  );
}
