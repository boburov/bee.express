"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Store, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { useCartStore } from "@/features/cart/store";
import { formatSum } from "@/shared/lib/format";

export default function CartPage() {
  const cart = useCartStore((s) => s.cart);
  const loading = useCartStore((s) => s.loading);
  const error = useCartStore((s) => s.error);
  const fetchCart = useCartStore((s) => s.fetch);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  // Track per-item action state so the whole UI doesn't spin together.
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  async function onQtyChange(itemId: string, nextQty: number) {
    if (nextQty < 1) return;
    setBusyItemId(itemId);
    try {
      await updateQty(itemId, nextQty);
    } catch {
      // store keeps error
    } finally {
      setBusyItemId(null);
    }
  }

  async function onRemove(itemId: string) {
    setBusyItemId(itemId);
    try {
      await removeItem(itemId);
    } finally {
      setBusyItemId(null);
    }
  }

  if (loading && !cart) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const isEmpty = !cart || cart.itemCount === 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Savat"
        description={isEmpty ? "Tanlangan mahsulotlar va yetkazib berish manzili." : `${cart!.itemCount} ta mahsulot · ${cart!.stores.length} do'kondan`}
        actions={
          !isEmpty ? (
            <button
              type="button"
              onClick={() => { if (confirm("Savat tozalansinmi?")) clear(); }}
              className="text-xs text-ink-muted hover:text-danger"
            >
              Tozalash
            </button>
          ) : null
        }
      />

      {error ? (
        <Card>
          <div className="p-4 flex items-start gap-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        </Card>
      ) : null}

      {isEmpty ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Savat hozircha bo'sh"
          description="Katalogdan birinchi mahsulotingizni tanlang — narxi, qoldig'i va yetkazib berish vaqti darhol ko'rinadi."
          action={
            <Link href="/catalog">
              <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Katalogni ochish</Button>
            </Link>
          }
        />
      ) : (
        <>
          {cart!.stores.map((group) => (
            <Card key={group.store.id}>
              <div className="p-4 border-b border-line-soft flex items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 overflow-hidden">
                  {group.store.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={group.store.logoUrl} alt={group.store.name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <Store className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-ink truncate">{group.store.name}</h3>
                  <p className="text-xs text-ink-muted">{formatSum(group.subtotal)}</p>
                </div>
                {!group.store.isOpen ? <Badge tone="warning">Yopiq</Badge> : null}
              </div>

              <ul className="divide-y divide-line-soft">
                {group.items.map((item) => {
                  const busy = busyItemId === item.id;
                  return (
                    <li key={item.id} className="p-4 flex gap-3">
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-surface-3 border border-line-soft overflow-hidden">
                        {item.product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.product.image} alt={item.product.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-ink-faint">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h4 className="text-sm font-medium text-ink line-clamp-2">{item.product.title}</h4>
                        {item.variant.sku ? (
                          <p className="text-[11px] text-ink-faint">SKU: {item.variant.sku}</p>
                        ) : null}
                        {item.priceChanged ? (
                          <p className="text-[11px] text-warning flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Narx o&apos;zgardi: {formatSum(item.livePrice)}
                          </p>
                        ) : null}
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm font-semibold text-ink">{formatSum(item.subtotal)}</p>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onQtyChange(item.id, item.qty - 1)}
                              disabled={busy || item.qty <= 1}
                              aria-label="Kamaytirish"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-muted hover:bg-surface-3 disabled:opacity-40"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-7 text-center text-sm font-medium text-ink">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => onQtyChange(item.id, item.qty + 1)}
                              disabled={busy || item.qty >= item.stock}
                              aria-label="Ko'paytirish"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-muted hover:bg-surface-3 disabled:opacity-40"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemove(item.id)}
                              disabled={busy}
                              aria-label="O'chirish"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-red-50 hover:text-danger disabled:opacity-40 ml-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}

          <Card>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-muted">Jami ({cart!.itemCount} ta)</p>
                <p className="text-lg font-semibold text-ink">{formatSum(cart!.subtotal)}</p>
                <p className="text-[11px] text-ink-faint mt-0.5">Yetkazib berish narxi keyingi qadamda hisoblanadi</p>
              </div>
              <Link href="/checkout">
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Buyurtma berish</Button>
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
