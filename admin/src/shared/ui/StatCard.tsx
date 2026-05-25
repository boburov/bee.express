import { cn } from "@/shared/lib/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; tone: "up" | "down" | "flat" };
  icon?: React.ReactNode;
  className?: string;
}

const tones = {
  up: "text-success",
  down: "text-danger",
  flat: "text-ink-muted",
};

export function StatCard({ label, value, delta, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface shadow-card p-5 flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          {label}
        </div>
        {icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 text-brand-500">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-semibold tracking-tight text-ink">{value}</div>
        {delta ? (
          <span className={cn("text-xs font-medium", tones[delta.tone])}>{delta.value}</span>
        ) : null}
      </div>
    </div>
  );
}
