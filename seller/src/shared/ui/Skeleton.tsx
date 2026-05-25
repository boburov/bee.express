import { cn } from "@/shared/lib/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md bg-gradient-to-r from-surface-3 via-line-soft to-surface-3 bg-[length:400px_100%] animate-[shimmer_1.4s_linear_infinite]",
        className,
      )}
    />
  );
}
