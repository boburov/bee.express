import Link from "next/link";
import { MapPin, Star, Store, Truck } from "lucide-react";
import type { StoreSummary } from "./types";
import { formatSum } from "@/shared/lib/format";

/**
 * Restaurant/shop grid card. Tap → that store's menu (/store/[slug]). Shared by
 * the home "Restoranlar" list and the category → stores page so cards look
 * identical everywhere. Distance is shown only when the buyer has a location.
 */
export function StoreCard({ store: s }: { store: StoreSummary }) {
  return (
    <Link
      href={`/store/${s.slug}`}
      className="press block h-full overflow-hidden rounded-2xl bg-surface shadow-card hover:shadow-hover"
    >
      {/* Cover */}
      <div className="relative h-32 w-full overflow-hidden">
        {s.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : s.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-premium" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/35 to-transparent" aria-hidden />
        {s.ratingCount > 0 ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface/95 px-2 py-0.5 text-[11px] font-bold text-ink shadow-card">
            <Star className="h-3 w-3 fill-accent-400 text-accent-400" />
            {s.ratingAvg.toFixed(1)}
          </span>
        ) : (
          <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-surface/95 px-2 py-0.5 text-[11px] font-bold text-brand-700 shadow-card">
            Yangi
          </span>
        )}
        {s.deliveryEtaMinutes ? (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            <Truck className="h-3 w-3" /> ~{s.deliveryEtaMinutes} daq
          </span>
        ) : null}
        {/* Logo chip */}
        <span className="absolute -bottom-4 right-3 inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-surface shadow-pop ring-2 ring-surface">
          {s.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Store className="h-5 w-5 text-brand-600" strokeWidth={1.75} />
          )}
        </span>
      </div>
      {/* Body */}
      <div className="p-3">
        <p className="truncate pr-10 text-sm font-bold text-ink">{s.name}</p>
        {s.address ? (
          <p className="mt-0.5 truncate text-[11px] text-ink-muted">{s.address}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          {s.distanceKm !== null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2 py-0.5 font-medium text-ink-soft tabular-nums">
              <MapPin className="h-3 w-3 text-ink-muted" /> {s.distanceKm} km
            </span>
          ) : null}
          {s.deliveryBaseFee && s.deliveryBaseFee > 0 ? (
            <span className="rounded-full bg-surface-3 px-2 py-0.5 font-medium text-ink-soft">
              {formatSum(s.deliveryBaseFee)} dan
            </span>
          ) : (
            <span className="rounded-full bg-green-50 px-2 py-0.5 font-semibold text-success">
              Bepul yetkazish
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
