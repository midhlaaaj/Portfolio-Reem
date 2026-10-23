import type { ZodError } from 'zod';

/** First message per field path, e.g. { title: '…', 'sections.0.videoUrl': '…' }. */
export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
