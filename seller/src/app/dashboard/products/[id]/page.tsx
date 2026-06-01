"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Spinner } from "@/shared/ui/Spinner";
import { sellerOffersApi, sellerProductsApi } from "@/features/products/api";
import { useSellerProduct } from "@/features/products/hooks";
import { PRODUCT_STATUS_META } from "@/features/products/status";
import { ImageUploader, type UploaderItem } from "@/features/uploads/ImageUploader";
import { formatSum } from "@/shared/lib/format";

export default function SellerProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params?.id ?? null;
  const { data: product, loading, error, reload } = useSellerProduct(productId);

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  // Newly-uploaded images, not yet attached to the product.
  const [newImages, setNewImages] = useState<UploaderItem[]>([]);
  const [savingImages, setSavingImages] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  // Offer inline state — one per variant.
  // Stock is editable for the seller; price too. isActive toggle for visibility.
  const [offerEdits, setOfferEdits] = useState<Record<string, { price: string; stock: string; busy: boolean; error: string | null }>>({});

  useEffect(() => {
    if (!product) return;
    setTitle(product.title);
    setDescription(product.description ?? "");
    const next: typeof offerEdits = {};
    for (const v of product.variants) {
      for (const o of v.offers) {
        next[o.id] = {
          price: String(o.price),
          stock: String(o.stock),
          busy: false,
          error: null,
        };
      }
    }
    setOfferEdits(next);
  }, [product]);

  if (loading) {
    return <div className="flex justify-center py-10"><Spinner /></div>;
  }
  if (error || !product) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl">
        <Link href="/dashboard/products" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Mahsulotlar
        </Link>
        <p className="text-sm text-danger">{error ?? "Topilmadi"}</p>
      </div>
    );
  }

  const meta = PRODUCT_STATUS_META[product.status];

  async function saveProduct(e: FormEvent) {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    setSaveError(null);
    try {
      await sellerProductsApi.update(product.id, {
        title,
        description: description.trim() || undefined,
      });
      await reload();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setSaveError(Array.isArray(msg) ? msg[0] : msg || "Saqlanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function saveImages() {
    if (!product || newImages.length === 0) return;
    setSavingImages(true);
    setImgError(null);
    try {
      await sellerProductsApi.update(product.id, {
        imageUploadIds: newImages.map((i) => i.id),
      });
      setNewImages([]);
      await reload();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setImgError(Array.isArray(msg) ? msg[0] : msg || "Rasmlar saqlanmadi");
    } finally {
      setSavingImages(false);
    }
  }

  async function saveOffer(offerId: string) {
    const cur = offerEdits[offerId];
    if (!cur) return;
    const price = Number(cur.price);
    const stock = Number(cur.stock);
    if (!Number.isFinite(price) || price < 0) {
      setOfferEdits((s) => ({ ...s, [offerId]: { ...s[offerId], error: "Narx noto'g'ri" } }));
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setOfferEdits((s) => ({ ...s, [offerId]: { ...s[offerId], error: "Qoldiq noto'g'ri" } }));
      return;
    }

    setOfferEdits((s) => ({ ...s, [offerId]: { ...s[offerId], busy: true, error: null } }));
    try {
      await sellerOffersApi.update(offerId, { price, stock });
      await reload();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setOfferEdits((s) => ({
        ...s,
        [offerId]: { ...s[offerId], busy: false, error: Array.isArray(msg) ? msg[0] : msg || "Saqlanmadi" },
      }));
      return;
    }
    setOfferEdits((s) => ({ ...s, [offerId]: { ...s[offerId], busy: false } }));
  }

  async function toggleOfferActive(offerId: string, current: boolean) {
    setOfferEdits((s) => ({ ...s, [offerId]: { ...s[offerId], busy: true, error: null } }));
    try {
      await sellerOffersApi.update(offerId, { isActive: !current });
      await reload();
    } finally {
      setOfferEdits((s) => ({ ...s, [offerId]: { ...s[offerId], busy: false } }));
    }
  }

  async function removeProduct() {
    if (!product) return;
    if (!confirm(`"${product.title}" o'chirilsinmi? Bu amalni ortga qaytarib bo'lmaydi.`)) return;
    setRemoving(true);
    try {
      await sellerProductsApi.remove(product.id);
      router.replace("/dashboard/products");
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "O'chirilmadi");
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/products"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink truncate">{product.title}</h1>
          <p className="text-xs text-ink-muted">
            {product.category.name} · {product.category.type === "FOOD" ? "Ovqat" : "Marketplace"}
          </p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      {product.rejectionReason ? (
        <Card>
          <div className="p-4 flex items-start gap-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Admin rad etdi</p>
              <p className="mt-0.5">{product.rejectionReason}</p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Edit basic fields */}
      <form onSubmit={saveProduct}>
        <Card>
          <div className="p-4 border-b border-line-soft">
            <h3 className="text-sm font-semibold text-ink">Asosiy ma'lumotlar</h3>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <Input
              label="Nomi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Tavsif</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                rows={4}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200"
              />
            </div>
            {saveError ? (
              <p className="text-sm text-danger">{saveError}</p>
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>Saqlash</Button>
            </div>
          </div>
        </Card>
      </form>

      {/* Offers — inline editable */}
      <Card>
        <div className="p-4 border-b border-line-soft">
          <h3 className="text-sm font-semibold text-ink">Narx va qoldiq</h3>
          <p className="text-xs text-ink-muted mt-1">
            Stock 0 ga tushganda offer avtomatik faollikdan chiqadi.
          </p>
        </div>
        <ul className="divide-y divide-line-soft">
          {product.variants.map((v) => (
            v.offers.length === 0 ? (
              <li key={v.id} className="p-4 text-sm text-ink-muted">
                Bu variant uchun offer mavjud emas. (Variant: {v.sku ?? "default"})
              </li>
            ) : (
              v.offers.map((o) => {
                const edit = offerEdits[o.id] ?? { price: String(o.price), stock: String(o.stock), busy: false, error: null };
                return (
                  <li key={o.id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                      <span className="font-medium text-ink-soft">Variant: {v.sku ?? "Standart"}</span>
                      <Badge tone={o.isActive ? "success" : "neutral"}>
                        {o.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                      <span className="ml-auto tabular-nums">Joriy narx: {formatSum(Number(o.price))}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Narx (so'm)"
                        value={edit.price}
                        onChange={(e) => setOfferEdits((s) => ({
                          ...s,
                          [o.id]: { ...edit, price: e.target.value },
                        }))}
                        inputMode="numeric"
                      />
                      <Input
                        label="Qoldiq"
                        value={edit.stock}
                        onChange={(e) => setOfferEdits((s) => ({
                          ...s,
                          [o.id]: { ...edit, stock: e.target.value },
                        }))}
                        inputMode="numeric"
                      />
                    </div>
                    {edit.error ? (
                      <p className="text-sm text-danger">{edit.error}</p>
                    ) : null}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => saveOffer(o.id)}
                        loading={edit.busy}
                      >
                        Saqlash
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleOfferActive(o.id, o.isActive)}
                        disabled={edit.busy}
                      >
                        {o.isActive ? "Vaqtincha to'xtatish" : "Faollashtirish"}
                      </Button>
                    </div>
                  </li>
                );
              })
            )
          ))}
        </ul>
      </Card>

      {/* Images */}
      <Card>
        <div className="p-4 border-b border-line-soft">
          <h3 className="text-sm font-semibold text-ink">Rasmlar</h3>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {product.images.length > 0 ? (
            <ul className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {product.images.map((img) => (
                <li key={img.id} className="aspect-square rounded-md overflow-hidden border border-line-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <ShoppingBag className="h-5 w-5" />
              <span>Hali rasm yo&apos;q. Quyidan yangi rasm qo&apos;shing.</span>
            </div>
          )}

          <div className="border-t border-line-soft pt-4">
            <p className="text-sm font-medium text-ink mb-2">Yangi rasm qo&apos;shish</p>
            <ImageUploader value={newImages} onChange={setNewImages} purpose="PRODUCT_IMAGE" />
            {imgError ? <p className="text-xs text-danger mt-2">{imgError}</p> : null}
            {newImages.length > 0 ? (
              <Button
                className="mt-3"
                size="sm"
                loading={savingImages}
                onClick={saveImages}
              >
                {newImages.length} ta rasmni saqlash
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card>
        <div className="p-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink">Xavfli zona</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Mahsulotni butunlay o'chirish. Bu amal qaytmas.
            </p>
          </div>
          <Button
            variant="outline"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={removeProduct}
            loading={removing}
            className="text-danger border-red-200 hover:bg-red-50"
          >
            O'chirish
          </Button>
        </div>
      </Card>
    </div>
  );
}
