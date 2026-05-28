"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { addressesApi } from "./api";
import type { Address, CreateAddressDto } from "./types";

interface AddressFormProps {
  initial?: Address;
  onSaved: (address: Address) => void;
  onCancel?: () => void;
  /** When true, the form ticks "isDefault" by default — used on first address. */
  defaultAsDefault?: boolean;
}

/**
 * Manual lat/lng entry for v1 — Yandex/OSM map picker comes in a separate
 * slice. For now buyers paste coords from Telegram's "Share Location" or
 * a one-click "current GPS" button (browser geolocation).
 */
export function AddressForm({ initial, onSaved, onCancel, defaultAsDefault }: AddressFormProps) {
  const [label, setLabel] = useState(initial?.label ?? "Uy");
  const [fullText, setFullText] = useState(initial?.fullText ?? "");
  const [latitude, setLatitude] = useState<string>(initial ? String(initial.latitude) : "");
  const [longitude, setLongitude] = useState<string>(initial ? String(initial.longitude) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? Boolean(defaultAsDefault));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Koordinatalarni to'g'ri kiriting");
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Koordinatalar diapazondan tashqarida");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const dto: CreateAddressDto = {
        label,
        fullText,
        latitude: lat,
        longitude: lng,
        notes: notes || undefined,
        isDefault,
      };
      const saved = initial
        ? await addressesApi.update(initial.id, dto)
        : await addressesApi.create(dto);
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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label="Nomi"
        placeholder="Uy, Ish, Onamning uyi..."
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={40}
        required
      />
      <Input
        label="To'liq manzil"
        placeholder="Mirobod ko'chasi, 12-uy, 45-xonadon"
        value={fullText}
        onChange={(e) => setFullText(e.target.value)}
        maxLength={500}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Latitude"
          placeholder="41.3111"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          inputMode="decimal"
          required
        />
        <Input
          label="Longitude"
          placeholder="69.2797"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          inputMode="decimal"
          required
        />
      </div>
      <button
        type="button"
        onClick={useCurrentLocation}
        className="text-xs text-brand-700 hover:underline text-left"
      >
        Hozirgi joylashuvni olish
      </button>
      <Input
        label="Eslatma (ixtiyoriy)"
        placeholder="Domofon kodi, podyezd raqami..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={500}
      />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-200"
        />
        Asosiy manzil sifatida belgilash
      </label>
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" loading={loading} block>
          {initial ? "Saqlash" : "Qo'shish"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Bekor
          </Button>
        ) : null}
      </div>
    </form>
  );
}
