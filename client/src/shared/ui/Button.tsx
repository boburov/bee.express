import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  block?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-2xl select-none " +
  "transition-[transform,background-color,box-shadow] duration-200 ease-out active:scale-[0.97] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-1 " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const variants: Record<Variant, string> = {
  // Signature appetite-gradient CTA with a soft glow.
  primary:
    "bg-gradient-premium text-white shadow-cta hover:brightness-105 active:brightness-95",
  secondary:
    "bg-surface-3 text-ink hover:bg-line-soft active:bg-line",
  outline:
    "border border-line bg-surface text-ink hover:border-brand-300 hover:bg-brand-50",
  ghost: "text-ink hover:bg-surface-3",
  danger: "bg-danger text-white shadow-cta hover:brightness-105 active:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading,
    leftIcon,
    rightIcon,
    block,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], block && "w-full", className)}
      {...rest}
    >
      {loading ? (
        <ButtonSpinner />
      ) : leftIcon ? (
        <span className="inline-flex shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon ? (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      ) : null}
    </button>
  );
});

function ButtonSpinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
    />
  );
}
