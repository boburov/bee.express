import { cn } from "@/shared/lib/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center py-12 px-6 rounded-xl border border-dashed border-line bg-surface",
        className,
      )}
    >
      {icon ? (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          {icon}
        </span>
      ) : null}
      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
