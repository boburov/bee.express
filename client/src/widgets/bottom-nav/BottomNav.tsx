"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { customerNav } from "@/shared/config/nav";
import { cn } from "@/shared/lib/cn";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Asosiy navigatsiya"
      className="sticky bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4 max-w-md mx-auto">
        {customerNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-brand-600" : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active ? "text-brand-500" : "text-ink-muted")}
                  strokeWidth={1.75}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
