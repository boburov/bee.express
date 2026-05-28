/**
 * Public env vars exposed to the browser. Anything here must be prefixed
 * `NEXT_PUBLIC_` so Next.js inlines it into the client bundle.
 *
 * Missing values are a configuration error, not a default-to-localhost — we
 * fail loudly at module load to surface the issue immediately instead of
 * letting requests silently hit the wrong host.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing env var ${name}. Set it in .env.local (dev) or your deployment platform (prod).`,
    );
  }
  return value;
}

export const env = {
  apiBaseUrl: required("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL),
  botUsername: required(
    "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME",
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
  ),
  appName: "BeeExpress Courier",
} as const;
