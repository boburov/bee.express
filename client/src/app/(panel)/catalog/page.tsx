"use client";

import Link from "next/link";
import { LayoutGrid, Search, UtensilsCrossed } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { useCategoriesTree } from "@/features/catalog/hooks";
import type { CategoryNode } from "@/features/catalog/types";

export default function CatalogPage() {
  const { data, loading, error } = useCategoriesTree();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Katalog"
        description="Kategoriyalar va yaqin atrofdagi sotuvchilar."
      />

      {/* Search affordance — wired to /catalog/search when search lands. */}
      <Link
        href="/catalog"
        className="flex items-center gap-2 h-11 w-full lg:max-w-xl rounded-xl border border-line bg-surface px-3 text-sm text-ink-muted shadow-card hover:border-brand-300"
      >
        <Search className="h-4 w-4 text-ink-muted" />
        <span className="flex-1 text-left">Mahsulot yoki kategoriya qidiring</span>
      </Link>

      {loading && !data ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-6 w-6" />}
          title="Hali kategoriya yo'q"
          description="Admin kategoriyalar qo'shganda shu yerda ko'rinadi."
        />
      ) : (
        <CategoryGrid nodes={data} />
      )}
    </div>
  );
}

function CategoryGrid({ nodes }: { nodes: CategoryNode[] }) {
  // Group by type for a clearer scan — FOOD first, MARKETPLACE second.
  const food = nodes.filter((n) => n.type === "FOOD");
  const market = nodes.filter((n) => n.type === "MARKETPLACE");
  return (
    <>
      {food.length > 0 ? (
        <Section title="Ovqat" items={food} />
      ) : null}
      {market.length > 0 ? (
        <Section title="Marketplace" items={market} />
      ) : null}
    </>
  );
}

function Section({ title, items }: { title: string; items: CategoryNode[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/c/${c.slug}`}
              className="block group"
            >
              <Card className="h-full">
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-12 w-12 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center overflow-hidden">
                    {c.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.iconUrl} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <UtensilsCrossed className="h-5 w-5" strokeWidth={1.75} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink leading-tight group-hover:text-brand-700 transition-colors">
                      {c.name}
                    </p>
                    {c.children.length > 0 ? (
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        {c.children.length} ta bo'lim
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
