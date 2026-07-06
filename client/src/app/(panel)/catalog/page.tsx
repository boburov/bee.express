"use client";

import Link from "next/link";
import { LayoutGrid, Search, ShoppingBasket, UtensilsCrossed } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { IconTile } from "@/shared/ui/IconTile";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { useCategoriesTree } from "@/features/catalog/hooks";
import type { CategoryNode, CategoryType } from "@/features/catalog/types";

// Same colourful tone rotation as the home grid, so category tiles look
// identical across the app instead of catalog's old monochrome cards.
const TILE_TONES = ["rose", "emerald", "amber", "sky", "violet", "brand"] as const;
const tileIcon = (type: CategoryType) =>
  type === "FOOD" ? UtensilsCrossed : ShoppingBasket;

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
        className="press flex items-center gap-2.5 h-12 w-full lg:max-w-xl rounded-2xl border border-line bg-surface px-4 text-sm text-ink-muted shadow-card hover:border-brand-300"
      >
        <Search className="h-5 w-5 text-brand-500" strokeWidth={2} />
        <span className="flex-1 text-left">Taom yoki kategoriya qidiring</span>
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
      <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
      <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {items.map((c, i) => (
          <li key={c.id}>
            <IconTile
              icon={tileIcon(c.type)}
              imageUrl={c.iconUrl}
              label={c.name}
              caption={c.children.length > 0 ? `${c.children.length} ta bo'lim` : undefined}
              tone={TILE_TONES[i % TILE_TONES.length]}
              href={`/c/${c.slug}`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
