import { cn } from "@/shared/lib/cn";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

/**
 * Premium-orange gradient initials fallback when no avatar URL exists.
 * Used in the user lists, audit actor column, sidebar profile.
 */
export function Avatar({ src, name, size = 36, className }: AvatarProps) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? ""}
        width={size}
        height={size}
        className={cn("inline-block rounded-full object-cover bg-surface-3", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-premium text-white font-semibold",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
