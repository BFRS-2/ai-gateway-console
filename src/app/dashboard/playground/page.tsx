import { CONFIG } from 'src/config-global';

import DockyardMuiPlayground from 'src/sections/dashboard/playground';

// ----------------------------------------------------------------------

export const metadata = { title: `Playground | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return <DockyardMuiPlayground />;
}
