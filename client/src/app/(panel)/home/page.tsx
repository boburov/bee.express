"use client";

import Link from "next/link";
import {
  ArrowRight,
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
import { Spinner } from "@/shared/ui/Spinner";
import { useAuthStore } from "@/shared/auth/store";
import { useCategoriesTree, useStoresNearby } from "@/features/catalog/hooks";
import { useActiveLocation } from "@/features/location/hooks";
import type { CategoryType } from "@/features/catalog/types";
import { formatSum } from "@/shared/lib/format";

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
  const name = me?.firstName ?? (me?.phone ? `+${me.phone}` : "Mehmon");

  const { data: tree, loading: catLoading } = useCategoriesTree();
  const location = useActiveLocation();
  const topCategories = (tree ?? []).slice(0, 8);

  const geo = location ? { lat: location.lat, lng: location.lng } : null;
  const { data: nearby, loading: nearbyLoading } = useStoresNearby(geo);

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
            <span className="truncate max-w-45">
              {location?.label ?? "Manzil tanlanmagan"}
            </span>
            <span className="mx-1 text-ink-faint">·</span>
            <Link href="/addresses" className="font-medium text-brand-700 hover:underline">
              {location ? "o'zgartirish" : "qo'shish"}
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
        {catLoading && !tree ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : topCategories.length === 0 ? (
          <p className="text-xs text-ink-muted">Hali kategoriya yo&apos;q.</p>
        ) : (
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Nearby stores — ACTIVE+open sellers within the buyer's delivery radius */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink">Yaqin sotuvchilar</h2>
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
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-card">
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
