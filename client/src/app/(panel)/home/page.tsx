"use client";

import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  ShoppingBasket,
  Sparkles,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Avatar } from "@/shared/ui/Avatar";
import { IconTile } from "@/shared/ui/IconTile";
import { Spinner } from "@/shared/ui/Spinner";
import { useAuthStore } from "@/shared/auth/store";
import { useCategoriesTree, useStoresNearby } from "@/features/catalog/hooks";
import { useActiveLocation } from "@/features/location/hooks";
import type { CategoryType } from "@/features/catalog/types";
import { formatPhone, formatSum } from "@/shared/lib/format";

const quickFacts = [
  { icon: Store, label: "Yaqin sotuvchilar" },
  { icon: Truck, label: "Tez yetkazib berish" },
  { icon: Sparkles, label: "Naqd yoki online" },
];

// Rotate the decorative tones so the tile grid stays colorful without
// hardcoding a tone per (dynamic) category.
const TILE_TONES = ["rose", "emerald", "amber", "sky", "violet", "brand"] as const;
const tileIcon = (type: CategoryType) =>
  type === "FOOD" ? UtensilsCrossed : ShoppingBasket;

export default function HomePage() {
  const me = useAuthStore((s) => s.me);
  const name = me?.firstName || (me?.phone ? formatPhone(me.phone) : "Mehmon");

  const { data: tree, loading: catLoading } = useCategoriesTree();
  const location = useActiveLocation();
  const topCategories = (tree ?? []).slice(0, 12);

  const geo = location ? { lat: location.lat, lng: location.lng } : null;
  const { data: nearby, loading: nearbyLoading } = useStoresNearby(geo);

  return (
    <div className="flex flex-col gap-6">
      {/* Promo banner — Uzum-style full-bleed hero with greeting + CTA */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-premium p-5 lg:p-8 text-white shadow-card">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-4">
          <Avatar name={name} size={48} className="ring-2 ring-white/40" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/80">BeeExpress</p>
            <h1 className="truncate text-xl lg:text-2xl font-bold tracking-tight">
              Salom, {name}
            </h1>
          </div>
        </div>
        <p className="relative mt-3 max-w-lg text-sm text-white/90">
          Yaqin atrofdagi sotuvchilardan tez yetkazib berish. Kategoriyani tanlang
          yoki mahsulot qidiring.
        </p>
        <div className="relative mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/catalog"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-white/90"
          >
            Xarid qilish <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-white/90">
            <MapPin className="h-3.5 w-3.5" />
            <span className="max-w-45 truncate">
              {location?.label ?? "Manzil tanlanmagan"}
            </span>
            <span className="mx-0.5 text-white/50">·</span>
            <Link href="/addresses" className="font-semibold underline underline-offset-2">
              {location ? "o'zgartirish" : "qo'shish"}
            </Link>
          </span>
        </div>
      </section>

      {/* Categories */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Kategoriyalar</h2>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
          >
            Hammasi <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {catLoading && !tree ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : topCategories.length === 0 ? (
          <p className="text-xs text-ink-muted">Hali kategoriya yo&apos;q.</p>
        ) : (
          <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {topCategories.map((c, i) => (
              <li key={c.id}>
                <IconTile
                  icon={tileIcon(c.type)}
                  imageUrl={c.iconUrl}
                  label={c.name}
                  caption={c.children.length > 0 ? `${c.children.length} ta bo'lim` : undefined}
                  tone={TILE_TONES[i % TILE_TONES.length]}
                  href={`/c/${c.slug}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick facts strip */}
      <section className="rounded-2xl border border-line/70 bg-surface shadow-card">
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

      {/* Nearby stores — ACTIVE+open sellers within the buyer's delivery radius */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-ink">Yaqin sotuvchilar</h2>
        {!geo ? (
          <div className="rounded-xl border border-dashed border-line bg-surface p-5 flex flex-col items-center text-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Store className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <p className="text-sm text-ink">Manzilingizni qo&apos;shing</p>
            <p className="text-xs text-ink-muted max-w-xs">
              Manzil tanlanganda — yaqin atrofdagi sotuvchilar va yetkazib berish vaqti ko&apos;rinadi.
            </p>
            <Link href="/addresses" className="text-xs font-medium text-brand-700 hover:underline">
              Manzil qo&apos;shish
            </Link>
          </div>
        ) : nearbyLoading && !nearby ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : !nearby || nearby.length === 0 ? (
          <p className="text-xs text-ink-muted">
            Yaqin atrofda hozir ochiq sotuvchi topilmadi.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {nearby.map((s) => (
              <li key={s.id}>
                <div className="flex items-center gap-3 rounded-2xl border border-line/70 bg-surface p-3 transition-all hover:-translate-y-0.5 hover:shadow-hover">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-brand-600">
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-5 w-5" strokeWidth={1.75} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{s.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-muted">
                      <span className="tabular-nums">{s.distanceKm} km</span>
                      {s.deliveryEtaMinutes ? (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Truck className="h-3 w-3" /> ~{s.deliveryEtaMinutes} daq
                          </span>
                        </>
                      ) : null}
                      {s.deliveryBaseFee && s.deliveryBaseFee > 0 ? (
                        <>
                          <span>·</span>
                          <span>{formatSum(s.deliveryBaseFee)} dan</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
