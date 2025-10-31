'use client';

import { useEffect } from 'react';

import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    console.log(CONFIG.auth.redirectPath)
    router.push(CONFIG.auth.redirectPath);
  }, [router]);

  return null;
}
