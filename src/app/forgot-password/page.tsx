import { CONFIG } from "src/config-global";
import ForgotPasswordView from "src/sections/auth/jwt/forgot-password";

export const metadata = { title: `Forgot Password - ${CONFIG.site.name}` };

export default function Page() {
  return <ForgotPasswordView />;
}
