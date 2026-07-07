"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Store as StoreIcon,
  Truck,
} from "lucide-react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useStoreMenu } from "@/features/catalog/hooks";
import { useActiveLocation } from "@/features/location/hooks";
import { useCartStore } from "@/features/cart/store";
import type { StoreMenuItem } from "@/features/catalog/types";
import { formatSum } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

/**
 * Restaurant page — a single store's menu grouped by category. The buyer lands
 * here after tapping a restaurant on the home screen, browses only this store's
 * dishes, and adds them straight to the cart (the floating cart pill + BottomNav
 * carry them to checkout). Multi-variant products open the product page for the
 * full picker instead of a one-tap add.
 */
export default function StorePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? null;

  const location = useActiveLocation();
  const geo = location ? { lat: location.lat, lng: location.lng } : null;
  const { data, loading, error } = useStoreMenu(slug, geo);

  const cart = useCartStore((s) => s.cart);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  const [busyOffer, setBusyOffer] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [topOffset, setTopOffset] = useState(56);
  const tabsRef = useRef<HTMLDivElement>(null);

  // The app topbar is sticky and its mobile height varies (two rows) — measure
  // it so the category tabs pin directly beneath it instead of behind it.
  useEffect(() => {
    const measure = () => {
      const header = document.querySelector("header");
      setTopOffset(header ? header.offsetHeight : 56);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // offerId → { itemId, qty, stock } so each row can show a live stepper.
  const cartByOffer = useMemo(() => {
    const m = new Map<string, { itemId: string; qty: number; stock: number }>();
    cart?.stores.forEach((g) =>
      g.items.forEach((it) => m.set(it.offerId, { itemId: it.id, qty: it.qty, stock: it.stock })),
    );
    return m;
  }, [cart]);

  const categories = data?.categories ?? [];

  // Scroll-spy: highlight the tab of the section nearest the top (just under
  // the topbar + tabs bar).
  useEffect(() => {
    if (categories.length === 0) return;
    const top = topOffset + (tabsRef.current?.offsetHeight ?? 48);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveCat(e.target.id.replace("cat-", ""));
        }
      },
      { rootMargin: `-${top + 4}px 0px -70% 0px`, threshold: 0 },
    );
    categories.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories, topOffset]);

  function scrollToCat(id: string) {
    setActiveCat(id);
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    const tabsH = tabsRef.current?.offsetHeight ?? 48;
    const y = el.getBoundingClientRect().top + window.scrollY - topOffset - tabsH - 8;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  async function onAdd(item: StoreMenuItem) {
    // Multi-variant dishes need the picker — send them to the product page.
    if (item.variantCount > 1) {
      router.push(`/p/${item.slug}`);
      return;
    }
    setAddError(null);
    setBusyOffer(item.offerId);
    try {
      await addItem(item.offerId, 1);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setAddError(Array.isArray(msg) ? msg[0] : msg || "Savatga qo'shilmadi");
    } finally {
      setBusyOffer(null);
    }
  }

  async function onStep(offerId: string, itemId: string, nextQty: number, stock: number) {
    if (nextQty > stock) return;
    setBusyOffer(offerId);
    try {
      if (nextQty < 1) await removeItem(itemId);
      else await updateQty(itemId, nextQty);
    } catch {
      /* store keeps the error */
    } finally {
      setBusyOffer(null);
    }
  }

  if (loading && !data) return <StoreSkeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/home" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Bosh sahifa
        </Link>
        <EmptyState
          icon={<StoreIcon className="h-6 w-6" />}
          title="Do'kon topilmadi"
          description={error ?? "Bu do'kon mavjud emas yoki hozircha yopiq."}
          action={<Link href="/home" className="text-sm font-semibold text-brand-700 hover:underline">Restoranlarga qaytish</Link>}
        />
      </div>
    );
  }

  const s = data.store;

  return (
    <div className="-mx-4 lg:-mx-6 -mt-4 lg:-mt-6 flex flex-col">
      {/* ─── Hero banner ─────────────────────────────────────────── */}
      <section className="relative h-44 lg:h-60 w-full overflow-hidden">
        {s.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-premium" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" aria-hidden />
        <button
          type="button"
          onClick={() => router.back()}
          className="press absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface/95 text-ink shadow-card"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {!s.openNow ? (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <Clock className="h-3.5 w-3.5" /> Hozir yopiq
          </span>
        ) : null}
      </section>

      {/* ─── Store header card (overlaps banner) ─────────────────── */}
      <div className="px-4 lg:px-6">
        <div className="-mt-10 relative rounded-3xl bg-surface p-4 shadow-pop">
          <div className="flex items-start gap-3">
            <span className="-mt-10 inline-flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface ring-4 ring-surface shadow-card">
              {s.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-600">
                  <StoreIcon className="h-7 w-7" strokeWidth={1.75} />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold tracking-tight text-ink leading-tight">{s.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                {s.ratingCount > 0 ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-ink-soft">
                    <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                    {s.ratingAvg.toFixed(1)}
                    <span className="font-normal text-ink-faint">({s.ratingCount})</span>
                  </span>
                ) : (
                  <span className="text-ink-faint">Yangi</span>
                )}
                {s.deliveryEtaMinutes ? (
                  <span className="inline-flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" /> ~{s.deliveryEtaMinutes} daq
                  </span>
                ) : null}
                {s.distanceKm !== null ? (
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <MapPin className="h-3.5 w-3.5" /> {s.distanceKm} km
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {s.address ? (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-muted">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{s.address}</span>
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 font-medium text-ink-soft">
              <Truck className="h-3 w-3 text-ink-muted" />
              {s.deliveryBaseFee && s.deliveryBaseFee > 0
                ? `${formatSum(s.deliveryBaseFee)} dan`
                : "Bepul yetkazish"}
            </span>
            {s.minOrderAmount && s.minOrderAmount > 0 ? (
              <span className="rounded-full bg-surface-3 px-2.5 py-1 font-medium text-ink-soft">
                Min. {formatSum(s.minOrderAmount)}
              </span>
            ) : null}
          </div>

          {geo && !s.deliverable && s.openNow ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-danger">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Bu manzil do&apos;konning yetkazib berish radiusidan tashqarida.
            </p>
          ) : null}
        </div>
      </div>

      {addError ? (
        <div className="mx-4 lg:mx-6 mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{addError}</span>
        </div>
      ) : null}

      {data.itemCount === 0 ? (
        <div className="px-4 lg:px-6 mt-4">
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6" />}
            title="Menyu hozircha bo'sh"
            description="Bu do'kon hali mahsulot qo'shmagan. Keyinroq qayta urinib ko'ring."
          />
        </div>
      ) : (
        <>
          {/* ─── Sticky category tabs ──────────────────────────────── */}
          <div
            ref={tabsRef}
            style={{ top: topOffset }}
            className="sticky z-20 mt-4 border-y border-line/70 bg-surface/95 backdrop-blur"
          >
            <div className="-mx-0 px-4 lg:px-6 overflow-x-auto no-scrollbar">
              <ul className="flex gap-2 w-max py-2.5">
                {categories.map((c) => {
                  const on = activeCat === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => scrollToCat(c.id)}
                        className={cn(
                          "press h-9 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
                          on
                            ? "bg-gradient-premium text-white shadow-cta"
                            : "bg-surface-3 text-ink-soft hover:bg-brand-50 hover:text-brand-700",
                        )}
                      >
                        {c.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* ─── Menu sections ─────────────────────────────────────── */}
          <div className="px-4 lg:px-6 py-4 flex flex-col gap-7">
            {categories.map((c) => (
              <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-28 flex flex-col gap-3">
                <h2 className="text-lg font-bold tracking-tight text-ink">{c.name}</h2>
                <ul className="flex flex-col gap-3">
                  {c.items.map((item) => {
                    const inCart = cartByOffer.get(item.offerId);
                    const busy = busyOffer === item.offerId;
                    return (
                      <li key={item.productId}>
                        <MenuRow
                          item={item}
                          qty={inCart?.qty ?? 0}
                          busy={busy}
                          onOpen={() => router.push(`/p/${item.slug}`)}
                          onAdd={() => onAdd(item)}
                          onInc={() =>
                            inCart &&
                            onStep(item.offerId, inCart.itemId, inCart.qty + 1, inCart.stock)
                          }
                          onDec={() =>
                            inCart &&
                            onStep(item.offerId, inCart.itemId, inCart.qty - 1, inCart.stock)
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MenuRow({
  item,
  qty,
  busy,
  onOpen,
  onAdd,
  onInc,
  onDec,
}: {
  item: StoreMenuItem;
  qty: number;
  busy: boolean;
  onOpen: () => void;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
}) {
  const hasDiscount = item.oldPrice != null && item.oldPrice > item.price;
  return (
    <div className="flex gap-3 rounded-2xl bg-surface p-3 shadow-card">
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <h3 className="text-sm font-bold text-ink line-clamp-2">{item.title}</h3>
        {item.description ? (
          <p className="mt-1 text-xs text-ink-muted line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        ) : null}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-ink tabular-nums">{formatSum(item.price)}</span>
          {hasDiscount ? (
            <span className="text-xs text-ink-faint line-through tabular-nums">
              {formatSum(item.oldPrice!)}
            </span>
          ) : null}
        </div>
      </button>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={onOpen}
          className="block h-24 w-24 overflow-hidden rounded-2xl bg-surface-3"
          aria-label={item.title}
        >
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-ink-faint">
              <ShoppingBag className="h-7 w-7" />
            </span>
          )}
        </button>

        {/* Add / stepper control overlaps the image bottom-right (Wolt style). */}
        <div className="absolute -bottom-2 right-1">
          {qty > 0 ? (
            <div className="flex items-center gap-0.5 rounded-full bg-surface p-1 shadow-pop">
              <button
                type="button"
                onClick={onDec}
                disabled={busy}
                aria-label="Kamaytirish"
                className="press inline-flex h-7 w-7 items-center justify-center rounded-full text-brand-600 hover:bg-brand-50 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" strokeWidth={2.25} />
              </button>
              <span className="w-5 text-center text-sm font-bold text-ink tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={onInc}
                disabled={busy || qty >= item.stock}
                aria-label="Ko'paytirish"
                className="press inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-premium text-white shadow-cta disabled:opacity-40"
              >
                <Plus className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              disabled={busy}
              aria-label={`${item.title} — savatga qo'shish`}
              className="press inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-brand-600 shadow-pop ring-1 ring-line/60 hover:text-brand-700 disabled:opacity-50"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StoreSkeleton() {
  return (
    <div className="-mx-4 lg:-mx-6 -mt-4 lg:-mt-6 flex flex-col">
      <Skeleton className="h-44 lg:h-60 w-full" rounded="md" />
      <div className="px-4 lg:px-6">
        <div className="-mt-10 relative rounded-3xl bg-surface p-4 shadow-pop">
          <div className="flex gap-3">
            <Skeleton className="-mt-10 h-18 w-18" rounded="2xl" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 lg:px-6 py-6 flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-2xl bg-surface p-3 shadow-card">
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-4 w-20 mt-1" />
            </div>
            <Skeleton className="h-24 w-24" rounded="2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
