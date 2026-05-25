import { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type Tone = "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: "sm" | "md";
}

const tones: Record<Tone, string> = {
  neutral: "bg-surface-3 text-ink-soft border-line",
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  accent: "bg-amber-50 text-amber-800 border-amber-100",
  success: "bg-green-50 text-green-700 border-green-100",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-100",
  info: "bg-sky-50 text-sky-700 border-sky-100",
};

export function Badge({ className, tone = "neutral", size = "sm", ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "h-5 px-2 text-[11px]" : "h-6 px-2.5 text-xs",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
