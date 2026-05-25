"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Logo } from "@/shared/ui/Logo";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
        <Logo size={28} />
        <Link
          href="/cart"
          aria-label="Savat"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3 hover:text-ink"
        >
          <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
        </Link>
      </div>
    </header>
  );
}
