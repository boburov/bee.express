import { cn } from "@/shared/lib/cn";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "md" | "lg" | "xl" | "2xl" | "full";
}

const rounds = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
} as const;

export function Skeleton({ className, width, height, rounded = "lg" }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "block bg-[linear-gradient(90deg,#EEEFF3_0%,#F6F7F9_50%,#EEEFF3_100%)] bg-[length:400px_100%]",
        "animate-[shimmer_1.4s_linear_infinite]",
        rounds[rounded],
        width,
        height,
        className,
      )}
    />
  );
}
