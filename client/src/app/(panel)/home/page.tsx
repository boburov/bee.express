"use client";

import Link from "next/link";
import {
  ArrowRight,
  Flame,
  MapPin,
  Search,
  ShoppingBasket,
  Sparkles,
  Star,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useAuthStore } from "@/shared/auth/store";
import {
  useCategoriesTree,
  useFeaturedStores,
  useStoresNearby,
} from "@/features/catalog/hooks";
import { useActiveLocation } from "@/features/location/hooks";
import type { CategoryType, FeaturedStore } from "@/features/catalog/types";
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
  const { data: featured, loading: featuredLoading } = useFeaturedStores(geo, 10);
  const { data: nearby, loading: nearbyLoading } = useStoresNearby(geo, 12);

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Appetite hero — greeting + search CTA + location ─────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-premium p-5 lg:p-8 text-white shadow-pop animate-fade-up">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <div className="absolute -bottom-20 right-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            BeeExpress
          </p>
          <h1 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight">
            Salom, {name}
          </h1>
          <p className="mt-1.5 max-w-lg text-sm text-white/90">
            Sevimli taomlaringiz va yaqin sotuvchilar — bir necha tapda yetkazib beramiz.
          </p>

          {/* Search affordance — big, tappable */}
          <Link
            href="/catalog"
            className="press mt-4 flex h-12 items-center gap-2.5 rounded-2xl bg-white/95 pl-4 pr-1.5 text-sm text-ink-muted shadow-card"
          >
            <Search className="h-5 w-5 shrink-0 text-brand-500" strokeWidth={2} />
            <span className="flex-1 truncate text-left">Taom yoki do&apos;kon qidiring</span>
            <span className="inline-flex h-9 items-center rounded-xl bg-gradient-premium px-4 text-xs font-semibold text-white">
              Qidirish
            </span>
          </Link>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-white/90">
            <MapPin className="h-3.5 w-3.5" />
            <span className="max-w-45 truncate">
              {location?.label ?? "Manzil tanlanmagan"}
            </span>
            <span className="mx-0.5 text-white/50">·</span>
            <Link href="/addresses" className="font-semibold underline underline-offset-2">
              {location ? "o'zgartirish" : "qo'shish"}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ① TOP restaurants — editorially-curated slider ───────── */}
      {featuredLoading && !featured ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold tracking-tight text-ink">TOP restoranlar</h2>
          <div className="-mx-4 px-4 flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-[78%] max-w-xs shrink-0 overflow-hidden rounded-2xl bg-surface shadow-card">
                <Skeleton className="h-36 w-full" rounded="md" />
                <div className="flex flex-col gap-2 p-3">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : featured && featured.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="inline-flex items-center gap-1.5 text-lg font-bold tracking-tight text-ink">
            <Flame className="h-5 w-5 text-hot-500" strokeWidth={2} />
            TOP restoranlar
          </h2>
          <ul className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
            {featured.map((s) => (
              <li key={s.id} className="w-[78%] max-w-xs shrink-0 snap-start">
                <FeaturedCard store={s} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ─── ② Restaurants & shops near the buyer ─────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold tracking-tight text-ink">Sizga yaqin restoranlar</h2>
        {!geo ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface p-6 text-center shadow-card">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Store className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <p className="text-sm font-semibold text-ink">Manzilingizni qo&apos;shing</p>
            <p className="max-w-xs text-xs text-ink-muted">
              Manzil tanlanganda — yaqin atrofdagi restoran va do&apos;konlar hamda yetkazib berish vaqti ko&apos;rinadi.
            </p>
            <Link href="/addresses" className="text-xs font-semibold text-brand-700 hover:underline">
              Manzil qo&apos;shish
            </Link>
          </div>
        ) : nearbyLoading && !nearby ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="overflow-hidden rounded-2xl bg-surface shadow-card">
                <Skeleton className="h-32 w-full" rounded="md" />
                <div className="flex flex-col gap-2 p-3">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </li>
            ))}
          </ul>
        ) : !nearby || nearby.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Yaqin atrofda hozir ochiq restoran yoki do&apos;kon topilmadi.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearby.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/store/${s.slug}`}
                  className="press block h-full overflow-hidden rounded-2xl bg-surface shadow-card hover:shadow-hover"
                >
                  {/* Cover */}
                  <div className="relative h-32 w-full overflow-hidden">
                    {s.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.bannerUrl} alt="" className="h-full w-full object-cover" />
                    ) : s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-premium" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/35 to-transparent" aria-hidden />
                    {s.ratingCount > 0 ? (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface/95 px-2 py-0.5 text-[11px] font-bold text-ink shadow-card">
                        <Star className="h-3 w-3 fill-accent-400 text-accent-400" />
                        {s.ratingAvg.toFixed(1)}
                      </span>
                    ) : (
                      <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-surface/95 px-2 py-0.5 text-[11px] font-bold text-brand-700 shadow-card">
                        Yangi
                      </span>
                    )}
                    {s.deliveryEtaMinutes ? (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                        <Truck className="h-3 w-3" /> ~{s.deliveryEtaMinutes} daq
                      </span>
                    ) : null}
                    {/* Logo chip */}
                    <span className="absolute -bottom-4 right-3 inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-surface shadow-pop ring-2 ring-surface">
                      {s.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.logoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-5 w-5 text-brand-600" strokeWidth={1.75} />
                      )}
                    </span>
                  </div>
                  {/* Body */}
                  <div className="p-3">
                    <p className="truncate pr-10 text-sm font-bold text-ink">{s.name}</p>
                    {s.address ? (
                      <p className="mt-0.5 truncate text-[11px] text-ink-muted">{s.address}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2 py-0.5 font-medium text-ink-soft tabular-nums">
                        <MapPin className="h-3 w-3 text-ink-muted" /> {s.distanceKm} km
                      </span>
                      {s.deliveryBaseFee && s.deliveryBaseFee > 0 ? (
                        <span className="rounded-full bg-surface-3 px-2 py-0.5 font-medium text-ink-soft">
                          {formatSum(s.deliveryBaseFee)} dan
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 font-semibold text-success">
                          Bepul yetkazish
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── ③ Categories — horizontal rail ──────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-ink">Kategoriyalar</h2>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
          >
            Hammasi <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {catLoading && !tree ? (
          <div className="-mx-4 px-4 flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex w-18 shrink-0 flex-col items-center gap-2">
                <Skeleton className="h-16 w-16" rounded="2xl" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : topCategories.length === 0 ? (
          <p className="text-sm text-ink-muted">Hali kategoriya yo&apos;q.</p>
        ) : (
          <ul className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {topCategories.map((c, i) => {
              const t = TILE_TONES[i % TILE_TONES.length];
              const Icon = tileIcon(c.type);
              return (
                <li key={c.id} className="w-18 shrink-0">
                  <CategoryChip
                    href={`/c/${c.slug}`}
                    label={c.name}
                    imageUrl={c.iconUrl}
                    icon={Icon}
                    tone={t}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ─── Quick facts strip ───────────────────────────────────── */}
      <section className="rounded-2xl bg-surface shadow-card">
        <ul className="grid grid-cols-3 divide-x divide-line-soft">
          {quickFacts.map((f) => {
            const Icon = f.icon;
            return (
              <li key={f.label} className="flex flex-col items-center gap-1.5 py-3.5 px-2 text-center">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <span className="text-[11px] font-medium text-ink-soft leading-tight">
                  {f.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/** Large featured-restaurant card used inside the TOP slider. */
function FeaturedCard({ store: s }: { store: FeaturedStore }) {
  return (
    <Link
      href={`/store/${s.slug}`}
      className="press block h-full overflow-hidden rounded-2xl bg-surface shadow-card hover:shadow-hover"
    >
      <div className="relative h-36 w-full overflow-hidden">
        {s.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : s.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-premium" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/45 to-transparent" aria-hidden />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-premium px-2.5 py-0.5 text-[11px] font-bold text-white shadow-cta">
          <Flame className="h-3 w-3" /> TOP
        </span>
        {s.ratingCount > 0 ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface/95 px-2 py-0.5 text-[11px] font-bold text-ink shadow-card">
            <Star className="h-3 w-3 fill-accent-400 text-accent-400" />
            {s.ratingAvg.toFixed(1)}
          </span>
        ) : null}
        {!s.openNow ? (
          <span className="absolute bottom-2 left-2 inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            Hozir yopiq
          </span>
        ) : s.deliveryEtaMinutes ? (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            <Truck className="h-3 w-3" /> ~{s.deliveryEtaMinutes} daq
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-bold text-ink">{s.name}</p>
        {s.address ? (
          <p className="mt-0.5 truncate text-[11px] text-ink-muted">{s.address}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          {s.distanceKm !== null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2 py-0.5 font-medium text-ink-soft tabular-nums">
              <MapPin className="h-3 w-3 text-ink-muted" /> {s.distanceKm} km
            </span>
          ) : null}
          {s.deliveryBaseFee && s.deliveryBaseFee > 0 ? (
            <span className="rounded-full bg-surface-3 px-2 py-0.5 font-medium text-ink-soft">
              {formatSum(s.deliveryBaseFee)} dan
            </span>
          ) : (
            <span className="rounded-full bg-green-50 px-2 py-0.5 font-semibold text-success">
              Bepul yetkazish
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Circular horizontal-rail category chip (image or icon + label underneath). */
function CategoryChip({
  href,
  label,
  imageUrl,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  imageUrl?: string | null;
  icon: typeof Store;
  tone: (typeof TILE_TONES)[number];
}) {
  const bg: Record<(typeof TILE_TONES)[number], string> = {
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
    brand: "bg-brand-50 text-brand-600",
  };
  return (
    <Link href={href} className="press flex flex-col items-center gap-2 text-center">
      <span
        className={`inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-card ${bg[tone]}`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-contain p-2" />
        ) : (
          <Icon className="h-7 w-7" strokeWidth={1.75} />
        )}
      </span>
      <span className="line-clamp-2 text-[11px] font-medium leading-tight text-ink-soft">
        {label}
      </span>
    </Link>
  );
}
