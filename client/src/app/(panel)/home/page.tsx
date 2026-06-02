"use client";

import Link from "next/link";
import {
  ArrowRight,
  Apple,
  HardHat,
  MapPin,
  Search,
  ShoppingBasket,
  Sparkles,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { IconTile } from "@/shared/ui/IconTile";
import { useAuthStore } from "@/shared/auth/store";

const categories = [
  { slug: "food", label: "Ovqat", caption: "Restoranlar", icon: UtensilsCrossed, tone: "rose" as const },
  { slug: "grocery", label: "Mahsulot", caption: "Do'konlar", icon: ShoppingBasket, tone: "emerald" as const },
  { slug: "fruits", label: "Mevalar", caption: "Bozor", icon: Apple, tone: "amber" as const },
  { slug: "construction", label: "Qurilish", caption: "Materiallar", icon: HardHat, tone: "sky" as const },
];

const quickFacts = [
  { icon: Store, label: "Yaqin sotuvchilar" },
  { icon: Truck, label: "Tez yetkazib berish" },
  { icon: Sparkles, label: "Naqd yoki online" },
];

export default function HomePage() {
  const me = useAuthStore((s) => s.me);
  const name = me?.firstName ?? (me?.phone ? `+${me.phone}` : "Mehmon");

  return (
    <div className="flex flex-col gap-6">
      {/* Hero — gradient greeting card with location stub + search affordance */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-warm p-5 shadow-card">
        <div className="absolute inset-0 bg-gradient-soft opacity-70 pointer-events-none" aria-hidden />
        <div className="relative flex flex-col gap-3">
          <Badge tone="brand" size="sm" className="self-start">
            <Sparkles className="h-3 w-3" /> BeeExpress
          </Badge>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Salom, {name}
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Kategoriyani tanlang yoki qidiruv orqali yaqin atrofdagi sotuvchini toping.
            </p>
          </div>
          <Link
            href="/catalog"
            className="mt-1 flex items-center gap-2 h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink-muted shadow-card hover:border-brand-300"
          >
            <Search className="h-4 w-4 text-ink-muted" />
            <span className="flex-1 text-left">Mahsulot yoki sotuvchini qidiring</span>
            <ArrowRight className="h-4 w-4 text-ink-faint" />
          </Link>
          <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <MapPin className="h-3.5 w-3.5" />
            <span>Manzil tanlanmagan</span>
            <span className="mx-1 text-ink-faint">·</span>
            <Link href="/profile" className="font-medium text-brand-700 hover:underline">
              qo&apos;shish
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Kategoriyalar</h2>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
          >
            Hammasi <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <IconTile
                icon={c.icon}
                label={c.label}
                caption={c.caption}
                tone={c.tone}
                href={`/catalog/${c.slug}`}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Quick facts strip */}
      <section className="rounded-xl border border-line bg-surface shadow-card">
        <ul className="grid grid-cols-3 divide-x divide-line-soft">
          {quickFacts.map((f) => {
            const Icon = f.icon;
            return (
              <li key={f.label} className="flex flex-col items-center gap-1.5 py-3 px-2 text-center">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-[11px] font-medium text-ink-soft leading-tight">
                  {f.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Nearby stores placeholder — replaced once /api/v1/stores is live */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Yaqin sotuvchilar</h2>
          <span className="text-[11px] uppercase tracking-wider text-ink-faint">
            Tez orada
          </span>
        </div>
        <div className="rounded-xl border border-dashed border-line bg-surface p-5 flex flex-col items-center text-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Store className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-ink">Manzilingizni qo&apos;shing</p>
          <p className="text-xs text-ink-muted max-w-xs">
            Manzil tanlanganda — yaqin atrofdagi sotuvchilar va yetkazib berish vaqti ko&apos;rinadi.
          </p>
        </div>
      </section>
    </div>
  );
}
