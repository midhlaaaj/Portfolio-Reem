import 'server-only';
import { revalidatePath } from 'next/cache';

/** Public pages are statically generated; call this after any change that shows on the site. */
export function revalidateSite() {
  revalidatePath('/', 'layout');
}
