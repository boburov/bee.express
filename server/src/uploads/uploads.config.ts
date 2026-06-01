import type { UploadPurpose } from '@prisma/client';

/**
 * Per-purpose upload policy. Edit here and the rest of the system follows —
 * the service uses these to validate mime-type and size before signing.
 *
 * `maxBytes` is the hard limit. R2 will also enforce a content-length header
 * we set in the presigned URL.
 */
export interface PurposePolicy {
  /** Allowed mime types. `image/*` style wildcards NOT supported — list explicitly. */
  mimes: readonly string[];
  /** Max file size in bytes. */
  maxBytes: number;
  /** R2 key prefix — files land at `<prefix>/<cuid>.<ext>`. */
  prefix: string;
}

const MB = 1024 * 1024;

const IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const UPLOAD_POLICIES: Record<UploadPurpose, PurposePolicy> = {
  PRODUCT_IMAGE: { mimes: IMAGE_MIMES, maxBytes: 8 * MB, prefix: 'products' },
  STORE_LOGO:    { mimes: IMAGE_MIMES, maxBytes: 2 * MB, prefix: 'stores/logos' },
  STORE_BANNER:  { mimes: IMAGE_MIMES, maxBytes: 6 * MB, prefix: 'stores/banners' },
  USER_AVATAR:   { mimes: IMAGE_MIMES, maxBytes: 2 * MB, prefix: 'avatars' },
  REVIEW_IMAGE:  { mimes: IMAGE_MIMES, maxBytes: 6 * MB, prefix: 'reviews' },
  OTHER:         { mimes: IMAGE_MIMES, maxBytes: 4 * MB, prefix: 'misc' },
};

/** Local-disk root for uploads when R2 is not configured. Served at /uploads-static. */
export function localUploadsDir(): string {
  return process.env.UPLOADS_DIR ?? `${process.cwd()}/uploads-data`;
}

/**
 * Absolute base URL prefixed onto locally-stored files so the (cross-origin)
 * panels can load them via <img>. Defaults to the API origin on this host.
 */
export function uploadsPublicBaseUrl(): string {
  const explicit = process.env.UPLOADS_PUBLIC_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  return `http://localhost:${process.env.PORT ?? 60000}`;
}

/** Map a mime type to a file extension we'll use in the R2 key. */
export function extensionFor(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    default:
      return 'bin';
  }
}
