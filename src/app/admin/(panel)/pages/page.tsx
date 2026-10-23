import { adminPagesData } from '@/lib/admin/queries';
import { PagesEditor } from './PagesEditor';

export default async function PagesPage() {
  return <PagesEditor data={await adminPagesData()} />;
}
