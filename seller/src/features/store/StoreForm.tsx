"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, MapPin } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { storeApi } from "./api";
import type { CreateStoreDto, Store } from "./types";

interface StoreFormProps {
  initial?: Store | null;
  onSaved: (store: Store) => void;
}

/**
 * Big create/edit form. Drives both POST /seller/stores (when no existing
 * store) and PATCH /seller/stores/me (when editing). Fields the seller
 * leaves blank stay null on the server.
 *
 * v1 omissions:
 *  - openingHours UI — server accepts the JSON, but the weekly schedule
 *    picker is a separate component (next slice). For now we don't surface it.
 *  - logo / banner upload — Cloudflare R2 credentials missing; uploads
 *    return 503. Field is hidden until R2 is wired.
 */
export function StoreForm({ initial, onSaved }: StoreFormProps) {
  const isEdit = Boolean(initial);

  // Basic
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  // KYC
  const [inn, setInn] = useState(initial?.inn ?? "");
  const [legalName, setLegalName] = useState(initial?.legalName ?? "");
  // Contact
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  // Geo
  const [latitude, setLatitude] = useState<string>(initial?.latitude != null ? String(initial.latitude) : "");
  const [longitude, setLongitude] = useState<string>(initial?.longitude != null ? String(initial.longitude) : "");
  // Delivery overrides (null = use category defaults)
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<string>(
    initial?.deliveryRadiusKm != null ? String(initial.deliveryRadiusKm) : "",
  );
  const [deliveryBaseFee, setDeliveryBaseFee] = useState<string>(
    initial?.deliveryBaseFee != null ? String(initial.deliveryBaseFee) : "",
  );
  const [deliveryPerKmFee, setDeliveryPerKmFee] = useState<string>(
    initial?.deliveryPerKmFee != null ? String(initial.deliveryPerKmFee) : "",
  );
  const [deliveryEtaMinutes, setDeliveryEtaMinutes] = useState<string>(
    initial?.deliveryEtaMinutes != null ? String(initial.deliveryEtaMinutes) : "",
  );
  const [minOrderAmount, setMinOrderAmount] = useState<string>(
    initial?.minOrderAmount != null ? String(initial.minOrderAmount) : "",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Brauzer geolokatsiya qo'llab-quvvatlamaydi");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      },
      (err) => setError(`Joylashuv olinmadi: ${err.message}`),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function numOrUndef(s: string): number | undefined {
    if (s.trim() === "") return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Geo pair validation — server also checks, but fail fast on the UI.
    const lat = numOrUndef(latitude);
    const lng = numOrUndef(longitude);
    if ((lat === undefined) !== (lng === undefined)) {
      setError("Latitude va longitude birga kiritilishi kerak");
      return;
    }
    if (lat !== undefined && (lat < -90 || lat > 90 || lng! < -180 || lng! > 180)) {
      setError("Koordinatalar diapazondan tashqarida");
      return;
    }

    const dto: CreateStoreDto = {
      name,
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      inn: inn.trim() || undefined,
      legalName: legalName.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      latitude: lat,
      longitude: lng,
      deliveryRadiusKm: numOrUndef(deliveryRadiusKm),
      deliveryBaseFee: numOrUndef(deliveryBaseFee),
      deliveryPerKmFee: numOrUndef(deliveryPerKmFee),
      deliveryEtaMinutes: numOrUndef(deliveryEtaMinutes),
      minOrderAmount: numOrUndef(minOrderAmount),
    };

    setLoading(true);
    try {
      const saved = isEdit
        ? await storeApi.updateMine(dto)
        : await storeApi.create(dto);
      onSaved(saved);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Saqlanmadi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* ─── Basic info ──────────────────────────────────────────── */}
      <Card>
        <div className="p-4 border-b border-line-soft">
          <h3 className="text-sm font-semibold text-ink">Asosiy ma'lumotlar</h3>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <Input
            label="Do'kon nomi"
            placeholder="Masalan: Lavash Paradise"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
          />
          <Input
            label="Slug (URL nomi)"
            placeholder="lavash-paradise (avtomatik yaratiladi)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            maxLength={60}
            hint="Bo'sh qoldirsangiz do'kon nomidan avtomatik yaratiladi"
          />
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Tavsif</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Do'koningiz haqida qisqacha — assortiment, mazza, xizmatlar…"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>
      </Card>

      {/* ─── KYC ─────────────────────────────────────────────────── */}
      <Card>
        <div className="p-4 border-b border-line-soft">
          <h3 className="text-sm font-semibold text-ink">Yuridik ma'lumot (KYC)</h3>
          <p className="text-xs text-ink-muted mt-1">
            Admin tasdiqlash uchun zarur. Ixtiyoriy lekin tasdiqlash bezor bo'lishi mumkin.
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="INN / STIR"
            placeholder="123456789"
            value={inn}
            onChange={(e) => setInn(e.target.value)}
            maxLength={40}
            inputMode="numeric"
          />
          <Input
            label="Yuridik nom"
            placeholder='"BeeFood" MChJ'
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            maxLength={200}
          />
        </div>
      </Card>

      {/* ─── Contact + Geo ───────────────────────────────────────── */}
      <Card>
        <div className="p-4 border-b border-line-soft">
          <h3 className="text-sm font-semibold text-ink">Aloqa va joylashuv</h3>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <Input
            label="Telefon"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
            inputMode="tel"
          />
          <Input
            label="Manzil"
            placeholder="Toshkent shahri, Mirobod tumani, Amir Temur ko'chasi 12"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={500}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              placeholder="41.3111"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              inputMode="decimal"
            />
            <Input
              label="Longitude"
              placeholder="69.2797"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline self-start"
          >
            <MapPin className="h-3.5 w-3.5" /> Hozirgi joylashuvni olish
          </button>
          <p className="text-[11px] text-ink-faint">
            FOOD kategoriyasidagi xaridorlar do'koningizni faqat radius ichida ko'radi.
            Yetkazib berish narxi shu koordinatadan masofa bo'yicha hisoblanadi.
          </p>
        </div>
      </Card>

      {/* ─── Delivery overrides ──────────────────────────────────── */}
      <Card>
        <div className="p-4 border-b border-line-soft">
          <h3 className="text-sm font-semibold text-ink">Yetkazib berish (ixtiyoriy)</h3>
          <p className="text-xs text-ink-muted mt-1">
            Bo'sh qoldirilsa — kategoriya bo'yicha standart qiymatlar ishlatiladi.
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Radius (km)"
            placeholder="10"
            value={deliveryRadiusKm}
            onChange={(e) => setDeliveryRadiusKm(e.target.value)}
            inputMode="numeric"
            hint="Faqat shu masofada xaridorlarga ko'rinasiz"
          />
          <Input
            label="Asosiy narx (so'm)"
            placeholder="5000"
            value={deliveryBaseFee}
            onChange={(e) => setDeliveryBaseFee(e.target.value)}
            inputMode="numeric"
          />
          <Input
            label="1 km narxi (so'm)"
            placeholder="2000"
            value={deliveryPerKmFee}
            onChange={(e) => setDeliveryPerKmFee(e.target.value)}
            inputMode="numeric"
          />
          <Input
            label="O'rtacha yetkazib berish vaqti (daqiqa)"
            placeholder="45"
            value={deliveryEtaMinutes}
            onChange={(e) => setDeliveryEtaMinutes(e.target.value)}
            inputMode="numeric"
          />
          <Input
            label="Minimal buyurtma (so'm)"
            placeholder="30000"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            inputMode="numeric"
            hint="Shundan kam buyurtma qabul qilinmaydi"
          />
        </div>
      </Card>

      {error ? (
        <Card>
          <div className="p-4 flex items-start gap-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        </Card>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={loading} size="lg">
          {isEdit ? "O'zgarishlarni saqlash" : "Do'konni yaratish"}
        </Button>
      </div>
    </form>
  );
}
