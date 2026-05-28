"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ChevronRight, Menu } from "lucide-react";
import { adminNav } from "@/shared/config/nav";

function findCrumbs(pathname: string) {
  for (const section of adminNav) {
    for (const item of section.items) {
      if (
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
      ) {
        return [
          { href: "/dashboard", label: "Boshqaruv" },
          ...(item.href === "/dashboard" ? [] : [{ href: item.href, label: item.label }]),
        ];
      }
    }
  }
  return [{ href: "/dashboard", label: "Boshqaruv" }];
}

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const crumbs = useMemo(() => findCrumbs(pathname), [pathname]);

  return (
    <header className="h-16 border-b border-line bg-surface flex items-center gap-3 px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Menyu"
        className="lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>
      <nav aria-label="breadcrumb" className="flex-1 flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
        {crumbs.map((c, i) => (
          <span key={c.href} className="inline-flex items-center gap-1.5 min-w-0">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5 text-ink-faint shrink-0" /> : null}
            <span
              className={
                (i === crumbs.length - 1
                  ? "text-ink font-medium"
                  : "text-ink-muted hover:text-ink") + " truncate"
              }
            >
              {c.label}
            </span>
          </span>
        ))}
      </nav>
      <div className="hidden md:block text-[11px] uppercase tracking-wider text-ink-faint shrink-0">
        BeeExpress · SuperAdmin
      </div>
    </header>
  );
}
