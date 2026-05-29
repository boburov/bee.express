"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Package, Plus, ShoppingBag } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { useSellerProducts } from "@/features/products/hooks";
import { PRODUCT_STATUS_LIST, PRODUCT_STATUS_META } from "@/features/products/status";
import type { ProductStatus } from "@/features/products/types";
import { formatSum } from "@/shared/lib/format";

const PAGE_SIZE = 20;

export default function SellerProductsPage() {
  const [statusFilter, setStatusFilter] = useState<ProductStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, loading, error } = useSellerProducts({
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter,
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Mahsulotlar"
        description="Sizning katalogingiz — qoralama, moderatsiya va faol mahsulotlar."
        actions={
          <Link href="/dashboard/products/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Yangi mahsulot</Button>
          </Link>
        }
      />

      {/* Status chips */}
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
        <ul className="flex gap-2 w-max sm:w-auto sm:flex-wrap pb-1">
          <li>
            <button
              type="button"
              onClick={() => { setStatusFilter(undefined); setPage(1); }}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === undefined
                  ? "bg-brand-500 text-white"
                  : "bg-surface-3 text-ink-soft hover:bg-line-soft"
              }`}
            >
              Barchasi
            </button>
          </li>
          {PRODUCT_STATUS_LIST.map((s) => {
            const active = statusFilter === s;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`h-8 px-3 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    active ? "bg-brand-500 text-white" : "bg-surface-3 text-ink-soft hover:bg-line-soft"
                  }`}
                >
                  {PRODUCT_STATUS_META[s].label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title={statusFilter ? "Bu holatda mahsulot yo'q" : "Hali mahsulot qo'shmagansiz"}
          description={statusFilter ? "Filterni o'zgartirib ko'ring." : "Birinchi mahsulotingizni katalogingizga qo'shing."}
          action={
            !statusFilter ? (
              <Link href="/dashboard/products/new">
                <Button leftIcon={<Plus className="h-4 w-4" />}>Mahsulot qo'shish</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <Card>
            <ul className="divide-y divide-line-soft">
              {data.items.map((p) => {
                const meta = PRODUCT_STATUS_META[p.status];
                const offer = p.variants[0]?.offers[0];
                const price = offer ? Number(offer.price) : null;
                const stock = offer?.stock ?? null;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/products/${p.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-surface-3 transition-colors"
                    >
                      <div className="h-14 w-14 shrink-0 rounded-md bg-surface-3 border border-line-soft overflow-hidden">
                        {p.images[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0].url} alt={p.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-ink-faint">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold text-ink truncate">{p.title}</h3>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </div>
                        <p className="text-xs text-ink-muted">
                          {p.category.name}
                          {price !== null ? (
                            <>
                              {" · "}
                              <span className="font-medium text-ink tabular-nums">{formatSum(price)}</span>
                            </>
                          ) : null}
                          {stock !== null ? (
                            <>{" · "}<span className="tabular-nums">{stock} ta</span></>
                          ) : null}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-ink-faint shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          {data.total > PAGE_SIZE ? (
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
                {page} / {Math.ceil(data.total / PAGE_SIZE)} · {data.total} ta mahsulot
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * PAGE_SIZE >= data.total}
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
