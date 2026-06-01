"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bike,
  Check,
  MapPin,
  Package,
  ShoppingBag,
  Store as StoreIcon,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { moderationApi } from "@/features/moderation/api";
import {
  usePendingApplications,
  usePendingProducts,
  usePendingStores,
} from "@/features/moderation/hooks";
import type {
  PendingApplication,
  PendingProduct,
  PendingStore,
} from "@/features/moderation/types";
import { formatDateTime, formatNumber, formatPhone, formatSum } from "@/shared/lib/format";

type Tab = "products" | "stores" | "applications";

const TRANSPORT_LABELS: Record<string, string> = {
  WALK: "Piyoda",
  BICYCLE: "Velosiped",
  MOTORBIKE: "Mototsikl",
  CAR: "Mashina",
  TRUCK: "Yuk mashinasi",
};

const PAGE_SIZE = 20;

export default function ModerationPage() {
  const [tab, setTab] = useState<Tab>("products");
  const [page, setPage] = useState(1);

  const productsState = usePendingProducts({ page, pageSize: PAGE_SIZE });
  const storesState = usePendingStores({ page, pageSize: PAGE_SIZE });
  const applicationsState = usePendingApplications({ page, pageSize: PAGE_SIZE });

  // Per-item busy state (so one approve doesn't disable all buttons).
  const [busy, setBusy] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onApproveProduct(p: PendingProduct) {
    setBusy({ id: p.id, action: "approve" });
    setActionError(null);
    try {
      await moderationApi.approveProduct(p.id);
      await productsState.reload();
    } catch (e) { setActionError(extractMsg(e)); }
    finally { setBusy(null); }
  }

  async function onRejectProduct(p: PendingProduct) {
    const reason = prompt(`"${p.title}" rad etish sababi (sotuvchi ko'radi):`);
    if (!reason || reason.length < 3) return;
    setBusy({ id: p.id, action: "reject" });
    setActionError(null);
    try {
      await moderationApi.rejectProduct(p.id, reason);
      await productsState.reload();
    } catch (e) { setActionError(extractMsg(e)); }
    finally { setBusy(null); }
  }

  async function onApproveStore(s: PendingStore) {
    setBusy({ id: s.id, action: "approve" });
    setActionError(null);
    try {
      await moderationApi.approveStore(s.id);
      await storesState.reload();
    } catch (e) { setActionError(extractMsg(e)); }
    finally { setBusy(null); }
  }

  async function onRejectStore(s: PendingStore) {
    const reason = prompt(`"${s.name}" rad etish sababi (sotuvchi ko'radi):`);
    if (!reason || reason.length < 3) return;
    setBusy({ id: s.id, action: "reject" });
    setActionError(null);
    try {
      await moderationApi.rejectStore(s.id, reason);
      await storesState.reload();
    } catch (e) { setActionError(extractMsg(e)); }
    finally { setBusy(null); }
  }

  async function onApproveApp(a: PendingApplication) {
    setBusy({ id: a.id, action: "approve" });
    setActionError(null);
    try {
      await moderationApi.approveApplication(a.id);
      await applicationsState.reload();
    } catch (e) { setActionError(extractMsg(e)); }
    finally { setBusy(null); }
  }

  async function onRejectApp(a: PendingApplication) {
    const who = a.fullName || `${a.user?.firstName ?? ""} ${a.user?.lastName ?? ""}`.trim() || "kuryer";
    const reason = prompt(`"${who}" arizasini rad etish sababi (kuryer ko'radi):`);
    if (!reason || reason.length < 3) return;
    setBusy({ id: a.id, action: "reject" });
    setActionError(null);
    try {
      await moderationApi.rejectApplication(a.id, reason);
      await applicationsState.reload();
    } catch (e) { setActionError(extractMsg(e)); }
    finally { setBusy(null); }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Moderatsiya"
        description="Do'kon, mahsulot va kuryer arizalarini ko'rib chiqing."
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line">
        <TabButton active={tab === "products"} onClick={() => { setTab("products"); setPage(1); }}>
          <Package className="h-4 w-4" />
          Mahsulotlar
          {productsState.data && productsState.data.meta.total > 0 ? (
            <Badge tone="brand">{productsState.data.meta.total}</Badge>
          ) : null}
        </TabButton>
        <TabButton active={tab === "stores"} onClick={() => { setTab("stores"); setPage(1); }}>
          <StoreIcon className="h-4 w-4" />
          Do'konlar
          {storesState.data && storesState.data.meta.total > 0 ? (
            <Badge tone="brand">{storesState.data.meta.total}</Badge>
          ) : null}
        </TabButton>
        <TabButton active={tab === "applications"} onClick={() => { setTab("applications"); setPage(1); }}>
          <Bike className="h-4 w-4" />
          Kuryer arizalari
          {applicationsState.data && applicationsState.data.meta.total > 0 ? (
            <Badge tone="brand">{applicationsState.data.meta.total}</Badge>
          ) : null}
        </TabButton>
      </div>

      {actionError ? (
        <Card>
          <div className="p-3 flex items-start gap-2 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        </Card>
      ) : null}

      {tab === "products" ? (
        <ProductsList
          state={productsState}
          page={page}
          setPage={setPage}
          busy={busy}
          onApprove={onApproveProduct}
          onReject={onRejectProduct}
        />
      ) : tab === "stores" ? (
        <StoresList
          state={storesState}
          page={page}
          setPage={setPage}
          busy={busy}
          onApprove={onApproveStore}
          onReject={onRejectStore}
        />
      ) : (
        <ApplicationsList
          state={applicationsState}
          page={page}
          setPage={setPage}
          busy={busy}
          onApprove={onApproveApp}
          onReject={onRejectApp}
        />
      )}
    </div>
  );
}

// ─── Tab button ─────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px px-4 h-10 inline-flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-brand-500 text-brand-700"
          : "border-transparent text-ink-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Products list ──────────────────────────────────────────────────

function ProductsList({
  state, page, setPage, busy, onApprove, onReject,
}: {
  state: ReturnType<typeof usePendingProducts>;
  page: number; setPage: (n: number | ((n: number) => number)) => void;
  busy: { id: string; action: "approve" | "reject" } | null;
  onApprove: (p: PendingProduct) => Promise<void>;
  onReject: (p: PendingProduct) => Promise<void>;
}) {
  const { data, loading, error } = state;

  if (loading && !data) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-6 w-6" />}
        title="Moderatsiyada mahsulot yo'q"
        description="Sotuvchilar yangi mahsulot yaratganda shu yerda paydo bo'ladi."
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {data.data.map((p) => {
          const offer = p.variants[0]?.offers[0];
          const isBusy = busy?.id === p.id;
          return (
            <li key={p.id}>
              <Card>
                <div className="p-4 flex gap-4">
                  <div className="h-20 w-20 shrink-0 rounded-md bg-surface-3 border border-line-soft overflow-hidden">
                    {p.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-ink-faint">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-ink truncate">{p.title}</h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {p.category.name} · {p.category.type === "FOOD" ? "Ovqat" : "Marketplace"}
                      {p.brand ? ` · ${p.brand.name}` : ""}
                    </p>
                    {p.description ? (
                      <p className="text-xs text-ink-soft mt-2 line-clamp-2">{p.description}</p>
                    ) : null}
                    {offer ? (
                      <p className="text-xs text-ink-muted mt-2">
                        Narx: <span className="font-medium text-ink tabular-nums">{formatSum(offer.price)}</span>
                        {" · "}
                        Qoldiq: <span className="tabular-nums">{offer.stock}</span>
                        {" · "}
                        Sotuvchi: {offer.store.name}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-faint mt-2">Offer hali yo'q</p>
                    )}
                    {p.createdBy ? (
                      <p className="text-[11px] text-ink-faint mt-2 inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {p.createdBy.firstName} {p.createdBy.lastName}
                        {" · "}
                        <span className="font-mono">{formatPhone(p.createdBy.phone)}</span>
                        {" · "}
                        {formatDateTime(p.createdAt)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => onApprove(p)}
                      loading={isBusy && busy?.action === "approve"}
                      disabled={Boolean(busy)}
                      leftIcon={<Check className="h-4 w-4" />}
                    >
                      Tasdiqlash
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReject(p)}
                      loading={isBusy && busy?.action === "reject"}
                      disabled={Boolean(busy)}
                      leftIcon={<X className="h-4 w-4" />}
                      className="text-danger border-red-200 hover:bg-red-50"
                    >
                      Rad etish
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Pagination meta={data.meta} page={page} setPage={setPage} />
    </>
  );
}

// ─── Stores list ────────────────────────────────────────────────────

function StoresList({
  state, page, setPage, busy, onApprove, onReject,
}: {
  state: ReturnType<typeof usePendingStores>;
  page: number; setPage: (n: number | ((n: number) => number)) => void;
  busy: { id: string; action: "approve" | "reject" } | null;
  onApprove: (s: PendingStore) => Promise<void>;
  onReject: (s: PendingStore) => Promise<void>;
}) {
  const { data, loading, error } = state;

  if (loading && !data) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        icon={<StoreIcon className="h-6 w-6" />}
        title="Moderatsiyada do'kon yo'q"
        description="Sotuvchilar yangi do'kon yaratganda shu yerda paydo bo'ladi."
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {data.data.map((s) => {
          const isBusy = busy?.id === s.id;
          return (
            <li key={s.id}>
              <Card>
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 overflow-hidden">
                      {s.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.logoUrl} alt={s.name} className="h-full w-full object-cover" />
                      ) : (
                        <StoreIcon className="h-6 w-6" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-ink truncate">{s.name}</h3>
                      {s.description ? (
                        <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{s.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => onApprove(s)}
                        loading={isBusy && busy?.action === "approve"}
                        disabled={Boolean(busy)}
                        leftIcon={<Check className="h-4 w-4" />}
                      >
                        Tasdiqlash
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(s)}
                        loading={isBusy && busy?.action === "reject"}
                        disabled={Boolean(busy)}
                        leftIcon={<X className="h-4 w-4" />}
                        className="text-danger border-red-200 hover:bg-red-50"
                      >
                        Rad etish
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                    {s.owner ? (
                      <Info label="Egasi">
                        {s.owner.firstName} {s.owner.lastName} ·{" "}
                        <span className="font-mono">{formatPhone(s.owner.phone)}</span>
                      </Info>
                    ) : null}
                    {s.phone ? <Info label="Telefon">{s.phone}</Info> : null}
                    {s.inn ? <Info label="INN">{s.inn}</Info> : null}
                    {s.legalName ? <Info label="Yuridik nom">{s.legalName}</Info> : null}
                    {s.address ? <Info label="Manzil">{s.address}</Info> : null}
                    {s.latitude !== null && s.longitude !== null ? (
                      <Info label="Koordinatalar">
                        <a
                          href={`https://yandex.uz/maps/?ll=${s.longitude},${s.latitude}&z=17&pt=${s.longitude},${s.latitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                        >
                          <MapPin className="h-3 w-3" />
                          {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
                        </a>
                      </Info>
                    ) : null}
                    {s.deliveryRadiusKm ? (
                      <Info label="Radius">{s.deliveryRadiusKm} km</Info>
                    ) : null}
                    {s.deliveryBaseFee !== null ? (
                      <Info label="Asosiy fee">{formatNumber(s.deliveryBaseFee)} so'm</Info>
                    ) : null}
                    {s.deliveryPerKmFee !== null ? (
                      <Info label="1 km narxi">{formatNumber(s.deliveryPerKmFee)} so'm</Info>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-ink-faint">
                    Yaratilgan: {formatDateTime(s.createdAt)}
                  </p>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Pagination meta={data.meta} page={page} setPage={setPage} />
    </>
  );
}

// ─── Applications list ──────────────────────────────────────────────

function ApplicationsList({
  state, page, setPage, busy, onApprove, onReject,
}: {
  state: ReturnType<typeof usePendingApplications>;
  page: number; setPage: (n: number | ((n: number) => number)) => void;
  busy: { id: string; action: "approve" | "reject" } | null;
  onApprove: (a: PendingApplication) => Promise<void>;
  onReject: (a: PendingApplication) => Promise<void>;
}) {
  const { data, loading, error } = state;

  if (loading && !data) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        icon={<Bike className="h-6 w-6" />}
        title="Moderatsiyada ariza yo'q"
        description="Foydalanuvchilar kuryer bo'lishga ariza topshirganda shu yerda paydo bo'ladi."
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {data.data.map((a) => {
          const isBusy = busy?.id === a.id;
          const name =
            a.fullName ||
            `${a.user?.firstName ?? ""} ${a.user?.lastName ?? ""}`.trim() ||
            "—";
          return (
            <li key={a.id}>
              <Card>
                <div className="p-4 flex gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Bike className="h-6 w-6" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-ink truncate">{name}</h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {a.transportType ? (TRANSPORT_LABELS[a.transportType] ?? a.transportType) : "—"}
                      {a.user ? (
                        <>
                          {" · "}
                          <span className="font-mono">{formatPhone(a.user.phone)}</span>
                        </>
                      ) : null}
                    </p>
                    {a.note ? (
                      <p className="text-xs text-ink-soft mt-2 line-clamp-3">{a.note}</p>
                    ) : null}
                    <p className="text-[11px] text-ink-faint mt-2">
                      Topshirilgan: {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => onApprove(a)}
                      loading={isBusy && busy?.action === "approve"}
                      disabled={Boolean(busy)}
                      leftIcon={<Check className="h-4 w-4" />}
                    >
                      Tasdiqlash
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReject(a)}
                      loading={isBusy && busy?.action === "reject"}
                      disabled={Boolean(busy)}
                      leftIcon={<X className="h-4 w-4" />}
                      className="text-danger border-red-200 hover:bg-red-50"
                    >
                      Rad etish
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Pagination meta={data.meta} page={page} setPage={setPage} />
    </>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-ink-muted shrink-0">{label}:</span>
      <span className="text-ink truncate">{children}</span>
    </div>
  );
}

function Pagination({
  meta,
  page,
  setPage,
}: {
  meta: { totalPages: number; total: number };
  page: number;
  setPage: (n: number | ((n: number) => number)) => void;
}) {
  if (meta.totalPages <= 1) return null;
  return (
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
        {page} / {meta.totalPages} · {meta.total} ta
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage((p) => p + 1)}
        disabled={page >= meta.totalPages}
      >
        Keyingi
      </Button>
    </div>
  );
}

function extractMsg(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Xatolik";
  return typeof msg === "string" ? msg : "Xatolik yuz berdi";
}
