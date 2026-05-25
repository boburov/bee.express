"use client";

import { usePathname } from "next/navigation";
import { sellerNav } from "@/shared/config/nav";

function findLabel(pathname: string): string {
  for (const section of sellerNav) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.label;
      }
    }
  }
  return "Sotuvchi paneli";
}

export function Topbar() {
  const pathname = usePathname();
  const label = findLabel(pathname);

  return (
    <header className="h-14 border-b border-line bg-surface flex items-center justify-between px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <span className="text-ink-faint">Sotuvchi</span>
        <span className="mx-2 text-ink-faint">/</span>
        <span className="text-ink font-medium">{label}</span>
      </nav>
    </header>
  );
}
