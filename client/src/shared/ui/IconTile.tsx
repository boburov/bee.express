import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type Tone = "brand" | "amber" | "emerald" | "sky" | "rose" | "violet";

interface IconTileProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  tone?: Tone;
  caption?: string;
  /** Optional category image; falls back to the Lucide `icon` when absent. */
  imageUrl?: string | null;
  className?: string;
}

/**
 * Category tile — colored soft-tinted card with a Lucide icon and label.
 * Replaces the legacy emoji grid on the home/catalog pages. Tones are pulled
 * from Tailwind's built-in palette so we don't pollute the brand tokens with
 * decorative colors; each pair is hand-picked for AA contrast on its bg-*-50.
 */
const tones: Record<Tone, { bg: string; iconBg: string; iconText: string; border: string }> = {
  brand: {
    bg: "bg-brand-50",
    border: "border-brand-100",
    iconBg: "bg-brand-100",
    iconText: "text-brand-700",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    iconBg: "bg-amber-100",
    iconText: "text-amber-700",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
  },
  sky: {
    bg: "bg-sky-50",
    border: "border-sky-100",
    iconBg: "bg-sky-100",
    iconText: "text-sky-700",
  },
  rose: {
    bg: "bg-rose-50",
    border: "border-rose-100",
    iconBg: "bg-rose-100",
    iconText: "text-rose-700",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-100",
    iconBg: "bg-violet-100",
    iconText: "text-violet-700",
  },
};

export function IconTile({
  icon: Icon,
  label,
  href,
  tone = "brand",
  caption,
  imageUrl,
  className,
}: IconTileProps) {
  const t = tones[tone];
  const body = (
    <>
      <span
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl",
          t.iconBg,
          t.iconText,
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        )}
      </span>
      <div className="min-w-0 mt-2">
        <div className="text-xs font-semibold text-ink truncate">{label}</div>
        {caption ? (
          <div className="text-[10px] text-ink-muted truncate mt-0.5">{caption}</div>
        ) : null}
      </div>
    </>
  );

  const baseClass = cn(
    "flex flex-col items-start rounded-xl border p-3 transition-colors",
    t.bg,
    t.border,
    href && "active:scale-[0.98] hover:brightness-105",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {body}
      </Link>
    );
  }
  return <div className={baseClass}>{body}</div>;
}
