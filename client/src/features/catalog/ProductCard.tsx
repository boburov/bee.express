"use client";

import Link from "next/link";
import { Heart, ShoppingBag, ShoppingCart, Star, Store } from "lucide-react";
import type { ListedProduct } from "./types";
import { formatSum } from "@/shared/lib/format";

interface ProductCardProps {
  product: ListedProduct;
}

/**
 * Uzum Market-style product card. Tap → /p/[slug].
 *
 * Layout mirrors Uzum: contained image on white with a favorite heart, a
 * discount flag, a monthly-installment pill, bold price with a struck-through
 * old price, title, rating, seller line and an "add to cart" affordance.
 * The best (lowest-price) offer drives the pricing; the detail page lists all.
 */
export function ProductCard({ product }: ProductCardProps) {
  const offer = product.bestOffer;
  const hasDiscount = !!offer && offer.oldPrice != null && offer.oldPrice > offer.price;
  const discountPct = hasDiscount
    ? Math.round(((offer!.oldPrice! - offer!.price) / offer!.oldPrice!) * 100)
    : 0;
  // Uzum-style "per month" installment hint (12 months, indicative only).
  const monthly = offer ? Math.round(offer.price / 12) : 0;

  return (
    <Link
      href={`/p/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line/70 bg-surface transition-all hover:-translate-y-0.5 hover:shadow-hover"
    >
      {/* Media */}
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-faint">
            <ShoppingBag className="h-9 w-9" />
          </div>
        )}

        {hasDiscount ? (
          <span className="absolute left-2 top-2 inline-flex items-center rounded-lg bg-danger px-1.5 py-0.5 text-[11px] font-bold text-white">
            −{discountPct}%
          </span>
        ) : null}

        {/* Favorite affordance — visual, matches Uzum's card chrome */}
        <span
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-ink-muted shadow-card backdrop-blur transition-colors group-hover:text-brand-500"
          aria-hidden
        >
          <Heart className="h-4.5 w-4.5" strokeWidth={1.75} />
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {offer ? (
          <>
            {/* Monthly installment pill */}
            <span className="inline-flex w-fit items-center rounded-lg bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
              {formatSum(monthly)}/oy
            </span>

            {/* Price */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[15px] font-bold text-ink tabular-nums">
                {formatSum(offer.price)}
              </span>
              {hasDiscount ? (
                <span className="text-[11px] text-ink-faint line-through tabular-nums">
                  {formatSum(offer.oldPrice!)}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-[11px] font-medium text-ink-faint">Hozir mavjud emas</p>
        )}

        {/* Title */}
        <h3 className="line-clamp-2 text-[13px] leading-snug text-ink-soft">
          {product.title}
        </h3>

        {/* Rating */}
        {product.ratingCount > 0 ? (
          <div className="flex items-center gap-1 text-[11px] text-ink-muted">
            <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
            <span className="font-medium text-ink-soft tabular-nums">
              {product.ratingAvg.toFixed(1)}
            </span>
            <span className="text-ink-faint">({product.ratingCount})</span>
          </div>
        ) : null}

        {/* Seller */}
        {offer ? (
          <div className="flex items-center gap-1 truncate text-[11px] text-ink-muted">
            <Store className="h-3 w-3 shrink-0" />
            <span className="truncate">{offer.storeName}</span>
            {offer.distanceKm !== null ? (
              <span className="shrink-0 tabular-nums">· {offer.distanceKm.toFixed(1)}km</span>
            ) : null}
          </div>
        ) : null}

        {/* CTA — visual add-to-cart, navigates to detail to choose an offer */}
        {offer ? (
          <span
            className="mt-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand-500 pt-px text-[13px] font-semibold text-white transition-colors group-hover:bg-brand-600"
            aria-hidden
          >
            <ShoppingCart className="h-4 w-4" strokeWidth={2} />
            Savatga
          </span>
        ) : null}

        {offer && !offer.storeIsOpen ? (
          <span className="inline-flex w-fit items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            Hozir yopiq
          </span>
        ) : null}
      </div>
    </Link>
  );
}
