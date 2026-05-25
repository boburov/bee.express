import Link from "next/link";
import {
  Apple,
  HardHat,
  Search,
  ShoppingBasket,
  UtensilsCrossed,
} from "lucide-react";
import { IconTile } from "@/shared/ui/IconTile";
import { PageHeader } from "@/shared/ui/PageHeader";

const categories = [
  {
    slug: "food",
    label: "Ovqat",
    caption: "Restoranlar va oshxonalar",
    icon: UtensilsCrossed,
    tone: "rose" as const,
  },
  {
    slug: "grocery",
    label: "Mahsulot",
    caption: "Do'konlar va supermarketlar",
    icon: ShoppingBasket,
    tone: "emerald" as const,
  },
  {
    slug: "fruits",
    label: "Mevalar",
    caption: "Bozor mahsulotlari",
    icon: Apple,
    tone: "amber" as const,
  },
  {
    slug: "construction",
    label: "Qurilish",
    caption: "Qum, g'isht, kamaz",
    icon: HardHat,
    tone: "sky" as const,
  },
];

export default function CatalogPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Katalog"
        description="Kategoriyalar va yaqin atrofdagi sotuvchilar."
      />

      <Link
        href="/catalog/search"
        className="flex items-center gap-2 h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink-muted shadow-card hover:border-brand-300"
      >
        <Search className="h-4 w-4 text-ink-muted" />
        <span className="flex-1 text-left">Sotuvchi yoki mahsulotni qidiring</span>
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink">Barcha kategoriyalar</h2>
        <ul className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <IconTile
                icon={c.icon}
                label={c.label}
                caption={c.caption}
                tone={c.tone}
                href={`/catalog/${c.slug}`}
              />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-xs text-ink-muted px-4">
        Kategoriyaga kirsangiz — yaqin atrofdagi sotuvchilar, masofa va yetkazib berish vaqti ko&apos;rinadi.
      </p>
    </div>
  );
}
