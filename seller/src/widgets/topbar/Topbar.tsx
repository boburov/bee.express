"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const label = findLabel(pathname);

  return (
    <header className="h-14 border-b border-line bg-surface flex items-center gap-3 px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Menyu"
        className="lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted min-w-0 truncate">
        <span className="text-ink-faint">Sotuvchi</span>
        <span className="mx-2 text-ink-faint">/</span>
        <span className="text-ink font-medium">{label}</span>
      </nav>
    </header>
  );
}
