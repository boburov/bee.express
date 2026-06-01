import { api } from "@/shared/auth/api";

export interface UploadedImage {
  id: string;
  url: string;
  mimeType: string;
  size: number;
}

export type UploadPurpose =
  | "PRODUCT_IMAGE"
  | "STORE_LOGO"
  | "STORE_BANNER"
  | "USER_AVATAR"
  | "REVIEW_IMAGE"
  | "OTHER";

/**
 * Direct multipart upload to the API (`POST /uploads/direct`). Returns a READY
 * upload row — its `id` is what product/store create+update accept as
 * `imageUploadIds`. `postForm` lets axios set the multipart boundary itself
 * (overriding the instance's default application/json content-type).
 */
export async function uploadImage(
  file: File,
  purpose: UploadPurpose = "PRODUCT_IMAGE",
): Promise<UploadedImage> {
  const { data } = await api.postForm<UploadedImage>("/uploads/direct", { file, purpose });
  return data;
}
