"use client";

import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/lib/auth-store";

export default function DashboardPage() {
  const me = useAuthStore((s) => s.me);
  const name = me?.firstName ?? me?.phone ?? "sotuvchi";

  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Xush kelibsiz, {name}</CardTitle>
          <CardDescription>
            Sotuvchi paneliga muvaffaqiyatli kirdingiz. Chap menyu orqali bo&apos;limlarga
            o&apos;ting.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <ul className="text-sm text-ink-soft space-y-1.5 list-disc pl-5">
            <li>Mahsulotlaringizni qo&apos;shing va boshqaring</li>
            <li>Yangi buyurtmalarni qabul qiling</li>
            <li>Moliyaviy hisobot va to&apos;lovlarni kuzating</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
