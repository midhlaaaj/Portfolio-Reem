import sharp from 'sharp';

/** Longest edge of each stored version. */
export const WEB_EDGE = 1600;
export const FULL_EDGE = 3200;

type Encoded = { data: Buffer; width: number; height: number };

const encode = async (input: Buffer, edge: number, quality: number): Promise<Encoded> => {
  const { data, info } = await sharp(input, { failOn: 'error' })
    .rotate() // applies the EXIF orientation, then the metadata is dropped on re-encode
    .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, smartSubsample: true, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

/**
 * Two WebP versions of one upload. `web` is small and is what the whole site shows; `full` keeps the detail (up to
 * 3200px, quality 88) and is only loaded when a preview or the full view is opened.
 */
export async function makeVariants(input: Buffer): Promise<{ web: Encoded; full: Encoded }> {
  const [web, full] = await Promise.all([encode(input, WEB_EDGE, 76), encode(input, FULL_EDGE, 88)]);
  return { web, full };
}
