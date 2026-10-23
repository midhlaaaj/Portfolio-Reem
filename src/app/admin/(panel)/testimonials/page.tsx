import { adminTestimonials } from '@/lib/admin/queries';
import { TestimonialsManager } from './TestimonialsManager';

export default async function TestimonialsPage() {
  return <TestimonialsManager initial={await adminTestimonials()} />;
}
