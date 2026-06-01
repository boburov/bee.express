import { cn } from "@/lib/cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };

export function Spinner({ size = "md", label, className }: SpinnerProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-ink-muted", className)}>
      <span
        className={cn(
          "animate-spin rounded-full border-2 border-current/20 border-t-brand-500",
          sizes[size],
        )}
        aria-hidden
      />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
