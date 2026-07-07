"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Store as StoreIcon } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Spinner } from "@/shared/ui/Spinner";
import { StoreCard } from "@/features/catalog/StoreCard";
import { useCategory, useCategoryStores } from "@/features/catalog/hooks";
import { useActiveLocation } from "@/features/location/hooks";

/**
 * Category page — restaurant-first. Tapping a category shows the STORES that
 * sell something in it (or its sub-categories), not a flat product grid. Pick a
 * store → its menu (/store/[slug]). Sub-category chips drill down further.
 */
export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? null;

  const { data: cat, loading: catLoading } = useCategory(slug);
  const location = useActiveLocation();
  const geo = location ? { lat: location.lat, lng: location.lng } : null;
  const { data: stores, loading, error } = useCategoryStores(slug, geo);

  if (catLoading || !cat) {
    return <div className="flex justify-center py-10"><Spinner /></div>;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link
          href={cat.parent ? `/c/${cat.parent.slug}` : "/catalog"}
          className="press inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface shadow-card text-ink hover:text-brand-600"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink truncate">{cat.name}</h1>
          {cat.parent ? (
            <p className="text-xs text-ink-muted truncate">{cat.parent.name}</p>
          ) : (
            <p className="text-xs text-ink-muted">Shu kategoriyadagi restoranlar</p>
          )}
        </div>
      </div>

      {/* Sub-categories — horizontal scroll chips */}
      {cat.children.length > 0 ? (
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <ul className="flex gap-2 w-max pb-1">
            {cat.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/c/${child.slug}`}
                  className="press h-8 px-3.5 inline-flex items-center rounded-full text-xs font-semibold bg-surface-3 text-ink-soft hover:bg-brand-50 hover:text-brand-700 transition-colors whitespace-nowrap"
                >
                  {child.name}
                  <ChevronRight className="h-3 w-3 ml-1 -mr-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Stores in this category */}
      {loading && !stores ? (
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
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !stores || stores.length === 0 ? (
        <EmptyState
          icon={<StoreIcon className="h-6 w-6" />}
          title="Bu kategoriyada restoran yo'q"
          description="Hozircha bu kategoriyaga mos ochiq restoran yoki do'kon topilmadi."
        />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stores.map((s) => (
            <li key={s.id}>
              <StoreCard store={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
