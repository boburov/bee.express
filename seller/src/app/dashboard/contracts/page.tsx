"use client";

import { useState } from "react";
import { Bike, Check, Circle, Phone, X } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { useSellerContracts } from "@/features/contracts/hooks";
import { sellerContractsApi } from "@/features/contracts/api";
import {
  CONTRACT_STATUS_FILTERS,
  CONTRACT_STATUS_META,
} from "@/features/contracts/status";
import type { ContractStatus, SellerContract } from "@/features/contracts/types";
import { TransportBadge } from "@/features/contracts/TransportBadge";
import { ContractPaymentEditor } from "@/features/contracts/ContractPaymentEditor";
import { formatDateTime, formatPhone } from "@/shared/lib/format";

export default function SellerContractsPage() {
  const [statusFilter, setStatusFilter] = useState<ContractStatus | undefined>(undefined);
  const { data, loading, error, reload } = useSellerContracts(statusFilter);

  const [busy, setBusy] = useState<{ id: string; action: "approve" | "reject" | "revoke" } | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(
    id: string,
    action: "approve" | "reject" | "revoke",
    fn: () => Promise<unknown>,
  ) {
    setBusy({ id, action });
    setActionError(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setActionError(extractMsg(e));
    } finally {
      setBusy(null);
    }
  }

  function onApprove(c: SellerContract) {
    void run(c.id, "approve", () => sellerContractsApi.approve(c.id));
  }
  function onReject(c: SellerContract) {
    const reason = prompt(`Kuryer so'rovini rad etish sababi (kuryer ko'radi):`);
    if (!reason || reason.trim().length < 3) return;
    void run(c.id, "reject", () => sellerContractsApi.reject(c.id, reason.trim()));
  }
  function onRevoke(c: SellerContract) {
    const reason = prompt("Kontraktni to'xtatish sababi (ixtiyoriy):");
    if (reason === null) return;
    void run(c.id, "revoke", () => sellerContractsApi.revoke(c.id, reason.trim() || undefined));
  }

  const contracts = data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Kuryerlar"
        description="Sizning do'koningiz bilan kontrakt tuzgan kuryerlar. Tasdiqlangan kuryerlarga buyurtmalar avtomatik biriktiriladi."
      />

      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
        <ul className="flex gap-2 w-max sm:w-auto sm:flex-wrap pb-1">
          {CONTRACT_STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <li key={f.label}>
                <button
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`h-8 px-3 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "bg-brand-500 text-white"
                      : "bg-surface-3 text-ink-soft hover:bg-line-soft"
                  }`}
                >
                  {f.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {actionError ? (
        <Card>
          <div className="p-3 text-sm text-danger">{actionError}</div>
        </Card>
      ) : null}

      {loading && !data ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={<Bike className="h-6 w-6" />}
          title={statusFilter ? "Bu holatda kontrakt yo'q" : "Hali kontrakt yo'q"}
          description="Kuryerlar do'koningiz bilan kontrakt tuzganda shu yerda paydo bo'ladi."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {contracts.map((c) => {
            const meta = CONTRACT_STATUS_META[c.status];
            const isBusy = busy?.id === c.id;
            return (
              <li key={c.id}>
                <Card>
                  <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <Bike className="h-6 w-6" />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-ink truncate">
                          {c.courier.name ?? "Kuryer"}
                        </h3>
                        <Badge tone={meta.tone}>
                          {meta.label}
                          {c.isTemporary ? " · vaqtinchalik" : ""}
                        </Badge>
                        {c.status === "ACTIVE" ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] ${
                              c.courier.isOnline ? "text-success" : "text-ink-faint"
                            }`}
                          >
                            <Circle
                              className="h-2 w-2"
                              fill="currentColor"
                              strokeWidth={0}
                            />
                            {c.courier.isOnline ? "Onlayn" : "Oflayn"}
                          </span>
                        ) : null}
                      </div>
                      {/* Transport — prominent so the seller sees the vehicle at a glance */}
                      <div className="mt-1.5">
                        <TransportBadge type={c.courier.transportType} />
                      </div>
                      <p className="text-xs text-ink-muted mt-1.5 inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="font-mono">{formatPhone(c.courier.phone)}</span>
                      </p>
                      {c.status === "ACTIVE" || c.status === "PENDING" ? (
                        <ContractPaymentEditor contract={c} onSaved={reload} />
                      ) : null}
                      {c.message ? (
                        <p className="text-xs text-ink-soft mt-2 line-clamp-2">“{c.message}”</p>
                      ) : null}
                      <p className="text-[11px] text-ink-faint mt-2">
                        So'ralgan: {formatDateTime(c.createdAt)}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {c.status === "PENDING" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => onApprove(c)}
                            loading={isBusy && busy?.action === "approve"}
                            disabled={Boolean(busy)}
                            leftIcon={<Check className="h-4 w-4" />}
                          >
                            Tasdiqlash
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReject(c)}
                            loading={isBusy && busy?.action === "reject"}
                            disabled={Boolean(busy)}
                            leftIcon={<X className="h-4 w-4" />}
                            className="text-danger border-red-200 hover:bg-red-50"
                          >
                            Rad etish
                          </Button>
                        </>
                      ) : c.status === "ACTIVE" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRevoke(c)}
                          loading={isBusy && busy?.action === "revoke"}
                          disabled={Boolean(busy)}
                          leftIcon={<X className="h-4 w-4" />}
                          className="text-danger border-red-200 hover:bg-red-50"
                        >
                          To&apos;xtatish
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function extractMsg(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Xatolik";
  return typeof msg === "string" ? msg : "Xatolik yuz berdi";
}
