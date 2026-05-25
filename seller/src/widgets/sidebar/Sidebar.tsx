"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/shared/ui/Logo";
import { LogoutButton } from "@/shared/auth/LogoutButton";
import { sellerNav } from "@/shared/config/nav";
import { useAuthStore } from "@/shared/auth/store";
import { cn } from "@/shared/lib/cn";

export function Sidebar() {
  const pathname = usePathname();
  const me = useAuthStore((s) => s.me);

  const displayName = me?.firstName || me?.lastName
    ? [me?.firstName, me?.lastName].filter(Boolean).join(" ")
    : me?.phone
      ? `+${me.phone}`
      : "Sotuvchi";

  return (
    <aside className="w-64 shrink-0 border-r border-line bg-surface flex flex-col">
      <div className="px-5 py-[14px] border-b border-line bg-gradient-soft">
        <Logo size={32} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sellerNav.map((section, i) => (
          <div key={i} className="space-y-1">
            {section.title ? (
              <div className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                {section.title}
              </div>
            ) : null}
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-soft hover:bg-surface-3 hover:text-ink",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-brand-500" : "text-ink-muted",
                    )}
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3 space-y-2">
        {me ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-premium text-white text-sm font-semibold">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink truncate">{displayName}</div>
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">
                {me.role?.name ?? "Sotuvchi"}
              </div>
            </div>
          </div>
        ) : null}
        <LogoutButton className="w-full justify-start" />
      </div>
    </aside>
  );
}
