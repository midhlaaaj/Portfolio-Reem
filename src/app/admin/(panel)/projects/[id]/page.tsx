import { notFound } from 'next/navigation';
import { adminProjectEdit } from '@/lib/admin/queries';
import { ProjectEditor } from '../ProjectEditor';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await adminProjectEdit(id);
  if (!data) notFound();
  // Keyed by id and save time so the form resets when fresh data arrives after a save.
  return <ProjectEditor key={`${id}-${data.updatedAt}`} data={data} />;
}
