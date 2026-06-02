import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Design system §8 — error holati: "danger" tonli ogohlantirish (sabab) + qayta
 * urinish tugmasi. EmptyState bilan bir xil kompozitsiya, danger token bilan.
 */
export function ErrorState({
  title = "Nimadir noto'g'ri ketdi",
  description,
  onRetry,
  retryLabel = "Qayta urinish",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center py-12 px-6 rounded-xl border border-danger/20 bg-danger/5",
        className,
      )}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
      </div>
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCw className="h-4 w-4" />}
          className="mt-1"
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
