"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Logo } from "@/components/Logo";
import { onboardingApi } from "@/features/onboarding/api";
import { useOnboarding } from "@/features/onboarding/hooks";
import type { TransportType } from "@/features/deliveries/types";
import { TRANSPORT_OPTIONS } from "@/features/deliveries/status";
import { extractMsg } from "@/features/deliveries/hooks";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function ApplyPage() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setMe = useAuthStore((s) => s.setMe);
  const clear = useAuthStore((s) => s.clear);

  const enabled = hydrated && !!accessToken;
  const { data, loading, reload } = useOnboarding(enabled);

  const [transportType, setTransportType] = useState<TransportType>("BICYCLE");
  const [fullName, setFullName] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Not signed in → bounce to login.
  useEffect(() => {
    if (hydrated && !accessToken) router.replace("/login");
  }, [hydrated, accessToken, router]);

  // Already approved (courier role granted) → refresh the cached profile so the
  // dashboard guard sees the role, then enter the dashboard.
  useEffect(() => {
    if (!data?.isCourier) return;
    api
      .get("/auth/me")
      .then((r) => setMe(r.data))
      .finally(() => router.replace("/dashboard"));
  }, [data?.isCourier, router, setMe]);

  // Prefill the form from an existing (rejected/pending) application.
  useEffect(() => {
    const app = data?.application;
    if (app) {
      setTransportType((app.transportType as TransportType) ?? "BICYCLE");
      setFullName(app.fullName ?? "");
      setNote(app.note ?? "");
    }
  }, [data?.application]);

  async function onLogout() {
    const { refreshToken } = useAuthStore.getState();
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } finally {
      clear();
      router.replace("/login");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onboardingApi.apply({
        transportType,
        fullName: fullName.trim() || undefined,
        note: note.trim() || undefined,
      });
      setEditing(false);
      await reload();
    } catch (err) {
      setError(extractMsg(err));
    } finally {
      setSubmitting(false);
    }
  }

  const app = data?.application ?? null;
  const showForm = !app || app.status === "REJECTED" || editing;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={44} />
          <p className="text-sm text-ink-muted">Kuryer bo&apos;lish</p>
        </div>

        {!enabled || (loading && !data) ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" label="Yuklanmoqda…" />
          </div>
        ) : (
          <Card>
            {app && app.status === "PENDING" && !editing ? (
              <StatusView
                tone="pending"
                title="Arizangiz ko'rib chiqilmoqda"
                description="Administrator arizangizni tasdiqlagach, kuryer paneli ochiladi. Tasdiqlanganda Telegram orqali xabar olasiz."
                app={app}
                onEdit={() => setEditing(true)}
              />
            ) : showForm ? (
              <>
                <CardHeader>
                  <CardTitle>
                    {app?.status === "REJECTED" ? "Qayta ariza topshirish" : "Kuryer arizasi"}
                  </CardTitle>
                  <CardDescription>
                    Transport turingizni tanlang. Admin tasdiqlagach do&apos;konlar bilan
                    kontrakt tuza olasiz.
                  </CardDescription>
                </CardHeader>
                <CardBody>
                  {app?.status === "REJECTED" && app.rejectionReason ? (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      Oldingi ariza rad etildi: {app.rejectionReason}
                    </div>
                  ) : null}
                  <form className="flex flex-col gap-4" onSubmit={onSubmit}>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-ink-soft">Transport turi</span>
                      <select
                        value={transportType}
                        onChange={(e) => setTransportType(e.target.value as TransportType)}
                        className="h-11 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-bee-500 focus:ring-2 focus:ring-bee-200"
                      >
                        {TRANSPORT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Input
                      label="To'liq ism (ixtiyoriy)"
                      name="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ism Familiya"
                      disabled={submitting}
                    />
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-ink-soft">Izoh (ixtiyoriy)</span>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="O'zingiz haqingizda qisqacha…"
                        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-bee-500 focus:ring-2 focus:ring-bee-200"
                      />
                    </label>
                    {error ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                      </div>
                    ) : null}
                    <Button type="submit" size="lg" loading={submitting}>
                      {app ? "Arizani yuborish" : "Ariza topshirish"}
                    </Button>
                    {editing ? (
                      <button
                        type="button"
                        className="text-sm text-ink-muted hover:text-ink"
                        onClick={() => setEditing(false)}
                      >
                        ← Bekor qilish
                      </button>
                    ) : null}
                  </form>
                </CardBody>
              </>
            ) : null}
          </Card>
        )}

        <button
          onClick={onLogout}
          className="mt-6 block w-full text-center text-xs text-ink-muted hover:text-ink"
        >
          Chiqish
        </button>
      </div>
    </main>
  );
}

function StatusView({
  tone,
  title,
  description,
  app,
  onEdit,
}: {
  tone: "pending" | "approved" | "rejected";
  title: string;
  description: string;
  app: { transportType: string | null; fullName: string | null; createdAt: string };
  onEdit: () => void;
}) {
  const icon =
    tone === "approved" ? (
      <CheckCircle2 className="h-6 w-6" />
    ) : tone === "rejected" ? (
      <XCircle className="h-6 w-6" />
    ) : (
      <Clock className="h-6 w-6" />
    );
  return (
    <CardBody className="pt-6">
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          {icon}
        </span>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      <div className="mt-5 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm">
        {app.fullName ? (
          <Row label="Ism" value={app.fullName} />
        ) : null}
        {app.transportType ? <Row label="Transport" value={app.transportType} /> : null}
      </div>
      <Button variant="outline" className="mt-4 w-full" onClick={onEdit}>
        Arizani tahrirlash
      </Button>
    </CardBody>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
