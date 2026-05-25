import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Thin Cloudflare R2 wrapper. R2 speaks the S3 API so we use the AWS SDK
 * pointed at `https://<account>.r2.cloudflarestorage.com`.
 *
 * Required env:
 *   CLOUDFLARE_R2_ACCOUNT_ID
 *   CLOUDFLARE_R2_ACCESS_KEY_ID
 *   CLOUDFLARE_R2_SECRET_ACCESS_KEY
 *   CLOUDFLARE_R2_BUCKET
 *   CLOUDFLARE_R2_PUBLIC_URL   (the public CDN base — e.g. https://cdn.beeexpress.uz)
 *
 * If env is missing we still construct the service but every operation
 * throws — this keeps the rest of the modules wireable without forcing
 * R2 credentials for unit tests / local dev that doesn't need uploads.
 */
@Injectable()
export class R2Client {
  private readonly logger = new Logger(R2Client.name);
  private readonly client: S3Client | null;
  readonly bucket: string;
  readonly publicBaseUrl: string;
  readonly configured: boolean;

  constructor(config: ConfigService) {
    const accountId = config.get<string>('CLOUDFLARE_R2_ACCOUNT_ID');
    const accessKeyId = config.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    this.bucket = config.get<string>('CLOUDFLARE_R2_BUCKET') ?? '';
    this.publicBaseUrl = (
      config.get<string>('CLOUDFLARE_R2_PUBLIC_URL') ?? ''
    ).replace(/\/+$/, '');

    this.configured = Boolean(accountId && accessKeyId && secretAccessKey && this.bucket);

    if (!this.configured) {
      this.logger.warn(
        'R2 not configured — set CLOUDFLARE_R2_* env vars to enable uploads. ' +
          'Endpoints will return 503 until then.',
      );
      this.client = null;
      return;
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }

  private requireClient(): S3Client {
    if (!this.client) {
      throw new Error('R2 is not configured — see server/.env');
    }
    return this.client;
  }

  /** Sign a one-shot PUT URL. The client uploads the body directly to R2. */
  async signPutUrl(opts: {
    key: string;
    mimeType: string;
    /** Hard cap matched against Content-Length. */
    maxBytes: number;
    /** Validity window (default 5 minutes). */
    expiresInSeconds?: number;
  }): Promise<string> {
    const client = this.requireClient();
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: opts.key,
      ContentType: opts.mimeType,
      ContentLength: opts.maxBytes,
    });
    return getSignedUrl(client, cmd, {
      expiresIn: opts.expiresInSeconds ?? 5 * 60,
    });
  }

  /** Returns size + mime if the object exists. Used by `/complete` to verify. */
  async headObject(key: string): Promise<{ size: number; mimeType: string } | null> {
    const client = this.requireClient();
    try {
      const res = await client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return {
        size: res.ContentLength ?? 0,
        mimeType: res.ContentType ?? 'application/octet-stream',
      };
    } catch (err) {
      const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  publicUrlFor(key: string): string {
    if (!this.publicBaseUrl) {
      throw new Error('CLOUDFLARE_R2_PUBLIC_URL is not set');
    }
    return `${this.publicBaseUrl}/${key}`;
  }
}
