"use client";

import { CalendarDays, CalendarRange, Coins, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { StatCard } from "@/components/ui/StatCard";
import { useCourierStats } from "@/features/deliveries/hooks";
import { formatSum } from "@/lib/format";

export default function EarningsPage() {
  const { data: stats, loading, error } = useCourierStats();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title="Daromad" description="Yetkazib berishdan tushgan daromadingiz." />

      {loading && !stats ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Bugun"
              value={formatSum(stats.today.earning)}
              hint={`${stats.today.deliveries} ta yetkazma`}
              icon={<CalendarDays className="h-4 w-4" />}
            />
            <StatCard
              label="Bu hafta"
              value={formatSum(stats.week.earning)}
              hint={`${stats.week.deliveries} ta yetkazma`}
              icon={<CalendarRange className="h-4 w-4" />}
            />
            <StatCard
              label="Bu oy"
              value={formatSum(stats.month.earning)}
              hint={`${stats.month.deliveries} ta yetkazma`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          {/* All-time breakdown */}
          <Card>
            <div className="border-b border-line-soft p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Coins className="h-4 w-4 text-ink-muted" /> Umumiy hisob
              </h3>
            </div>
            <dl className="flex flex-col gap-2 p-4 text-sm">
              <Row label="Jami yetkazmalar" value={`${stats.total.deliveries} ta`} />
              <Row
                label="Yetkazib berish to'lovi (jami)"
                value={formatSum(stats.total.grossDeliveryFees)}
              />
              <Row
                label="Platforma ushlovi"
                value={`− ${formatSum(stats.total.platformCommission)}`}
                muted
              />
              <div className="mt-1 flex items-center justify-between border-t border-line-soft pt-3">
                <dt className="font-semibold text-ink">Sof daromad</dt>
                <dd className="text-lg font-semibold tabular-nums text-brand-700">
                  {formatSum(stats.total.earning)}
                </dd>
              </div>
            </dl>
          </Card>

          <p className="text-center text-xs text-ink-muted">
            Naqd to&apos;lovlar har kuni platforma bilan hisob-kitob qilinadi.
          </p>
        </>
      ) : null}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={`tabular-nums ${muted ? "text-ink-muted" : "text-ink"}`}>{value}</dd>
    </div>
  );
}
