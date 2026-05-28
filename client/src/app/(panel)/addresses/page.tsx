"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { AddressForm } from "@/features/addresses/AddressForm";
import { addressesApi } from "@/features/addresses/api";
import { useAddresses } from "@/features/addresses/hooks";
import type { Address } from "@/features/addresses/types";

export default function AddressesPage() {
  const { data, loading, error, reload } = useAddresses();
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onDelete(a: Address) {
    if (!confirm(`"${a.label}" manzilini o'chirilsinmi?`)) return;
    setDeletingId(a.id);
    try {
      await addressesApi.remove(a.id);
      await reload();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Manzillarim"
        description="Buyurtma berishda manzil tanlash uchun saqlangan joylar."
        actions={
          !creating && !editing ? (
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
              Yangi
            </Button>
          ) : null
        }
      />

      {(creating || editing) ? (
        <Card>
          <div className="p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">
              {editing ? "Manzilni tahrirlash" : "Yangi manzil"}
            </h3>
            <AddressForm
              initial={editing ?? undefined}
              defaultAsDefault={(data?.length ?? 0) === 0}
              onSaved={async () => {
                setEditing(null);
                setCreating(false);
                await reload();
              }}
              onCancel={() => {
                setEditing(null);
                setCreating(false);
              }}
            />
          </div>
        </Card>
      ) : null}

      {loading && !data ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : data && data.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {data.map((a) => (
            <li key={a.id}>
              <Card>
                <div className="p-4 flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <MapPin className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-ink truncate">{a.label}</h4>
                      {a.isDefault ? <Badge tone="brand">Asosiy</Badge> : null}
                    </div>
                    <p className="text-sm text-ink-soft">{a.fullText}</p>
                    {a.notes ? (
                      <p className="text-xs text-ink-muted mt-1">Eslatma: {a.notes}</p>
                    ) : null}
                    <p className="text-[11px] text-ink-faint mt-1">
                      {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing(a)}
                      aria-label="Tahrirlash"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(a)}
                      disabled={deletingId === a.id}
                      aria-label="O'chirish"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-red-50 hover:text-danger disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<MapPin className="h-6 w-6" />}
          title="Hali manzil saqlamagansiz"
          description="Manzil qo'shing — buyurtma vaqtida yetkazib berish hududi va narxi avtomatik hisoblanadi."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
              Yangi manzil
            </Button>
          }
        />
      )}
    </div>
  );
}
