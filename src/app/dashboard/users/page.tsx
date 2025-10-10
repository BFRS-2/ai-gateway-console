import { CONFIG } from 'src/config-global';

import { UserManagementPage } from 'src/sections/dashboard/userMangement';

// ----------------------------------------------------------------------

export const metadata = { title: `Page three | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return <UserManagementPage/>;
}
