"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Spinner } from "@/shared/ui/Spinner";
import { ProductCard } from "@/features/catalog/ProductCard";
import { useCategory, useProducts } from "@/features/catalog/hooks";
import { useActiveLocation } from "@/features/location/hooks";

const PAGE_SIZE = 24;

const SORTS = [
  { value: "rating_desc", label: "Reyting" },
  { value: "newest",      label: "Yangi" },
  { value: "price_asc",   label: "Arzon" },
  { value: "price_desc",  label: "Qimmat" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? null;

  const { data: cat, loading: catLoading } = useCategory(slug);
  const location = useActiveLocation();
  const geo = location ? { lat: location.lat, lng: location.lng } : null;
  const [sort, setSort] = useState<SortValue>("rating_desc");
  const [page, setPage] = useState(1);

  // FOOD categories MUST send geo; without it the backend 400's. Once the
  // buyer has an active location (seeded from their default address) we can
  // browse FOOD too. MARKETPLACE works regardless; geo is passed when known
  // so distance/delivery-fee surface there as well.
  const enabled = cat ? cat.type !== "FOOD" || Boolean(geo) : false;

  const { data: products, loading: prodLoading, error } = useProducts(
    enabled && slug
      ? { categorySlug: slug, sort, page, pageSize: PAGE_SIZE, ...(geo ?? {}) }
      : { sort, page, pageSize: PAGE_SIZE },
  );

  if (catLoading || !cat) {
    return <div className="flex justify-center py-10"><Spinner /></div>;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link
          href={cat.parent ? `/c/${cat.parent.slug}` : "/catalog"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink truncate">
            {cat.name}
          </h1>
          {cat.parent ? (
            <p className="text-xs text-ink-muted truncate">{cat.parent.name}</p>
          ) : null}
        </div>
      </div>

      {/* Sub-categories — horizontal scroll chips */}
      {cat.children.length > 0 ? (
        <div className="-mx-4 px-4 overflow-x-auto">
          <ul className="flex gap-2 w-max pb-1">
            {cat.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/c/${child.slug}`}
                  className="h-8 px-3 inline-flex items-center rounded-full text-xs font-medium bg-surface-3 text-ink-soft hover:bg-brand-50 hover:text-brand-700 transition-colors whitespace-nowrap"
                >
                  {child.name}
                  <ChevronRight className="h-3 w-3 ml-1 -mr-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Sort pills */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-ink-muted">Saralash:</span>
        {SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => { setSort(s.value); setPage(1); }}
            className={`h-8 px-3.5 rounded-full font-semibold transition-colors ${
              sort === s.value
                ? "bg-brand-500 text-white"
                : "bg-surface-3 text-ink-soft hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* FOOD without an active location — show address prompt */}
      {cat.type === "FOOD" && !geo ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Manzil tanlanmagan"
          description="Ovqat kategoriyalarini ko'rish uchun avval manzilingizni qo'shing — yetkazib berish radiusi shu manzildan hisoblanadi."
          action={<Link href="/addresses"><Button>Manzil qo'shish</Button></Link>}
        />
      ) : prodLoading && !products ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !products || products.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Bu kategoriyada mahsulot yo'q"
          description="Sotuvchilar mahsulot qo'shganda shu yerda paydo bo'ladi."
        />
      ) : (
        <>
          <ul className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.items.map((p) => (
              <li key={p.id}><ProductCard product={p} /></li>
            ))}
          </ul>

          {products.total > PAGE_SIZE ? (
            <Card>
              <div className="p-3 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2 py-1 text-ink-muted disabled:opacity-40 hover:text-ink"
                >
                  ← Oldingi
                </button>
                <span className="text-ink-muted tabular-nums">
                  {page} / {Math.ceil(products.total / PAGE_SIZE)}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * PAGE_SIZE >= products.total}
                  className="px-2 py-1 text-ink-muted disabled:opacity-40 hover:text-ink"
                >
                  Keyingi →
                </button>
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
