import { cn } from "@/shared/lib/cn";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "md" | "lg" | "full";
}

const rounds = { md: "rounded-md", lg: "rounded-lg", full: "rounded-full" } as const;

export function Skeleton({ className, width, height, rounded = "md" }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "block bg-[linear-gradient(90deg,#F5F5F4_0%,#EFEFEC_50%,#F5F5F4_100%)] bg-[length:400px_100%]",
        "animate-[shimmer_1.4s_linear_infinite]",
        rounds[rounded],
        width,
        height,
        className,
      )}
    />
  );
}
