"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Search,
  Star,
  Store as StoreIcon,
  X,
} from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input } from "@/shared/ui/Input";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { moderationApi } from "@/features/moderation/api";
import { useActiveStores } from "@/features/moderation/hooks";
import type { ActiveStore } from "@/features/moderation/types";
import { formatDate } from "@/shared/lib/format";

const PAGE_SIZE = 20;

/**
 * "Top restoranlar" — editorial curation of the customer home slider. Lists
 * ACTIVE stores; an admin promotes/demotes each to the featured shelf and
 * sets its rank (lower = earlier). Featured stores sort to the top.
 */
export default function FeaturedPage() {
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  const { data, loading, error, reload } = useActiveStores({
    page,
    pageSize: PAGE_SIZE,
    q: q || undefined,
    onlyFeatured,
  });

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  async function onToggle(s: ActiveStore) {
    setBusyId(s.id);
    setActionError(null);
    try {
      await moderationApi.setStoreFeatured(s.id, { isFeatured: !s.isFeatured });
      await reload();
    } catch (e) {
      setActionError(extractMsg(e));
    } finally {
      setBusyId(null);
    }
  }

  async function onRank(s: ActiveStore, rank: number) {
    if (!Number.isFinite(rank) || rank === s.featuredRank) return;
    setBusyId(s.id);
    setActionError(null);
    try {
      await moderationApi.setStoreFeatured(s.id, {
        isFeatured: true,
        featuredRank: Math.max(0, Math.round(rank)),
      });
      await reload();
    } catch (e) {
      setActionError(extractMsg(e));
    } finally {
      setBusyId(null);
    }
  }

  const featuredCount = data?.data.filter((s) => s.isFeatured).length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Top restoranlar"
        description="Mijoz bosh sahifasidagi slaydda birinchi chiqadigan restoranlarni tanlang. Kichik tartib raqami — oldinroq chiqadi."
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <Input
            name="q"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Do'kon nomi bo'yicha qidirish…"
            leftSlot={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          <FilterChip active={!onlyFeatured} onClick={() => { setOnlyFeatured(false); setPage(1); }}>
            Barchasi
          </FilterChip>
          <FilterChip active={onlyFeatured} onClick={() => { setOnlyFeatured(true); setPage(1); }}>
            Faqat TOP{featuredCount ? ` · ${featuredCount}` : ""}
          </FilterChip>
        </div>
      </div>

      {actionError ? (
        <Card>
          <div className="p-3 flex items-start gap-2 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        </Card>
      ) : null}

      {loading && !data ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={<StoreIcon className="h-6 w-6" />}
          title={onlyFeatured ? "TOP ro'yxati bo'sh" : "ACTIVE do'kon topilmadi"}
          description={
            onlyFeatured
              ? "Restoranni TOP ga qo'shish uchun \"Barchasi\" ni tanlang va \"TOP ga qo'shish\" bosing."
              : "Tasdiqlangan (ACTIVE) do'konlar shu yerda ko'rinadi."
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.data.map((s) => {
              const busy = busyId === s.id;
              return (
                <li key={s.id}>
                  <Card className={s.isFeatured ? "ring-1 ring-brand-200" : undefined}>
                    <div className="p-4 flex items-center gap-4">
                      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-3 text-ink-muted">
                        {s.bannerUrl || s.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={(s.bannerUrl ?? s.logoUrl)!}
                            alt={s.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <StoreIcon className="h-6 w-6" />
                        )}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-ink truncate">{s.name}</h3>
                          {s.isFeatured ? (
                            <Badge tone="brand">
                              <Star className="h-3 w-3" /> TOP #{s.featuredRank}
                            </Badge>
                          ) : null}
                          {!s.isOpen ? <Badge tone="warning">Yopiq</Badge> : null}
                        </div>
                        {s.address ? (
                          <p className="text-xs text-ink-muted truncate mt-0.5">{s.address}</p>
                        ) : null}
                        <p className="text-[11px] text-ink-faint mt-0.5">
                          Qo&apos;shilgan: {formatDate(s.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {s.isFeatured ? (
                          <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                            Tartib
                            <input
                              key={`${s.id}-${s.featuredRank}`}
                              type="number"
                              min={0}
                              defaultValue={s.featuredRank}
                              disabled={busy}
                              onBlur={(e) => onRank(s, Number(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                              className="w-16 h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink text-center tabular-nums outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                            />
                          </label>
                        ) : null}
                        <Button
                          size="sm"
                          variant={s.isFeatured ? "outline" : "primary"}
                          onClick={() => onToggle(s)}
                          loading={busy}
                          disabled={busy}
                          leftIcon={
                            s.isFeatured ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />
                          }
                          className={s.isFeatured ? "text-danger border-red-200 hover:bg-red-50" : undefined}
                        >
                          {s.isFeatured ? "TOP dan olib tashlash" : "TOP ga qo'shish"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          {data.meta.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Oldingi
              </Button>
              <span className="text-xs text-ink-muted tabular-nums">
                {page} / {data.meta.totalPages} · {data.meta.total} ta
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.meta.totalPages}
              >
                Keyingi
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
        active ? "bg-brand-500 text-white" : "text-ink-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function extractMsg(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Xatolik";
  return typeof msg === "string" ? msg : "Xatolik yuz berdi";
}
