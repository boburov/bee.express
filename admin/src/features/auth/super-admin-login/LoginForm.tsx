"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { api, extractApiError } from "@/shared/auth/api";
import { useAuthStore } from "@/shared/auth/store";

/**
 * SuperAdmin login (username + password). On success, fetches /auth/me and
 * pushes the dashboard. Phone-OTP login lives in seller/courier/client.
 */
export function SuperAdminLoginForm() {
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
      setError(extractApiError(err, "Login yoki parol noto'g'ri"));
    } finally {
      setLoading(false);
    }
  }

  return (
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
            leftSlot={<UserIcon className="h-4 w-4" />}
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
            leftSlot={<Lock className="h-4 w-4" />}
            required
            disabled={loading}
          />
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          ) : null}
          <Button type="submit" loading={loading} size="lg">
            Kirish
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
