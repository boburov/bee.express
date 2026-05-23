import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

const stats = [
  { label: "Bugungi buyurtmalar", value: "—" },
  { label: "Bugungi tushum", value: "—" },
  { label: "Aktiv kuryerlar", value: "—" },
  { label: "Aktiv sotuvchilar", value: "—" },
  { label: "Yangi ro'yxat", value: "—" },
  { label: "Ochiq shikoyatlar", value: "—" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Boshqaruv</h1>
        <p className="text-sm text-ink-muted mt-1">
          Tizim umumiy ko&apos;rsatkichlari. Real ma&apos;lumotlar keyingi bosqichda ulanadi.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <div className="text-sm text-ink-muted">{s.label}</div>
              <div className="mt-2 text-3xl font-semibold text-ink">{s.value}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Keyingi qadamlar</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="list-disc list-inside text-sm text-ink-soft space-y-1">
            <li>Kategoriyalar bo&apos;limini sozlash va dinamik field&apos;lar qo&apos;shish.</li>
            <li>Birinchi adminlarni qo&apos;shish (Rollar bo&apos;limidan).</li>
            <li>Sotuvchi arizalarini moderatsiya qilish ro&apos;yxati.</li>
            <li>Yetkazib berish formulasini hudud bo&apos;yicha kiritish.</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
