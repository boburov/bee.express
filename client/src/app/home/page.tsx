"use client";

import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/lib/auth-store";

export default function HomePage() {
  const me = useAuthStore((s) => s.me);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Xush kelibsiz</h1>
        <p className="text-sm text-ink-muted mt-1">
          {me?.firstName ?? me?.phone ?? "Foydalanuvchi"}, hisobingizga muvaffaqiyatli kirdingiz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hisob ma&apos;lumotlari</CardTitle>
          <CardDescription>Profilingiz holati</CardDescription>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-sm">
            <dt className="text-ink-muted">Telefon</dt>
            <dd className="text-ink">{me?.phone ?? "—"}</dd>
            <dt className="text-ink-muted">Telegram</dt>
            <dd className="text-ink">{me?.telegramId ?? "—"}</dd>
            <dt className="text-ink-muted">Rol</dt>
            <dd className="text-ink">{me?.role?.name ?? "Belgilanmagan"}</dd>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keyingi qadam</CardTitle>
          <CardDescription>
            Bu sahifa hozircha placeholder. Keyingi bosqichda kategoriyalar, sotuvchilar va savat
            ko&apos;rsatiladi.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
