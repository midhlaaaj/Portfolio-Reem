/** Admin timestamps are shown in one fixed zone so the server render and the browser always agree. */
const TZ = process.env.NEXT_PUBLIC_ADMIN_TZ || 'Asia/Kolkata';

const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ });

/** "Today, 14:05", "Yesterday, 09:12", "19 Oct", or "19 Oct 2025" for another year. */
export function fmtDate(value: Date | string | number | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  const now = new Date();
  const time = d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  if (day(d) === day(now)) return `Today, ${time}`;
  if (day(d) === day(new Date(now.getTime() - 86_400_000))) return `Yesterday, ${time}`;
  const sameYear =
    d.toLocaleDateString('en-CA', { timeZone: TZ, year: 'numeric' }) ===
    now.toLocaleDateString('en-CA', { timeZone: TZ, year: 'numeric' });
  return d.toLocaleDateString('en-GB', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function fmtLong(value: Date | string | number): string {
  return new Date(value).toLocaleString('en-GB', {
    timeZone: TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
