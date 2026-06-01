"use client";

import { FormEvent, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { StoreContractCard } from "@/features/contracts/StoreContractCard";
import { useCourierStores } from "@/features/contracts/hooks";
import { contractsApi } from "@/features/contracts/api";
import { extractMsg } from "@/features/deliveries/hooks";
import { useGeolocation } from "@/lib/geolocation";

export default function StoresPage() {
  const { coords, error: geoError, request } = useGeolocation(true);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const { data, loading, error, reload } = useCourierStores(coords, query);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setQuery(input);
  }

  async function run(storeId: string, fn: () => Promise<unknown>) {
    setBusyId(storeId);
    setActionError(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setActionError(extractMsg(e));
    } finally {
      setBusyId(null);
    }
  }

  const stores = data?.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Do'konlar"
        description="Do'kon bilan kontrakt tuzing — tasdiqlangach buyurtmalari sizga keladi."
      />

      <form onSubmit={onSearch} className="flex gap-2">
        <div className="flex-1">
          <Input
            name="q"
            placeholder="Do'kon nomi bo'yicha qidirish"
            leftSlot={<Search className="h-4 w-4" />}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">
          Qidirish
        </Button>
      </form>

      {geoError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {geoError} — masofa ko&apos;rsatilmaydi
          </span>
          <button onClick={request} className="font-medium underline">
            Ruxsat berish
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" label="Yuklanmoqda…" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : stores.length === 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Do'kon topilmadi"
          description="Qidiruvni o'zgartiring yoki keyinroq qayta urinib ko'ring."
        />
      ) : (
        <div className="space-y-3">
          {stores.map((s) => (
            <StoreContractCard
              key={s.id}
              store={s}
              busy={busyId === s.id || busyId === s.contract?.id}
              onRequest={(id) => run(id, () => contractsApi.request(id))}
              onCancel={(contractId) =>
                run(contractId, () => contractsApi.cancel(contractId))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
