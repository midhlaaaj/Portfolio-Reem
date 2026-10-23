import 'server-only';
import { desc, notInArray } from 'drizzle-orm';
import { activity, db } from '@/db';

/** Records a line in the dashboard's "Recent edits" feed and keeps only the latest 40. */
export async function logActivity(text: string) {
  await db.insert(activity).values({ text });
  const keep = await db.select({ id: activity.id }).from(activity).orderBy(desc(activity.id)).limit(40);
  if (keep.length === 40)
    await db.delete(activity).where(
      notInArray(
        activity.id,
        keep.map((k) => k.id),
      ),
    );
}
