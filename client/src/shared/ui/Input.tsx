import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftSlot, rightSlot, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label htmlFor={inputId} className="flex flex-col gap-1.5">
      {label ? <span className="text-sm font-medium text-ink-soft">{label}</span> : null}
      <span
        className={cn(
          "flex items-center h-12 rounded-xl border border-line bg-surface px-4 transition-colors",
          "focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100",
          error && "border-danger focus-within:border-danger focus-within:ring-red-100",
        )}
      >
        {leftSlot ? <span className="mr-2 text-ink-muted shrink-0">{leftSlot}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-full w-full bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none",
            className,
          )}
          {...rest}
        />
        {rightSlot ? <span className="ml-2 text-ink-muted shrink-0">{rightSlot}</span> : null}
      </span>
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  );
});
