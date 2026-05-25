/**
 * Thin wrapper around window.Telegram.WebApp.
 *
 * The script (telegram-web-app.js) is loaded `beforeInteractive` in app/layout.tsx,
 * so by the time any React component reads it, the global is in place — but ONLY
 * when the app is opened from inside a Telegram client. In a regular browser the
 * global is absent and these helpers report isInTelegram=false.
 */

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

export interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramWebAppUser;
    auth_date?: number;
    hash?: string;
    query_id?: string;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton: {
    text: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setText: (text: string) => void;
    setParams: (p: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  onEvent: (ev: string, cb: (...args: unknown[]) => void) => void;
  offEvent: (ev: string, cb: (...args: unknown[]) => void) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

/** True only when the page is currently rendered inside a real Telegram client. */
export function isInTelegram(): boolean {
  const wa = getWebApp();
  return Boolean(wa && wa.initData && wa.initData.length > 0);
}

/** Apply Telegram theme params to CSS custom properties on :root. */
export function applyTelegramTheme(wa: TelegramWebApp): void {
  const root = document.documentElement;
  const t = wa.themeParams;
  const set = (k: string, v?: string) => v && root.style.setProperty(k, v);
  set("--tg-bg", t.bg_color);
  set("--tg-text", t.text_color);
  set("--tg-hint", t.hint_color);
  set("--tg-link", t.link_color);
  set("--tg-button", t.button_color);
  set("--tg-button-text", t.button_text_color);
  set("--tg-secondary-bg", t.secondary_bg_color);
  set("--tg-section-bg", t.section_bg_color);
  root.dataset.tgColorScheme = wa.colorScheme;
}
