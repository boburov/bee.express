import { cn } from "@/lib/cn";

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold text-ink", className)}>
      <span
        aria-hidden
        className="inline-flex items-center justify-center rounded-md bg-ink text-bee-500"
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        🐝
      </span>
      <span className="tracking-tight">BeeExpress</span>
    </span>
  );
}
