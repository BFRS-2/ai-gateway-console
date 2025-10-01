import { CONFIG } from 'src/config-global';

import { ProjectManagementRoot } from 'src/sections/dashboard/projectManagement';

// ----------------------------------------------------------------------

export const metadata = { title: `Page three | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return <ProjectManagementRoot/>;
}
