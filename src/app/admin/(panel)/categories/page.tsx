import { adminCategories } from '@/lib/admin/queries';
import { CategoriesManager } from './CategoriesManager';

export default async function CategoriesPage() {
  return <CategoriesManager initial={await adminCategories()} />;
}
