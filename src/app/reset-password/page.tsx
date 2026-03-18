import { CONFIG } from "src/config-global";
import ResetPasswordView from "src/sections/auth/jwt/reset-password";

export const metadata = { title: `Reset Password - ${CONFIG.site.name}` };

export default function Page() {
  return <ResetPasswordView />;
}
