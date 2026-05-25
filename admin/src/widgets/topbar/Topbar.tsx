"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
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

export function Topbar() {
  const pathname = usePathname();
  const crumbs = useMemo(() => findCrumbs(pathname), [pathname]);

  return (
    <header className="h-16 border-b border-line bg-surface flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          <span key={c.href} className="inline-flex items-center gap-1.5">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5 text-ink-faint" /> : null}
            <span
              className={
                i === crumbs.length - 1
                  ? "text-ink font-medium"
                  : "text-ink-muted hover:text-ink"
              }
            >
              {c.label}
            </span>
          </span>
        ))}
      </nav>
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">
        BeeExpress · SuperAdmin
      </div>
    </header>
  );
}
