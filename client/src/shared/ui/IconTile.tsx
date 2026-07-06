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
 * Category tile — a soft-tinted, appetizing card with a floating icon/photo and
 * a label underneath. Tones come from Tailwind's built-in palette so the brand
 * tokens stay clean; each pair is hand-picked for AA contrast on its bg-*-50.
 */
const tones: Record<Tone, { bg: string; iconBg: string; iconText: string; ring: string }> = {
  brand: {
    bg: "bg-brand-50",
    ring: "ring-brand-100",
    iconBg: "bg-surface",
    iconText: "text-brand-600",
  },
  amber: {
    bg: "bg-amber-50",
    ring: "ring-amber-100",
    iconBg: "bg-surface",
    iconText: "text-amber-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
    iconBg: "bg-surface",
    iconText: "text-emerald-600",
  },
  sky: {
    bg: "bg-sky-50",
    ring: "ring-sky-100",
    iconBg: "bg-surface",
    iconText: "text-sky-600",
  },
  rose: {
    bg: "bg-rose-50",
    ring: "ring-rose-100",
    iconBg: "bg-surface",
    iconText: "text-rose-600",
  },
  violet: {
    bg: "bg-violet-50",
    ring: "ring-violet-100",
    iconBg: "bg-surface",
    iconText: "text-violet-600",
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
          "inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl shadow-card ring-1",
          t.iconBg,
          t.iconText,
          t.ring,
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-contain p-1.5" />
        ) : (
          <Icon className="h-7 w-7" strokeWidth={1.75} />
        )}
      </span>
      <div className="min-w-0 mt-2 w-full">
        <div className="text-[13px] font-semibold text-ink leading-snug line-clamp-2">{label}</div>
        {caption ? (
          <div className="text-[11px] text-ink-muted truncate mt-0.5">{caption}</div>
        ) : null}
      </div>
    </>
  );

  const baseClass = cn(
    "flex flex-col items-center text-center rounded-2xl p-3",
    t.bg,
    href && "press hover:shadow-hover",
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
