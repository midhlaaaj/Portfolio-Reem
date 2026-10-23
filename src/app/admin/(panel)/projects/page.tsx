import { adminProjectRows } from '@/lib/admin/queries';
import { ProjectsTable } from './ProjectsTable';

export default async function ProjectsPage() {
  return <ProjectsTable initial={await adminProjectRows()} />;
}
