"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { sellerContractsApi } from "./api";
import type { CourierPaymentType, SellerContract } from "./types";

const TYPE_OPTS: { value: CourierPaymentType; label: string }[] = [
  { value: "PERCENT", label: "Foiz (%)" },
  { value: "PER_ORDER", label: "Har order (so'm)" },
  { value: "SALARY", label: "Oylik (so'm)" },
];

function describe(c: SellerContract): string {
  const v = (c.paymentValue ?? 0).toLocaleString("ru-RU");
  switch (c.paymentType) {
    case "PERCENT":
      return `Yo'l haqqining ${c.paymentValue ?? 0}%`;
    case "PER_ORDER":
      return `Har order ${v} so'm`;
    case "SALARY":
      return `Oylik ${v} so'm`;
    default:
      return "—";
  }
}

/**
 * Inline editor for a contract's courier payment terms (Stabil oylik / har order /
 * foiz). Seller-set per contract; saved value is snapshotted onto each order's
 * courierEarning at assignment time.
 */
export function ContractPaymentEditor({
  contract,
  onSaved,
}: {
  contract: SellerContract;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<CourierPaymentType>(contract.paymentType);
  const [value, setValue] = useState(String(contract.paymentValue ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      setError("Qiymat noto'g'ri");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await sellerContractsApi.setPayment(contract.id, type, num);
      setEditing(false);
      onSaved();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Saqlanmadi");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-ink-muted">Kuryer to&apos;lovi:</span>
        <span className="font-medium text-ink">{describe(contract)}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-brand-700 hover:underline"
        >
          <Pencil className="h-3 w-3" /> O&apos;zgartirish
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-line p-2.5">
      <div className="flex flex-wrap gap-1.5">
        {TYPE_OPTS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setType(o.value)}
            className={`h-7 px-2.5 rounded-full text-[11px] font-medium transition-colors ${
              type === o.value ? "bg-brand-500 text-white" : "bg-surface-3 text-ink-soft hover:bg-line-soft"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="numeric"
          placeholder={type === "PERCENT" ? "80" : "5000"}
          className="h-9 w-32 rounded-md border border-line bg-surface px-3 text-sm text-ink focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <Button size="sm" onClick={save} loading={saving} leftIcon={<Check className="h-4 w-4" />}>
          Saqlash
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
          Bekor
        </Button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
