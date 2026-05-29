"use client";

import Link from "next/link";
import { ShoppingBag, Star, Store } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import type { ListedProduct } from "./types";
import { formatSum } from "@/shared/lib/format";

interface ProductCardProps {
  product: ListedProduct;
}

/**
 * Compact product card for the catalog grid. Tap → /p/[slug].
 *
 * The card shows the best offer (lowest price); detail page lists all offers.
 * Out-of-stock products are filtered server-side, so a missing bestOffer
 * means "no nearby store carries this" (filtered for the buyer's location).
 */
export function ProductCard({ product }: ProductCardProps) {
  const offer = product.bestOffer;
  return (
    <Link href={`/p/${product.slug}`} className="block group">
      <Card className="h-full overflow-hidden">
        <div className="aspect-square w-full bg-surface-3 overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-ink-faint">
              <ShoppingBag className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col gap-1.5">
          <h3 className="text-sm font-medium text-ink line-clamp-2 leading-tight">
            {product.title}
          </h3>
          {product.ratingCount > 0 ? (
            <div className="flex items-center gap-1 text-[11px] text-ink-muted">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">{product.ratingAvg.toFixed(1)}</span>
              <span>·</span>
              <span>{product.ratingCount} ta</span>
            </div>
          ) : null}
          {offer ? (
            <>
              <p className="text-sm font-semibold text-ink tabular-nums">
                {formatSum(offer.price)}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-ink-muted truncate">
                <Store className="h-3 w-3 shrink-0" />
                <span className="truncate">{offer.storeName}</span>
                {offer.distanceKm !== null ? (
                  <span className="tabular-nums shrink-0">· {offer.distanceKm.toFixed(1)}km</span>
                ) : null}
              </div>
              {!offer.storeIsOpen ? (
                <Badge tone="warning" className="self-start">Yopiq</Badge>
              ) : null}
            </>
          ) : (
            <p className="text-[11px] text-ink-faint">Hozir mavjud emas</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
