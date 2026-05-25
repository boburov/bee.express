import { cn } from "@/shared/lib/cn";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizes: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function Spinner({ className, size = "md", label }: SpinnerProps) {
  return (
    <span
      role={label ? "status" : undefined}
      className={cn("inline-flex flex-col items-center gap-2 text-ink-muted", className)}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block animate-spin rounded-full border-line border-t-brand-500",
          sizes[size],
        )}
      />
      {label ? <span className="text-sm">{label}</span> : null}
    </span>
  );
}
