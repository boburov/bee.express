"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full rounded-2xl bg-surface shadow-pop border border-line max-h-[90vh] flex flex-col",
          sizes[size],
        )}
      >
        <div className="px-6 pt-6 pb-4 border-b border-line flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3>
            {description ? (
              <p className="text-sm text-ink-muted mt-1">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Yopish"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer ? (
          <div className="px-6 py-4 border-t border-line flex items-center justify-end gap-2 bg-surface-2 rounded-b-2xl">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
