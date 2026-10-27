import { notFound } from 'next/navigation';
import { adminCompany } from '@/lib/admin/queries';
import { CompanyEditor } from '../CompanyEditor';

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await adminCompany(id);
  if (!data) notFound();
  return <CompanyEditor key={id} data={data} />;
}
