import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });
import './env.mts';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq, isNull, isNotNull, and } from 'drizzle-orm';
import { connect } from '../src/db/connect';
import { makeVariants } from '../src/lib/images';
import * as t from '../src/db/schema';

/**
 * Gives every uploaded image the two versions new uploads get: a small `url` for the site and a lightly compressed
 * `full_url` for the lightbox. Safe to re-run (already-converted images are skipped). The old files stay in the
 * bucket; nothing is deleted.
 */
const env = process.env;
const bucket = env.S3_BUCKET || 'assets';
const s3 = new S3Client({
  region: env.AWS_REGION || env.S3_REGION || 'auto',
  endpoint: env.AWS_ENDPOINT_URL_S3 || env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: (env.AWS_ACCESS_KEY_ID || env.S3_ACCESS_KEY_ID)!,
    secretAccessKey: (env.AWS_SECRET_ACCESS_KEY || env.S3_SECRET_ACCESS_KEY)!,
  },
});
const put = (key: string, body: Buffer) =>
  s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

const db = connect();
const rows = await db
  .select()
  .from(t.media)
  .where(and(isNotNull(t.media.storageKey), isNull(t.media.fullUrl)));
console.log(`${rows.length} images to convert.`);

let done = 0;
let before = 0;
let after = 0;
for (const m of rows) {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: m.storageKey! }));
    const src = Buffer.from(await res.Body!.transformToByteArray());
    const { web, full } = await makeVariants(src);
    const webKey = `media/${m.id}-web.webp`;
    const fullKey = `media/${m.id}-full.webp`;
    await Promise.all([put(webKey, web.data), put(fullKey, full.data)]);
    await db
      .update(t.media)
      .set({
        url: `/files/${webKey}`,
        width: web.width,
        height: web.height,
        bytes: web.data.length,
        storageKey: webKey,
        fullUrl: `/files/${fullKey}`,
        fullStorageKey: fullKey,
        fullBytes: full.data.length,
      })
      .where(eq(t.media.id, m.id));
    done++;
    before += src.length;
    after += web.data.length;
    console.log(`${m.name}: ${(src.length / 1024) | 0} KB -> web ${(web.data.length / 1024) | 0} KB, full ${(full.data.length / 1024) | 0} KB`);
  } catch (e) {
    console.error(`Skipped ${m.name}:`, (e as Error).message);
  }
}
console.log(`Converted ${done}/${rows.length}. Site-facing size: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB.`);
process.exit(0);
