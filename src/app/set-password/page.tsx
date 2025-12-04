import { CONFIG } from 'src/config-global';
import SetPasswordView from 'src/sections/auth/jwt/set-password';

// ----------------------------------------------------------------------

export const metadata = { title: `Set Password - ${CONFIG.site.name}` };

export default function Page() {
  return <SetPasswordView />;
}
