"use client";

import { FormEvent, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { useLocationStore } from "@/features/location/store";
import { addressesApi } from "./api";
import type { Address, CreateAddressDto } from "./types";

// Leaflet is browser-only — load the picker client-side (no SSR window error).
const LocationPicker = dynamic(
  () => import("./LocationPicker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => <div className="h-65 w-full rounded-xl bg-surface-3 animate-pulse" />,
  },
);

interface AddressFormProps {
  initial?: Address;
  onSaved: (address: Address) => void;
  onCancel?: () => void;
  /** When true, the form ticks "isDefault" by default — used on first address. */
  defaultAsDefault?: boolean;
}

/**
 * Buyers set their delivery coordinates on a Leaflet map (tap or drag the pin);
 * the "current GPS" button re-centers it. Coordinates are kept as latitude/
 * longitude strings so the existing submit validation stays unchanged.
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
    if (latitude === "" || longitude === "") {
      setError("Xaritada joylashuvingizni belgilang");
      return;
    }
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
      // The address just picked on the map becomes the active location now —
      // no stale once-seeded value lingers (no navigation/reload needed).
      useLocationStore.getState().setLocation({
        lat: saved.latitude,
        lng: saved.longitude,
        label: saved.label,
        addressId: saved.id,
      });
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
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-soft">Joylashuv</span>
        <LocationPicker
          lat={latitude === "" ? null : Number(latitude)}
          lng={longitude === "" ? null : Number(longitude)}
          onChange={(la, ln) => {
            setLatitude(la.toFixed(6));
            setLongitude(ln.toFixed(6));
          }}
          className="border border-line"
        />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={useCurrentLocation}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
          >
            <MapPin className="h-3.5 w-3.5" /> Hozirgi joylashuvni olish
          </button>
          {latitude && longitude ? (
            <span className="text-[11px] text-ink-faint tabular-nums">
              {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
            </span>
          ) : (
            <span className="text-[11px] text-ink-faint">Xaritani bosing yoki pinni suring</span>
          )}
        </div>
      </div>
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
