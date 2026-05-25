import Image from "next/image";
import { cn } from "@/shared/lib/cn";

interface LogoProps {
  className?: string;
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ className, size = 32, withWordmark = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <Image
        src="/logo.png"
        alt="BeeExpress"
        width={size}
        height={size}
        priority
        className="rounded-lg object-contain"
      />
      {withWordmark ? (
        <span className="text-base font-semibold tracking-tight">
          Bee<span className="text-brand-500">Express</span>
        </span>
      ) : null}
    </span>
  );
}
