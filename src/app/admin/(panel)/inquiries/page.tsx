import { adminInquiries } from '@/lib/admin/queries';
import { InquiriesInbox } from './InquiriesInbox';

export default async function InquiriesPage() {
  return <InquiriesInbox initial={await adminInquiries()} />;
}
