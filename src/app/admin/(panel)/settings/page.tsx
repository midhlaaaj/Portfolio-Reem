import { adminSettingsData } from '@/lib/admin/queries';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage() {
  return <SettingsForm data={await adminSettingsData()} />;
}
