"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, MapPin, Plus, ShoppingBag, Store } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Spinner } from "@/shared/ui/Spinner";
import { AddressForm } from "@/features/addresses/AddressForm";
import { useAddresses } from "@/features/addresses/hooks";
import { useCartStore } from "@/features/cart/store";
import { ordersApi } from "@/features/orders/api";
import { formatSum } from "@/shared/lib/format";

/**
 * Checkout — terminal step of the buy flow.
 *
 * Two side-by-side concerns:
 *   1. Address selection. If the user has none, the form is rendered inline
 *      so they can create one without leaving the page.
 *   2. Cart summary (read-only — qty edits live on /cart).
 *
 * Submit calls POST /orders/checkout which splits the cart into one Order
 * per Store. After success we redirect to /orders to show the buyer the
 * fresh order(s).
 */
export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCartStore((s) => s.cart);
  const cartLoading = useCartStore((s) => s.loading);
  const fetchCart = useCartStore((s) => s.fetch);

  const { data: addresses, loading: addrLoading, reload: reloadAddresses } = useAddresses();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Auto-select the default address (or the only one) when the list lands.
  useEffect(() => {
    if (!addresses || selectedAddressId) return;
    const defaultOne = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (defaultOne) setSelectedAddressId(defaultOne.id);
  }, [addresses, selectedAddressId]);

  const isEmpty = !cart || cart.itemCount === 0;
  const hasAddresses = (addresses?.length ?? 0) > 0;
  const canSubmit = Boolean(selectedAddressId) && !isEmpty && !submitting;

  async function onSubmit() {
    if (!selectedAddressId || isEmpty) return;
    setError(null);
    setSubmitting(true);
    try {
      await ordersApi.checkout({ addressId: selectedAddressId, notes: notes || undefined });
      // Cart is wiped server-side; refresh local store and route to orders.
      await fetchCart();
      router.replace("/orders");
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Buyurtma yaratilmadi");
    } finally {
      setSubmitting(false);
    }
  }

  if ((cartLoading && !cart) || (addrLoading && !addresses)) {
    return <div className="flex justify-center py-10"><Spinner /></div>;
  }

  return (
    <div className="flex flex-col gap-5 w-full lg:max-w-2xl lg:mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/cart"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Buyurtma berish</h1>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Savatingiz bo'sh"
          description="Avval katalogdan mahsulot tanlang."
          action={<Link href="/catalog"><Button>Katalogni ochish</Button></Link>}
        />
      ) : (
        <>
          {/* ─── 1. Manzil ────────────────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white text-[11px] font-bold">1</span>
              Yetkazib berish manzili
            </h2>

            {hasAddresses && !creatingAddress ? (
              <>
                <ul className="flex flex-col gap-2">
                  {addresses!.map((a) => {
                    const selected = selectedAddressId === a.id;
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedAddressId(a.id)}
                          className={`w-full rounded-xl border bg-surface text-left p-3 flex gap-3 items-start transition-colors ${
                            selected ? "border-brand-300 ring-1 ring-brand-200" : "border-line hover:border-brand-200"
                          }`}
                        >
                          <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            selected ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600"
                          }`}>
                            {selected ? <Check className="h-4 w-4" /> : <MapPin className="h-4 w-4" strokeWidth={1.75} />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-ink truncate">{a.label}</h4>
                              {a.isDefault ? <Badge tone="brand">Asosiy</Badge> : null}
                            </div>
                            <p className="text-sm text-ink-soft line-clamp-2">{a.fullText}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => setCreatingAddress(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline self-start"
                >
                  <Plus className="h-4 w-4" /> Yangi manzil qo&apos;shish
                </button>
              </>
            ) : (
              <Card>
                <div className="p-4">
                  {!hasAddresses ? (
                    <p className="text-sm text-ink-muted mb-3">
                      Hali manzil saqlanmagan. Birinchi manzilingizni qo&apos;shing.
                    </p>
                  ) : null}
                  <AddressForm
                    defaultAsDefault={!hasAddresses}
                    onSaved={async (a) => {
                      setCreatingAddress(false);
                      await reloadAddresses();
                      setSelectedAddressId(a.id);
                    }}
                    onCancel={hasAddresses ? () => setCreatingAddress(false) : undefined}
                  />
                </div>
              </Card>
            )}
          </section>

          {/* ─── 2. Cart summary ─────────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white text-[11px] font-bold">2</span>
              Buyurtma tarkibi
            </h2>
            {cart!.stores.map((group) => (
              <Card key={group.store.id}>
                <div className="p-4 border-b border-line-soft flex items-center gap-3">
                  <Store className="h-4 w-4 text-brand-600 shrink-0" strokeWidth={1.75} />
                  <h3 className="text-sm font-semibold text-ink truncate flex-1">{group.store.name}</h3>
                  <p className="text-xs text-ink-muted shrink-0">{formatSum(group.subtotal)}</p>
                </div>
                <ul className="divide-y divide-line-soft">
                  {group.items.map((item) => (
                    <li key={item.id} className="p-3 flex items-center gap-3 text-sm">
                      <span className="text-ink-muted shrink-0">{item.qty}×</span>
                      <span className="flex-1 min-w-0 truncate text-ink">{item.product.title}</span>
                      <span className="text-ink shrink-0">{formatSum(item.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-ink-faint p-3 border-t border-line-soft">
                  Yetkazib berish narxi do&apos;kon va manzilingiz orasidagi masofa bo&apos;yicha hisoblanadi.
                </p>
              </Card>
            ))}
          </section>

          {/* ─── 3. Notes ────────────────────────────────────────────── */}
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white text-[11px] font-bold">3</span>
              Eslatma (ixtiyoriy)
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Sotuvchiga eslatma — alergiya, qadoqlash, va h.k."
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200"
            />
          </section>

          {/* ─── 4. To'lov + submit ──────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white text-[11px] font-bold">4</span>
              To&apos;lov
            </h2>
            <Card>
              <div className="p-4 text-sm">
                <p className="font-medium text-ink">Naqd (yetkazib berishda)</p>
                <p className="text-ink-muted mt-1">Click / Payme tez orada.</p>
              </div>
            </Card>
          </section>

          {error ? (
            <Card>
              <div className="p-4 flex items-start gap-3 text-sm text-danger">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            </Card>
          ) : null}

          <Card>
            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-ink-muted">Mahsulotlar uchun</p>
                <p className="text-lg font-semibold text-ink">{formatSum(cart!.subtotal)}</p>
                <p className="text-[11px] text-ink-faint mt-0.5">+ yetkazib berish keyin qo&apos;shiladi</p>
              </div>
              <Button
                onClick={onSubmit}
                disabled={!canSubmit}
                loading={submitting}
                rightIcon={!submitting ? <Check className="h-4 w-4" /> : undefined}
              >
                Tasdiqlash
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
