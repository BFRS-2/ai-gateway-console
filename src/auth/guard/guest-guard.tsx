'use client';

import { useState, useEffect } from 'react';

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

/**
 * Restrict post-login navigation to in-app dashboard paths.
 * Rejects absolute, protocol-relative, backslash and non-HTTP(S) URLs
 * (e.g. javascript:, data:, //host, /\host) so a crafted `returnTo`
 * cannot drive an open redirect or same-origin script execution.
 */
function safeReturnTo(raw: string | null): string {
  const fallback = CONFIG.auth.redirectPath;
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) {
    return fallback;
  }
  try {
    const origin = window.location.origin;
    const url = new URL(raw, origin);
    if (url.origin !== origin) return fallback;
    if (url.pathname !== '/dashboard' && !url.pathname.startsWith('/dashboard/')) {
      return fallback;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

export function GuestGuard({ children }: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const { loading, authenticated } = useAuthContext();

  const [isChecking, setIsChecking] = useState<boolean>(true);

  const returnTo = safeReturnTo(searchParams.get('returnTo'));

  const checkPermissions = async (): Promise<void> => {
    if (loading) {
      return;
    }

    if (authenticated) {
      router.replace(returnTo);
      return;
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, loading]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
