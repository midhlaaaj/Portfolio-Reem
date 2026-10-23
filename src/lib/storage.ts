import 'server-only';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const env = process.env;
const endpoint = env.AWS_ENDPOINT_URL_S3 || env.S3_ENDPOINT;
const accessKeyId = env.AWS_ACCESS_KEY_ID || env.S3_ACCESS_KEY_ID;
const secretAccessKey = env.AWS_SECRET_ACCESS_KEY || env.S3_SECRET_ACCESS_KEY;
const bucket = env.S3_BUCKET || 'assets';
const configured = !!(endpoint && accessKeyId && secretAccessKey);

let client: S3Client | null = null;
const s3 = () =>
  (client ??= new S3Client({
    region: env.AWS_REGION || env.S3_REGION || 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  }));

function assertUsable() {
  if (!configured && env.NODE_ENV === 'production') {
    throw new Error('Media storage is not configured. Set the S3_* environment variables.');
  }
}

/** Stores a file and returns its public URL. Without S3 settings (local dev only) it writes to public/uploads. */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  assertUsable();
  if (configured) {
    await s3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    // The bucket is private; the app serves files itself through /files (see app/files).
    return `/files/${key}`;
  }
  const file = path.join(process.cwd(), 'public', 'uploads', key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
  return `/uploads/${key}`;
}

/** Reads a stored file for the /files route. */
export async function getObject(key: string) {
  assertUsable();
  const res = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return {
    body: res.Body!.transformToWebStream(),
    type: res.ContentType || 'application/octet-stream',
    length: res.ContentLength,
  };
}

export async function deleteObject(key: string): Promise<void> {
  if (configured) {
    await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return;
  }
  await unlink(path.join(process.cwd(), 'public', 'uploads', key)).catch(() => {});
}
