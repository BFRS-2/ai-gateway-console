"use client";

import { GuestGuard } from "src/auth/guard";
import AuthSplitLayout from "src/layouts/auth-split/layout";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <GuestGuard>
      <AuthSplitLayout>{children}</AuthSplitLayout>
    </GuestGuard>
  );
}
