import { CONFIG } from 'src/config-global';
import OverviewSection from 'src/sections/dashboard/overview';


// ----------------------------------------------------------------------

export const metadata = { title: `Page three | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return <OverviewSection />;
}
