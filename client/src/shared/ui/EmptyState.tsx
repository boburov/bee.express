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
        "animate-fade-up flex flex-col items-center justify-center gap-3 text-center py-12 px-6 rounded-2xl border border-line/60 bg-surface shadow-card",
        className,
      )}
    >
      {icon ? (
        <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          <span className="absolute inset-0 rounded-full bg-gradient-premium opacity-10" aria-hidden />
          {icon}
        </span>
      ) : null}
      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="text-lg font-bold tracking-tight text-ink">{title}</h3>
        {description ? <p className="text-sm text-ink-muted leading-relaxed">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
