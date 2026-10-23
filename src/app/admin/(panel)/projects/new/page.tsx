import { adminProjectEdit } from '@/lib/admin/queries';
import { ProjectEditor } from '../ProjectEditor';

export default async function NewProjectPage() {
  const data = await adminProjectEdit(null);
  return <ProjectEditor data={data!} />;
}
