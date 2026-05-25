"use client";

import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/lib/auth-store";

export default function DashboardPage() {
  const me = useAuthStore((s) => s.me);
  const name = me?.firstName ?? me?.phone ?? "kuryer";

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Xush kelibsiz, {name}</CardTitle>
          <CardDescription>
            Kuryer paneliga muvaffaqiyatli kirdingiz. Tepadagi menyu orqali bo&apos;limlarga
            o&apos;ting.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <ul className="text-sm text-ink-soft space-y-1.5 list-disc pl-5">
            <li>Yangi yetkazmalarni qabul qiling</li>
            <li>Yetkazma tarixini ko&apos;ring</li>
            <li>Daromadingizni kuzating</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
