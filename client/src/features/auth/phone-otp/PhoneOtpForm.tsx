"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Spinner } from "@/shared/ui/Spinner";
import { api, extractApiError } from "@/shared/auth/api";
import { useAuthStore } from "@/shared/auth/store";
import { env } from "@/shared/config/env";
import { formatPhone, normalizePhoneInput } from "@/shared/lib/phone";
import { useTelegram } from "@/shared/telegram/useTelegram";

type Step = "phone" | "code";

/**
 * Customer login. Two paths:
 *   1) Mini App: when window.Telegram.WebApp.initData is present, exchange it
 *      for tokens automatically (POST /auth/telegram/mini-app).
 *   2) OTP fallback: phone → code (POST /auth/phone/request, /auth/phone/verify).
 */
export function PhoneOtpForm() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setMe = useAuthStore((s) => s.setMe);

  const { webApp, ready: tgReady, inTelegram } = useTelegram();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [ttl, setTtl] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsBot, setNeedsBot] = useState(false);
  const [miniAppAttempted, setMiniAppAttempted] = useState(false);
  const miniAppAttempting = useRef(false);

  useEffect(() => {
    if (hydrated && accessToken) router.replace("/home");
  }, [hydrated, accessToken, router]);

  // Auto-login via Mini App initData
  useEffect(() => {
    if (!hydrated || !tgReady || accessToken || !inTelegram || miniAppAttempting.current) return;
    if (!webApp?.initData) return;
    miniAppAttempting.current = true;
    setLoading(true);
    (async () => {
      try {
        const { data } = await api.post("/auth/telegram/mini-app", {
          initData: webApp.initData,
        });
        setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
        });
        try {
          const me = await api.get("/auth/me");
          setMe(me.data);
        } catch {
          /* non-fatal; shell will fetch /me */
        }
        router.replace("/home");
      } catch (err) {
        setError(extractApiError(err, "Telegram orqali kirib bo'lmadi"));
        setMiniAppAttempted(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [hydrated, tgReady, inTelegram, webApp, accessToken, router, setTokens, setMe]);

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
      setError(extractApiError(err));
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
      setMe(me.data);
      router.replace("/home");
    } catch (err) {
      setError(extractApiError(err, "Kod noto'g'ri"));
    } finally {
      setLoading(false);
    }
  }

  const showMiniAppSpinner = inTelegram && !miniAppAttempted && !accessToken;

  if (showMiniAppSpinner) {
    return (
      <Card>
        <CardBody>
          <div className="flex flex-col items-center gap-3 py-8">
            <Spinner size="md" />
            <p className="text-sm text-ink-muted">Telegram orqali kirilmoqda...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (step === "code") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kodni kiriting</CardTitle>
          <CardDescription>
            {formatPhone(phone)} raqamiga bog&apos;langan Telegram chatga 6 raqamli kod yuborildi.
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
              onChange={(e) => setCode(e.target.value.replace(/\D+/g, "").slice(0, 6))}
              placeholder="000000"
              leftSlot={<KeyRound className="h-4 w-4" />}
              hint={ttl > 0 ? `Yaroqlilik: ${ttl}s` : "Kod muddati tugadi"}
              disabled={loading}
            />
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            ) : null}
            <Button type="submit" loading={loading} size="lg" block disabled={code.length !== 6}>
              Kirish
            </Button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 text-sm text-ink-muted hover:text-ink"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Telefonni o&apos;zgartirish
            </button>
          </form>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
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
            leftSlot={
              <span className="inline-flex items-center gap-1.5 text-sm">
                <Phone className="h-4 w-4" />
                <span>+998</span>
              </span>
            }
            value={phone}
            onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
            placeholder="99 341 17 86"
            hint={phone.length === 9 ? formatPhone(phone) : "Masalan: 993411786"}
            disabled={loading}
          />
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger space-y-2">
              <div>{error}</div>
              {needsBot ? (
                <a
                  href={`https://t.me/${env.botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-ink text-white text-xs font-semibold hover:bg-ink-soft"
                >
                  @{env.botUsername} botga o&apos;tish
                </a>
              ) : null}
            </div>
          ) : null}
          <Button type="submit" loading={loading} size="lg" block disabled={phone.length !== 9}>
            Kod yuborish
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
