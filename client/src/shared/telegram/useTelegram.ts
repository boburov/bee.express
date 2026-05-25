"use client";

import { useEffect, useState } from "react";
import { applyTelegramTheme, getWebApp, type TelegramWebApp } from "./telegram";

interface UseTelegramResult {
  webApp: TelegramWebApp | null;
  ready: boolean;
  inTelegram: boolean;
}

/**
 * Hook that resolves the Telegram WebApp instance after mount and wires up
 * theme + viewport. Components can rely on `inTelegram` to branch behavior.
 */
export function useTelegram(): UseTelegramResult {
  const [state, setState] = useState<UseTelegramResult>({
    webApp: null,
    ready: false,
    inTelegram: false,
  });

  useEffect(() => {
    const wa = getWebApp();
    if (!wa) {
      setState({ webApp: null, ready: true, inTelegram: false });
      return;
    }

    try {
      wa.ready();
      wa.expand();
      applyTelegramTheme(wa);
    } catch {
      /* SDK can throw on unsupported platforms; ignore */
    }

    const onTheme = () => applyTelegramTheme(wa);
    wa.onEvent("themeChanged", onTheme);

    setState({ webApp: wa, ready: true, inTelegram: Boolean(wa.initData) });

    return () => {
      try {
        wa.offEvent("themeChanged", onTheme);
      } catch {
        /* ignore */
      }
    };
  }, []);

  return state;
}
