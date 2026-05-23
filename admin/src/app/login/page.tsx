"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setMe = useAuthStore((s) => s.setMe);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && accessToken) router.replace("/dashboard");
  }, [hydrated, accessToken, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/super-admin/login", { username, password });
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      });
      const me = await api.get("/auth/me");
      setMe(me.data);
      router.replace("/dashboard");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        "Login yoki parol noto'g'ri";
      setError(typeof msg === "string" ? msg : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={40} />
          <p className="text-sm text-ink-muted">Boshqaruv paneli</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SuperAdmin kirish</CardTitle>
            <CardDescription>
              Tizim egasi sifatida login va parol bilan kiring.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              <Input
                label="Login"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="superadmin"
                required
                disabled={loading}
              />
              <Input
                label="Parol"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              <Button type="submit" loading={loading} size="lg">
                Kirish
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Bu sahifa faqat SuperAdmin uchun. Boshqa rollar phone + Telegram OTP orqali kiradi.
        </p>
      </div>
    </main>
  );
}
