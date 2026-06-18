"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";

export interface TrendPoint {
  /** YYYY-MM-DD */
  date: string;
  orders: number;
  revenue: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  className?: string;
  height?: number;
}

const PAD = { top: 16, right: 16, bottom: 28, left: 16 };
const VIEW_W = 720;

/** Builds an SVG path string from points already mapped to pixel space. */
function linePath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return "";
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

function shortDate(iso: string): string {
  // iso = YYYY-MM-DD → DD.MM
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

function fmtSom(n: number): string {
  return `${n.toLocaleString("ru-RU")} so'm`;
}

/**
 * Dependency-free dual-series trend chart: revenue (filled area + line) and
 * orders (line) sharing an x-axis of days. Each series is scaled to its own
 * max so both remain readable despite very different magnitudes.
 */
export function TrendChart({ data, className, height = 240 }: TrendChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const geom = useMemo(() => {
    const innerW = VIEW_W - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const n = data.length;
    const maxRevenue = Math.max(1, ...data.map((d) => d.revenue));
    const maxOrders = Math.max(1, ...data.map((d) => d.orders));

    const xAt = (i: number) =>
      PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const yRevenue = (v: number) => PAD.top + innerH - (v / maxRevenue) * innerH;
    const yOrders = (v: number) => PAD.top + innerH - (v / maxOrders) * innerH;

    const revPts = data.map((d, i) => ({ x: xAt(i), y: yRevenue(d.revenue) }));
    const ordPts = data.map((d, i) => ({ x: xAt(i), y: yOrders(d.orders) }));

    const baseline = PAD.top + innerH;
    const areaPath =
      revPts.length > 0
        ? `${linePath(revPts)} L${revPts[revPts.length - 1].x.toFixed(1)},${baseline} L${revPts[0].x.toFixed(1)},${baseline} Z`
        : "";

    return { innerW, innerH, baseline, xAt, revPts, ordPts, areaPath };
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-sm text-ink-muted",
          className,
        )}
        style={{ height }}
      >
        Ma'lumot yo'q
      </div>
    );
  }

  const active = hover != null ? data[hover] : null;

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label="Daromad va buyurtmalar dinamikasi"
      >
        <defs>
          <linearGradient id="trend-rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal gridlines */}
        {[0.25, 0.5, 0.75].map((t) => {
          const y = PAD.top + geom.innerH * t;
          return (
            <line
              key={t}
              x1={PAD.left}
              x2={VIEW_W - PAD.right}
              y1={y}
              y2={y}
              stroke="#F1F1F4"
              strokeWidth={1}
            />
          );
        })}

        {/* revenue area + line */}
        <path d={geom.areaPath} fill="url(#trend-rev-fill)" />
        <path
          d={linePath(geom.revPts)}
          fill="none"
          stroke="#F97316"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* orders line */}
        <path
          d={linePath(geom.ordPts)}
          fill="none"
          stroke="#27272A"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />

        {/* hover guide + dots */}
        {active != null && hover != null ? (
          <g>
            <line
              x1={geom.xAt(hover)}
              x2={geom.xAt(hover)}
              y1={PAD.top}
              y2={geom.baseline}
              stroke="#E4E4E7"
              strokeWidth={1}
            />
            <circle cx={geom.revPts[hover].x} cy={geom.revPts[hover].y} r={4} fill="#F97316" />
            <circle cx={geom.ordPts[hover].x} cy={geom.ordPts[hover].y} r={4} fill="#27272A" />
          </g>
        ) : null}

        {/* x-axis labels (sparse to avoid crowding) */}
        {data.map((d, i) => {
          const every = Math.ceil(data.length / 7);
          if (i % every !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={d.date}
              x={geom.xAt(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-ink-faint"
              style={{ fontSize: 11 }}
            >
              {shortDate(d.date)}
            </text>
          );
        })}

        {/* invisible hover hit-areas, one column per day */}
        {data.map((d, i) => {
          const colW = geom.innerW / Math.max(1, data.length - 1);
          return (
            <rect
              key={d.date}
              x={geom.xAt(i) - colW / 2}
              y={PAD.top}
              width={colW}
              height={geom.innerH + PAD.bottom}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            />
          );
        })}
      </svg>

      {/* tooltip */}
      {active && hover != null ? (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop"
          style={{ left: `${(geom.xAt(hover) / VIEW_W) * 100}%` }}
        >
          <div className="mb-1 font-medium text-ink">{shortDate(active.date)}</div>
          <div className="flex items-center gap-1.5 text-ink-soft">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
            Daromad: <span className="font-medium text-ink">{fmtSom(active.revenue)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-ink-soft">
            <span className="inline-block h-2 w-2 rounded-full bg-ink-soft" />
            Buyurtmalar: <span className="font-medium text-ink">{active.orders}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
