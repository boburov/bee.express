import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  delta?: { value: string; tone: "up" | "down" | "flat" };
  className?: string;
}

const deltaTone: Record<"up" | "down" | "flat", string> = {
  up: "text-green-700 bg-green-50",
  down: "text-red-700 bg-red-50",
  flat: "text-ink-muted bg-surface-3",
};

const DeltaIcon = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const;

export function StatCard({ label, value, icon, delta, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface px-5 py-4 shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wider text-ink-muted font-medium">
          {label}
        </span>
        {icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 text-brand-600">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-2xl font-semibold text-ink">{value}</span>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 h-5 text-[11px] font-medium",
              deltaTone[delta.tone],
            )}
          >
            {(() => {
              const Icon = DeltaIcon[delta.tone];
              return <Icon className="h-3 w-3" />;
            })()}
            {delta.value}
          </span>
        ) : null}
      </div>
    </div>
  );
}
