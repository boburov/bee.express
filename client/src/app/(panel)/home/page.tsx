"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { useAuthStore } from "@/shared/auth/store";

const categories = [
  { slug: "food", label: "Ovqat", emoji: "🍔" },
  { slug: "grocery", label: "Mahsulot", emoji: "🛒" },
  { slug: "construction", label: "Qurilish", emoji: "🧱" },
  { slug: "fruits", label: "Mevalar", emoji: "🍎" },
];

export default function HomePage() {
  const me = useAuthStore((s) => s.me);
  const name = me?.firstName ?? me?.phone ?? "Foydalanuvchi";

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl bg-gradient-warm border border-brand-100 p-5 shadow-card">
        <Badge tone="brand" className="mb-2">
          <Sparkles className="h-3 w-3" /> Yangi
        </Badge>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Salom, {name}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Kategoriyani tanlang va yaqin atrofdagi sotuvchidan buyurtma bering.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <MapPin className="h-3.5 w-3.5" />
          <span>Manzil tanlanmagan</span>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Kategoriyalar</h2>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
          >
            Hammasi <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="grid grid-cols-4 gap-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/catalog/${c.slug}`}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface p-3 hover:border-brand-300 hover:bg-brand-50 transition-colors"
              >
                <span className="text-2xl" aria-hidden>
                  {c.emoji}
                </span>
                <span className="text-[11px] font-medium text-ink-soft">{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Profilingiz</CardTitle>
          <CardDescription>Hisob ma&apos;lumotlari</CardDescription>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-ink-muted">Telefon</dt>
            <dd className="text-ink">{me?.phone ?? "—"}</dd>
            <dt className="text-ink-muted">Telegram</dt>
            <dd className="text-ink">{me?.telegramId ?? "—"}</dd>
            <dt className="text-ink-muted">Rol</dt>
            <dd className="text-ink">{me?.role?.name ?? "Xaridor"}</dd>
          </dl>
        </CardBody>
      </Card>

      <Card tone="muted">
        <CardBody>
          <p className="text-sm text-ink-muted">
            Bu sahifa skeleton holida. Keyingi bosqichda kategoriyalar, yaqin
            sotuvchilar va savat ulanadi.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
