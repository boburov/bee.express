"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Phone } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { api, extractApiError } from "@/shared/auth/api";
import {
  hasSellerRole,
  SELLER_ROLE_SLUG,
  useAuthStore,
  type Me,
} from "@/shared/auth/store";
import { env } from "@/shared/config/env";
import { formatPhone, normalizePhoneInput } from "@/shared/lib/phone";

type Step = "phone" | "code";

/**
 * Seller login. Phone OTP only — no SuperAdmin/MiniApp path.
 *
 * Role-gating is enforced **before** tokens are persisted: we call
 * `/auth/me` with the freshly-issued access token, check the role, and only
 * commit to the store if `hasSellerRole(me)` is true. This avoids the
 * "tokens flash in localStorage before logout" race the old code had.
 */
export function SellerLoginForm() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setMe = useAuthStore((s) => s.setMe);

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
      const r = err as { response?: { status?: number } };
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

      // Verify role BEFORE persisting tokens to the store.
      // Call /auth/me with a one-shot bearer header — the request interceptor
      // would attach the still-empty store token otherwise.
      const meRes = await api.get<Me>("/auth/me", {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });

      if (!hasSellerRole(meRes.data)) {
        // Revoke the just-issued refresh token; never write tokens to the store.
        try {
          await api.post("/auth/logout", { refreshToken: data.refreshToken });
        } catch {
          /* best-effort */
        }
        setError(
          `Bu hisob "${SELLER_ROLE_SLUG}" roliga ega emas. Administrator bilan bog'laning.`,
        );
        return;
      }

      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      });
      setMe(meRes.data);
      router.replace("/dashboard");
    } catch (err) {
      setError(extractApiError(err, "Kod noto'g'ri"));
    } finally {
      setLoading(false);
    }
  }

  if (step === "code") {
    return (
      <Card>
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
            <Button
              type="submit"
              loading={loading}
              size="lg"
              block
              disabled={code.length !== 6}
            >
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
        <CardTitle>Sotuvchi kirish</CardTitle>
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
          <Button
            type="submit"
            loading={loading}
            size="lg"
            block
            disabled={phone.length !== 9}
          >
            Kod yuborish
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
