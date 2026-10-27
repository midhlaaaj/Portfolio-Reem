import { adminCompanies } from '@/lib/admin/queries';
import { CompaniesManager } from './CompaniesManager';

export default async function CompaniesPage() {
  return <CompaniesManager initial={await adminCompanies()} />;
}
