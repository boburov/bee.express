import Link from "next/link";
import { Logo } from "@/shared/ui/Logo";
import { PhoneOtpForm } from "@/features/auth/phone-otp/PhoneOtpForm";
import { env } from "@/shared/config/env";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-warm">
      <div className="absolute inset-0 bg-gradient-soft pointer-events-none" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo size={52} />
          <p className="text-sm text-ink-muted">
            Yetkazib berish va marketplace platformasi
          </p>
        </div>

        <PhoneOtpForm />

        <p className="mt-6 text-center text-xs text-ink-muted">
          Birinchi marta? Avval{" "}
          <Link
            href={`https://t.me/${env.botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-700 hover:underline"
          >
            @{env.botUsername}
          </Link>{" "}
          botga /start bosib telefoningizni ulashing.
        </p>
      </div>
    </main>
  );
}
