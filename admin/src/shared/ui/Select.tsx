import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...rest },
  ref,
) {
  const selectId = id ?? rest.name;
  return (
    <label htmlFor={selectId} className="flex flex-col gap-1.5">
      {label ? <span className="text-sm font-medium text-ink-soft">{label}</span> : null}
      <span
        className={cn(
          "relative flex items-center h-11 rounded-md border border-line bg-surface px-3 transition-colors",
          "focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200",
          error && "border-danger focus-within:border-danger focus-within:ring-red-100",
        )}
      >
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-full w-full bg-transparent text-sm text-ink outline-none appearance-none pr-6",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 h-4 w-4 text-ink-muted pointer-events-none" />
      </span>
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  );
});
