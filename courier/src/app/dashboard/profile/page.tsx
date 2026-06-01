"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bike, Phone, Power, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { courierApi } from "@/features/deliveries/api";
import { useCourierProfile } from "@/features/deliveries/hooks";
import { TRANSPORT_OPTIONS } from "@/features/deliveries/status";
import type { TransportType } from "@/features/deliveries/types";
import { formatPhoneNumber } from "@/lib/format";

export default function ProfilePage() {
  const { data: profile, loading, error, setData } = useCourierProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [transportType, setTransportType] = useState<TransportType | "">("");
  const [workRadiusKm, setWorkRadiusKm] = useState("");
  const [categories, setCategories] = useState("");
  const [online, setOnline] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Hydrate the form once the profile arrives.
  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
    setTransportType(profile.transportType ?? "");
    setWorkRadiusKm(profile.workRadiusKm != null ? String(profile.workRadiusKm) : "");
    setCategories(profile.categories.join(", "));
    setOnline(profile.isOnline);
  }, [profile]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const updated = await courierApi.updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        transportType: transportType || undefined,
        workRadiusKm: workRadiusKm ? Number(workRadiusKm) : undefined,
        categories: categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        isOnline: online,
      });
      setData(updated);
      setSaved(true);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setSaveError(Array.isArray(msg) ? msg[0] : msg || "Saqlanmadi");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !profile) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (error || !profile) {
    return <p className="mx-auto max-w-3xl text-sm text-danger">{error ?? "Profil topilmadi"}</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title="Profil" description="Shaxsiy va ish ma'lumotlaringiz." />

      {/* Identity */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ink text-xl font-semibold text-bee-500">
              {(profile.firstName ?? "K").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink">
                {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Kuryer"}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Phone className="h-3.5 w-3.5" />
                {formatPhoneNumber(profile.phone)}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-sm text-ink-muted">
              <Star className="h-4 w-4 text-accent-500" />
              {profile.rating != null ? profile.rating.toFixed(1) : "—"}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Editable form */}
      <form onSubmit={onSave}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bike className="h-4 w-4 text-ink-muted" /> Ish sozlamalari
            </CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Ism"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ism"
              />
              <Input
                label="Familiya"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Familiya"
              />
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-soft">Transport turi</span>
              <select
                value={transportType}
                onChange={(e) => setTransportType(e.target.value as TransportType | "")}
                className="h-11 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-bee-500 focus:ring-2 focus:ring-bee-200"
              >
                <option value="">Tanlang…</option>
                {TRANSPORT_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Ish radiusi (km)"
              name="workRadiusKm"
              inputMode="numeric"
              value={workRadiusKm}
              onChange={(e) => setWorkRadiusKm(e.target.value.replace(/\D+/g, "").slice(0, 3))}
              placeholder="15"
              hint="Shu radiusdagi buyurtmalar ko'rsatiladi (standart: 15 km)"
            />

            <Input
              label="Ishlaydigan kategoriyalar"
              name="categories"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="ovqat, qurilish"
              hint="Vergul bilan ajrating"
            />

            <button
              type="button"
              onClick={() => setOnline((v) => !v)}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                online
                  ? "border-success/30 bg-success/5"
                  : "border-line bg-surface-2"
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-ink">
                <Power className="h-4 w-4" /> Ish holati
              </span>
              <span
                className={`inline-flex items-center gap-2 text-xs font-semibold ${
                  online ? "text-success" : "text-ink-muted"
                }`}
              >
                {online ? "Aktiv" : "Noaktiv"}
                <span
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    online ? "bg-success" : "bg-line"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                      online ? "left-4" : "left-0.5"
                    }`}
                  />
                </span>
              </span>
            </button>

            {saveError ? (
              <p className="text-sm text-danger">{saveError}</p>
            ) : saved ? (
              <p className="text-sm text-success">Saqlandi ✓</p>
            ) : null}

            <Button type="submit" loading={saving} size="lg">
              Saqlash
            </Button>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
