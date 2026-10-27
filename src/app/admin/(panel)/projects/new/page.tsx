import { adminProjectEdit } from '@/lib/admin/queries';
import { ProjectEditor } from '../ProjectEditor';

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const data = await adminProjectEdit(null, client?.slice(0, 120));
  return <ProjectEditor data={data!} />;
}
