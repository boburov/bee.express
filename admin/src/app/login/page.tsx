import { Logo } from "@/shared/ui/Logo";
import { SuperAdminLoginForm } from "@/features/auth/super-admin-login/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-warm">
      <div className="absolute inset-0 bg-gradient-soft pointer-events-none" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={48} />
          <p className="text-sm text-ink-muted">Boshqaruv paneli</p>
        </div>

        <SuperAdminLoginForm />

        <p className="mt-6 text-center text-xs text-ink-muted">
          Bu sahifa faqat SuperAdmin uchun. Boshqa rollar phone + Telegram OTP orqali kiradi.
        </p>
      </div>
    </main>
  );
}
