import { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type Tone = "default" | "warm" | "muted";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  default: "bg-surface border-line shadow-card",
  warm: "bg-gradient-warm border-brand-100 shadow-card",
  muted: "bg-surface-3 border-line",
};

export function Card({ className, tone = "default", ...rest }: CardProps) {
  return (
    <div className={cn("rounded-xl border", tones[tone], className)} {...rest} />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-4", className)} {...rest} />;
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-line flex items-center justify-end gap-2 bg-surface-2 rounded-b-xl",
        className,
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold tracking-tight text-ink", className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ink-muted mt-1", className)} {...rest} />;
}
