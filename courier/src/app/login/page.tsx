"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";
import { COURIER_ROLE_SLUG, hasCourierRole, useAuthStore } from "@/lib/auth-store";
import { env } from "@/lib/env";
import { formatPhone, normalizePhoneInput } from "@/lib/phone";

type Step = "phone" | "code";

const BOT_USERNAME = env.botUsername;

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setMe = useAuthStore((s) => s.setMe);
  const clear = useAuthStore((s) => s.clear);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [ttl, setTtl] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsBot, setNeedsBot] = useState(false);

  useEffect(() => {
    if (hydrated && accessToken) router.replace("/dashboard");
  }, [hydrated, accessToken, router]);

  useEffect(() => {
    if (ttl <= 0) return;
    const id = setInterval(() => setTtl((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [ttl]);

  async function requestOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsBot(false);
    if (phone.length !== 9) {
      setError("To'liq 9 raqamli telefon kiriting (masalan, 993411786).");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/phone/request", { phone });
      setTtl(data.ttlSeconds ?? 120);
      setStep("code");
    } catch (err) {
      const r = err as { response?: { status?: number; data?: { message?: string } } };
      const msg = r.response?.data?.message ?? "Xatolik yuz berdi";
      setError(typeof msg === "string" ? msg : "Xatolik yuz berdi");
      if (r.response?.status === 404 || r.response?.status === 400) {
        setNeedsBot(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError("6 raqamli kodni kiriting.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/phone/verify", { phone, code });
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      });
      const me = await api.get("/auth/me");
      if (!hasCourierRole(me.data)) {
        try {
          await api.post("/auth/logout", { refreshToken: data.refreshToken });
        } catch {
          /* best-effort */
        }
        clear();
        setError(`Bu hisob ${COURIER_ROLE_SLUG} roliga ega emas. Administrator bilan bog'laning.`);
        return;
      }
      setMe(me.data);
      router.replace("/dashboard");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        "Kod noto'g'ri";
      setError(typeof msg === "string" ? msg : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={44} />
          <p className="text-sm text-ink-muted">Kuryer paneli</p>
        </div>

        <Card>
          {step === "phone" ? (
            <>
              <CardHeader>
                <CardTitle>Telefon raqamingiz</CardTitle>
                <CardDescription>
                  +998 prefiksiz, 9 raqamli telefon. Tasdiqlash kodi Telegram bot orqali keladi.
                </CardDescription>
              </CardHeader>
              <CardBody>
                <form className="flex flex-col gap-4" onSubmit={requestOtp}>
                  <Input
                    label="Telefon"
                    name="phone"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    leftSlot={<span className="text-ink-muted text-sm">+998</span>}
                    value={phone}
                    onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                    placeholder="99 341 17 86"
                    hint={phone.length === 9 ? formatPhone(phone) : "Masalan: 993411786"}
                    disabled={loading}
                  />
                  {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 space-y-2">
                      <div>{error}</div>
                      {needsBot ? (
                        <a
                          href={`https://t.me/${BOT_USERNAME}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-ink text-bee-500 text-xs font-semibold hover:bg-ink-soft"
                        >
                          @{BOT_USERNAME} botga o&apos;tish
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  <Button type="submit" loading={loading} size="lg" disabled={phone.length !== 9}>
                    Kod yuborish
                  </Button>
                </form>
              </CardBody>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Kodni kiriting</CardTitle>
                <CardDescription>
                  {formatPhone(phone)} raqamiga bog&apos;langan Telegram chatga 6 raqamli kod
                  yuborildi.
                </CardDescription>
              </CardHeader>
              <CardBody>
                <form className="flex flex-col gap-4" onSubmit={verifyOtp}>
                  <Input
                    label="Tasdiqlash kodi"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D+/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    hint={ttl > 0 ? `Yaroqlilik: ${ttl}s` : "Kod muddati tugadi"}
                    disabled={loading}
                  />
                  {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}
                  <Button type="submit" loading={loading} size="lg" disabled={code.length !== 6}>
                    Kirish
                  </Button>
                  <button
                    type="button"
                    className="text-sm text-ink-muted hover:text-ink"
                    onClick={() => {
                      setStep("phone");
                      setCode("");
                      setError(null);
                    }}
                  >
                    ← Telefonni o&apos;zgartirish
                  </button>
                </form>
              </CardBody>
            </>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Faqat kuryer roli berilgan hisoblar kirishi mumkin. Hisob yo&apos;qmi? Avval{" "}
          <a
            href={`https://t.me/${BOT_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink hover:underline"
          >
            @{BOT_USERNAME}
          </a>{" "}
          botga /start bosib ro&apos;yxatdan o&apos;ting va administratorga murojaat qiling.
        </p>
      </div>
    </main>
  );
}
