import Link from "next/link";
import { Package, ShoppingBag, Wallet } from "lucide-react";
import { Logo } from "@/shared/ui/Logo";
import { SellerLoginForm } from "@/features/auth/seller-login/LoginForm";
import { env } from "@/shared/config/env";

const trustPoints = [
  { icon: Package, label: "Mahsulot boshqaruvi" },
  { icon: ShoppingBag, label: "Buyurtma qabuli" },
  { icon: Wallet, label: "Moliya hisoboti" },
];

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-warm">
      <div className="absolute inset-0 bg-gradient-soft pointer-events-none" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <Logo size={48} />
          <p className="text-sm text-ink-muted max-w-xs">
            Sotuvchi paneli. Mahsulot, buyurtma va moliyaning bir joydan boshqaruvi.
          </p>
        </div>

        <SellerLoginForm />

        <ul className="mt-5 grid grid-cols-3 gap-2">
          {trustPoints.map((t) => {
            const Icon = t.icon;
            return (
              <li
                key={t.label}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface/70 backdrop-blur px-2 py-3 text-center"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-[10px] font-medium text-ink-soft leading-tight">
                  {t.label}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Hisob yo&apos;qmi? Avval{" "}
          <Link
            href={`https://t.me/${env.botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-700 hover:underline"
          >
            @{env.botUsername}
          </Link>{" "}
          botga /start bosib telefoningizni ulashing, keyin administratorga sotuvchi
          roli berishni so&apos;rang.
        </p>
      </div>
    </main>
  );
}
