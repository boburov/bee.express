"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Compact pagination: "1–20 of 247" + prev/next buttons. We keep page numbers
 * out of the UI deliberately — once tables grow beyond a handful of pages, raw
 * page numbers stop being useful and a query/filter is what users actually want.
 */
export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const canPrev = page > 1;
  const canNext = page < pages;

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className="text-xs text-ink-muted">
        {total === 0 ? "Hech narsa topilmadi" : `${from}–${to} / ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-soft hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Oldingi"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs font-medium text-ink">
          {page} / {pages}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-soft hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Keyingi"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
