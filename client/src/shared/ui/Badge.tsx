import { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type Tone =
  | "neutral"
  | "brand"
  | "hot"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: "sm" | "md";
  /** Solid, high-contrast fill (e.g. "-30%" discount flags). */
  solid?: boolean;
}

const tones: Record<Tone, string> = {
  neutral: "bg-surface-3 text-ink-soft border-line",
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  hot: "bg-hot-500/10 text-hot-600 border-hot-500/20",
  accent: "bg-amber-50 text-amber-800 border-amber-100",
  success: "bg-green-50 text-green-700 border-green-100",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-100",
  info: "bg-sky-50 text-sky-700 border-sky-100",
};

const solidTones: Record<Tone, string> = {
  neutral: "bg-ink text-white border-transparent",
  brand: "bg-gradient-premium text-white border-transparent",
  hot: "bg-hot-500 text-white border-transparent",
  accent: "bg-accent-400 text-ink border-transparent",
  success: "bg-success text-white border-transparent",
  warning: "bg-warning text-white border-transparent",
  danger: "bg-danger text-white border-transparent",
  info: "bg-info text-white border-transparent",
};

export function Badge({ className, tone = "neutral", size = "sm", solid = false, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        size === "sm" ? "h-5 px-2 text-[11px]" : "h-6 px-2.5 text-xs",
        solid ? solidTones[tone] : tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
