import { CONFIG } from 'src/config-global';
import SetPasswordView from 'src/sections/auth/jwt/set-password';

// ----------------------------------------------------------------------

export const metadata = { title: `Sign in | Jwt - ${CONFIG.site.name}` };

export default function Page() {
  return <SetPasswordView />;
}
