"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Spinner } from "@/shared/ui/Spinner";
import { useProduct } from "@/features/catalog/hooks";
import { useActiveLocation } from "@/features/location/hooks";
import { useCartStore } from "@/features/cart/store";
import type { VariantOffer } from "@/features/catalog/types";
import { formatSum } from "@/shared/lib/format";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? null;

  // Feed the buyer's active location (seeded from their default address) so
  // the backend can radius-filter offers and compute per-store delivery fees.
  const location = useActiveLocation();
  const geo = location ? { lat: location.lat, lng: location.lng } : undefined;
  const { data: product, loading, error } = useProduct(slug, geo);

  const addToCart = useCartStore((s) => s.addItem);
  const cartLoading = useCartStore((s) => s.loading);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imageIdx, setImageIdx] = useState(0);
  const [addError, setAddError] = useState<string | null>(null);
  const [addOk, setAddOk] = useState(false);

  // Default selections — first variant + its cheapest in-stock offer.
  useEffect(() => {
    if (!product) return;
    const first = product.variants[0];
    if (first && !selectedVariantId) {
      setSelectedVariantId(first.id);
      const offer = first.offers.find((o) => o.stock > 0 && !o.outOfRange);
      if (offer) setSelectedOfferId(offer.id);
    }
  }, [product, selectedVariantId]);

  const selectedVariant = product?.variants.find((v) => v.id === selectedVariantId) ?? null;
  const selectedOffer: VariantOffer | null = selectedVariant?.offers.find(
    (o) => o.id === selectedOfferId,
  ) ?? null;

  const maxQty = selectedOffer?.stock ?? 0;

  // Reset qty when offer changes; clamp to stock.
  useEffect(() => {
    if (selectedOffer && qty > selectedOffer.stock) setQty(Math.max(1, selectedOffer.stock));
  }, [selectedOffer, qty]);

  // Group attributes for the spec table (FOOD: calories/ingredients; non-food: RAM/color/etc.)
  const specs = useMemo(() => {
    if (!product) return [] as Array<{ key: string; label: string; unit: string | null; text: string }>;
    return product.attributeValues
      .filter((av) => av.value || av.rawValue)
      .map((av) => ({
        key: av.attribute.id,
        label: av.attribute.name,
        unit: av.attribute.unit,
        text: av.value?.label ?? av.value?.value ?? av.rawValue ?? "",
      }));
  }, [product]);

  async function onAddToCart() {
    if (!selectedOfferId) return;
    setAddError(null);
    setAddOk(false);
    try {
      await addToCart(selectedOfferId, qty);
      setAddOk(true);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setAddError(Array.isArray(msg) ? msg[0] : msg || "Savatga qo'shilmadi");
    }
  }

  if (loading) {
    return <div className="flex justify-center py-10"><Spinner /></div>;
  }
  if (error || !product) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/catalog" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Katalog
        </Link>
        <p className="text-sm text-danger">{error ?? "Mahsulot topilmadi"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Link
          href={`/c/${product.category.slug}`}
          className="text-xs text-ink-muted hover:text-brand-700 truncate"
        >
          {product.category.name}
        </Link>
      </div>

      {/* Desktop: gallery (left, sticky) + details (right). Mobile: single column. */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
      {/* Left column — gallery */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-20">
      {/* Image gallery */}
      <div className="aspect-square w-full rounded-xl bg-surface-3 overflow-hidden border border-line-soft">
        {product.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[imageIdx]?.url}
            alt={product.images[imageIdx]?.alt ?? product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-ink-faint">
            <ShoppingBag className="h-10 w-10" />
          </div>
        )}
      </div>
      {product.images.length > 1 ? (
        <div className="-mx-4 px-4 overflow-x-auto lg:mx-0 lg:px-0">
          <ul className="flex gap-2 w-max">
            {product.images.map((img, i) => (
              <li key={img.id}>
                <button
                  type="button"
                  onClick={() => setImageIdx(i)}
                  className={`h-14 w-14 rounded-md overflow-hidden border-2 transition-colors ${
                    i === imageIdx ? "border-brand-500" : "border-transparent hover:border-brand-200"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      </div>

      {/* Right column — details */}
      <div className="flex flex-col gap-4">
      {/* Title + rating */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{product.title}</h1>
        <div className="flex items-center gap-2 mt-1.5 text-xs">
          {product.ratingCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">{product.ratingAvg.toFixed(1)}</span>
              <span>·</span>
              <span>{product.ratingCount} ta sharh</span>
            </span>
          ) : (
            <span className="text-ink-muted">Hozircha sharh yo'q</span>
          )}
          {product.brand ? (
            <>
              <span className="text-ink-faint">·</span>
              <span className="text-ink-muted">{product.brand.name}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Variant picker */}
      {product.variants.length > 1 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-ink">Variant</h3>
          <ul className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const inStock = v.offers.some((o) => o.stock > 0 && !o.outOfRange);
              const label = v.options
                .map((o) => o.value.label ?? o.value.value)
                .join(" · ") || v.sku || "Standart";
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVariantId(v.id);
                      const next = v.offers.find((o) => o.stock > 0 && !o.outOfRange);
                      setSelectedOfferId(next?.id ?? null);
                    }}
                    disabled={!inStock}
                    className={`px-3 h-9 rounded-md text-sm border transition-colors ${
                      v.id === selectedVariantId
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-line bg-surface text-ink hover:border-brand-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* Offers list (per-store) */}
      {selectedVariant ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-ink">Sotuvchilar</h3>
          {selectedVariant.offers.length === 0 ? (
            <p className="text-sm text-ink-muted">Bu variantni hozir hech kim sotmayapti.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedVariant.offers.map((o) => {
                const selected = o.id === selectedOfferId;
                const disabled = o.stock === 0 || o.outOfRange;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => !disabled && setSelectedOfferId(o.id)}
                      disabled={disabled}
                      className={`w-full text-left rounded-xl border bg-surface p-3 flex gap-3 items-start transition-colors ${
                        selected
                          ? "border-brand-500 ring-1 ring-brand-200"
                          : "border-line hover:border-brand-300"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        selected ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600"
                      }`}>
                        {selected ? <Check className="h-4 w-4" /> : <Store className="h-4 w-4" strokeWidth={1.75} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-semibold text-ink truncate">{o.store.name}</h4>
                          {!o.store.isOpen ? <Badge tone="warning">Yopiq</Badge> : null}
                          {/* outOfRange covers both "too far" and "store closed /
                              outside working hours" (backend collapses them).
                              Only show the radius hint when the store is open,
                              otherwise the "Yopiq" badge above already explains it. */}
                          {o.outOfRange && o.store.isOpen ? (
                            <Badge tone="danger">Yetkazib berilmaydi</Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                          {o.distanceKm !== null ? (
                            <span className="tabular-nums">{o.distanceKm.toFixed(1)} km</span>
                          ) : null}
                          {o.store.deliveryEtaMinutes ? (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <Truck className="h-3 w-3" /> ~{o.store.deliveryEtaMinutes} daq
                              </span>
                            </>
                          ) : null}
                          {o.deliveryFee !== null && o.deliveryFee > 0 ? (
                            <>
                              <span>·</span>
                              <span>Yetkazib berish: {formatSum(o.deliveryFee)}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-ink tabular-nums">{formatSum(o.price)}</p>
                        {o.oldPrice && o.oldPrice > o.price ? (
                          <p className="text-[11px] text-ink-faint line-through tabular-nums">{formatSum(o.oldPrice)}</p>
                        ) : null}
                        <p className="text-[11px] text-ink-muted mt-0.5">{o.stock} ta qoldi</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {/* Spec table */}
      {specs.length > 0 ? (
        <Card>
          <div className="p-4 border-b border-line-soft">
            <h3 className="text-sm font-semibold text-ink">Tafsilot</h3>
          </div>
          <dl className="divide-y divide-line-soft">
            {specs.map((s) => (
              <div key={s.key} className="px-4 py-2 flex items-center gap-3 text-sm">
                <dt className="text-ink-muted flex-1 truncate">{s.label}</dt>
                <dd className="text-ink">
                  {s.text}{s.unit ? ` ${s.unit}` : ""}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}

      {/* Description */}
      {product.description ? (
        <Card>
          <div className="p-4 text-sm text-ink-soft whitespace-pre-line">
            {product.description}
          </div>
        </Card>
      ) : null}

      {/* Action bar — sticky above the bottom-nav on mobile, inline on desktop. */}
      <div className="sticky bottom-16 -mx-4 px-4 pt-2 bg-linear-to-t from-surface-2 via-surface-2 to-transparent lg:static lg:mx-0 lg:px-0 lg:pt-0 lg:bg-none">
        {addError ? (
          <div className="mb-2 p-3 rounded-md bg-red-50 text-sm text-danger flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{addError}</span>
          </div>
        ) : null}
        {addOk ? (
          <div className="mb-2 p-3 rounded-md bg-green-50 text-sm text-success flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4" /> Savatga qo'shildi
            </span>
            <Link href="/cart" className="text-sm font-medium text-brand-700 hover:underline">
              Savatni ochish →
            </Link>
          </div>
        ) : null}
        <Card>
          <div className="p-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Kamaytirish"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-muted hover:bg-surface-3 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-7 text-center text-sm font-medium text-ink tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                aria-label="Ko'paytirish"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-muted hover:bg-surface-3 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              block
              onClick={onAddToCart}
              loading={cartLoading}
              disabled={!selectedOfferId || maxQty === 0}
              leftIcon={!cartLoading ? <ShoppingCart className="h-4 w-4" /> : undefined}
            >
              {selectedOffer ? formatSum(selectedOffer.price * qty) : "Savatga qo'shish"}
            </Button>
          </div>
        </Card>
      </div>
      </div>
      </div>
    </div>
  );
}
