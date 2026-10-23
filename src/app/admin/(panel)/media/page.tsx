import { adminMediaItems } from '@/lib/admin/queries';
import { MediaLibrary } from './MediaLibrary';

export default async function MediaPage() {
  return <MediaLibrary items={await adminMediaItems()} />;
}
