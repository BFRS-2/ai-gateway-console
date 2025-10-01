import { CONFIG } from 'src/config-global';
import { ServicesPage } from 'src/sections/dashboard/serviceComponents/ServicesPage';

// ----------------------------------------------------------------------

export const metadata = { title: `Page three | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return <ServicesPage />;;
}
