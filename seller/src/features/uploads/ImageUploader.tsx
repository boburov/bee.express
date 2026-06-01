"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Spinner } from "@/shared/ui/Spinner";
import { uploadImage, type UploadedImage, type UploadPurpose } from "./api";

export interface UploaderItem {
  id: string;
  url: string;
}

interface ImageUploaderProps {
  value: UploaderItem[];
  onChange: (next: UploaderItem[]) => void;
  purpose?: UploadPurpose;
  max?: number;
  disabled?: boolean;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/**
 * Multi-image picker. Each selected file is uploaded immediately via
 * `POST /uploads/direct`; the returned `{id,url}` is appended to `value`.
 * The parent passes those ids as `imageUploadIds` on product create/update.
 */
export function ImageUploader({
  value,
  onChange,
  purpose = "PRODUCT_IMAGE",
  max = 8,
  disabled,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const room = max - value.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (picked.length === 0) {
      setError(`Maksimal ${max} ta rasm`);
      return;
    }

    setUploading((n) => n + picked.length);
    const added: UploaderItem[] = [];
    for (const file of picked) {
      try {
        const up: UploadedImage = await uploadImage(file, purpose);
        added.push({ id: up.id, url: up.url });
      } catch (err) {
        const e = err as { response?: { data?: { message?: string | string[] } } };
        const msg = e.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : msg || "Rasm yuklanmadi");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (added.length) onChange([...value, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    onChange(value.filter((v) => v.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {value.map((img) => (
          <div
            key={img.id}
            className="relative h-20 w-20 overflow-hidden rounded-lg border border-line bg-surface-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(img.id)}
              disabled={disabled}
              className="absolute right-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-white hover:bg-ink"
              aria-label="O'chirish"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {value.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading > 0}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-ink-muted hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
          >
            {uploading > 0 ? (
              <Spinner size="sm" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-[11px]">Rasm</span>
              </>
            )}
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <p className="text-[11px] text-ink-faint">
        JPG / PNG / WEBP / AVIF · maksimal {max} ta · har biri ≤ 8 MB
      </p>
    </div>
  );
}
