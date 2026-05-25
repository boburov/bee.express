export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  appName: "BeeExpress Admin",
} as const;
