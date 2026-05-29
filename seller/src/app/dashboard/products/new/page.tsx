"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Spinner } from "@/shared/ui/Spinner";
import { flattenCategories, useCategoriesTree } from "@/features/categories/api";
import { sellerProductsApi } from "@/features/products/api";
import type { CreateProductDto } from "@/features/products/types";

/**
 * Single-form create wizard — title, category, description + optional initial
 * offer (price + stock). Backend creates a default variant; the seller can
 * add image uploads from the edit page later.
 *
 * "Wizard" is a soft term — TZ §19.2 spec calls for master search first but
 * v1 just lets the seller create master products directly. Search-existing
 * flow lands later.
 */
export default function NewProductPage() {
  const router = useRouter();
  const { data: tree, loading: treeLoading } = useCategoriesTree();
  const categories = useMemo(() => (tree ? flattenCategories(tree) : []), [tree]);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title || title.length < 2) {
      setError("Mahsulot nomini kiriting");
      return;
    }
    if (!categoryId) {
      setError("Kategoriyani tanlang");
      return;
    }

    const priceNum = price.trim() ? Number(price) : undefined;
    const stockNum = stock.trim() ? Number(stock) : undefined;

    if (priceNum !== undefined && !Number.isFinite(priceNum)) {
      setError("Narx noto'g'ri");
      return;
    }
    if (stockNum !== undefined && !Number.isFinite(stockNum)) {
      setError("Qoldiq noto'g'ri");
      return;
    }

    const dto: CreateProductDto = {
      title,
      categoryId,
      description: description.trim() || undefined,
      price: priceNum,
      stock: stockNum,
    };

    setSubmitting(true);
    try {
      const created = await sellerProductsApi.create(dto);
      router.push(`/dashboard/products/${created.id}`);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Mahsulot yaratilmadi");
      setSubmitting(false);
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
        <h1 className="text-xl font-semibold tracking-tight text-ink">Yangi mahsulot</h1>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Card>
          <div className="p-4 border-b border-line-soft">
            <h3 className="text-sm font-semibold text-ink">Asosiy ma'lumotlar</h3>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <Input
              label="Nomi"
              placeholder="Masalan: Big Lavash (200g)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />

            {/* Category select */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Kategoriya
              </label>
              {treeLoading ? (
                <div className="h-11 flex items-center justify-center"><Spinner /></div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full h-11 rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200"
                >
                  <option value="">— tanlang —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.type === "FOOD" ? "Ovqat" : "Marketplace"})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[11px] text-ink-faint mt-1">
                Faqat leaf kategoriya tanlanadi. Yangi kategoriya kerak bo'lsa — admin'ga murojaat qiling.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Tavsif</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                rows={4}
                placeholder="Mahsulot tarkibi, og'irligi, tayyorlash usuli — qisqacha."
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 border-b border-line-soft">
            <h3 className="text-sm font-semibold text-ink">Boshlang'ich offer (ixtiyoriy)</h3>
            <p className="text-xs text-ink-muted mt-1">
              Narx + qoldiq darhol qo'shilsa, mahsulot tasdiqlangach sotuvga chiqadi.
              Bo'sh qoldirsangiz keyin offer qo'shasiz.
            </p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Narx (so'm)"
              placeholder="35000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
            />
            <Input
              label="Qoldiq"
              placeholder="50"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </Card>

        {error ? (
          <Card>
            <div className="p-4 flex items-start gap-3 text-sm text-danger">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          </Card>
        ) : null}

        <div className="flex justify-end gap-2">
          <Link href="/dashboard/products">
            <Button type="button" variant="ghost">Bekor</Button>
          </Link>
          <Button type="submit" loading={submitting} size="lg">
            Yaratish va moderatsiyaga jo'natish
          </Button>
        </div>
        <p className="text-xs text-ink-muted text-center">
          Yaratilgan mahsulot avtomatik <span className="font-semibold">Moderatsiyada</span> holatiga
          tushadi. Admin tasdiqlagach sotuvga chiqadi.
        </p>
      </form>
    </div>
  );
}
