import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftSlot?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftSlot, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label htmlFor={inputId} className="flex flex-col gap-1.5">
      {label ? <span className="text-sm font-medium text-ink-soft">{label}</span> : null}
      <span
        className={cn(
          "flex items-center h-11 rounded-lg border border-line bg-surface px-3 transition-colors",
          "focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200",
          error && "border-danger focus-within:border-danger focus-within:ring-danger/15",
        )}
      >
        {leftSlot ? <span className="mr-2 text-ink-muted">{leftSlot}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-full w-full bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none",
            className,
          )}
          {...rest}
        />
      </span>
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  );
});
