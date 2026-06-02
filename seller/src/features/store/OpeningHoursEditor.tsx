"use client";

import type { OpeningDay, OpeningHours } from "./types";

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: "mon", label: "Dushanba" },
  { key: "tue", label: "Seshanba" },
  { key: "wed", label: "Chorshanba" },
  { key: "thu", label: "Payshanba" },
  { key: "fri", label: "Juma" },
  { key: "sat", label: "Shanba" },
  { key: "sun", label: "Yakshanba" },
];

const DEFAULT_DAY: OpeningDay = { open: "09:00", close: "22:00" };

/**
 * Weekly opening-hours editor → builds the `openingHours` JSON the server
 * consults via isStoreOpenNow(). A day toggled off is omitted (closed). With
 * no days set, the store is treated as always open (only manual Ochiq/Yopiq).
 */
export function OpeningHoursEditor({
  value,
  onChange,
}: {
  value: OpeningHours;
  onChange: (v: OpeningHours) => void;
}) {
  function toggle(key: keyof OpeningHours, on: boolean) {
    const next: OpeningHours = { ...value };
    if (on) next[key] = value[key] ?? { ...DEFAULT_DAY };
    else delete next[key];
    onChange(next);
  }

  function setTime(key: keyof OpeningHours, field: "open" | "close", t: string) {
    const day = value[key] ?? { ...DEFAULT_DAY };
    onChange({ ...value, [key]: { ...day, [field]: t } });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {DAYS.map(({ key, label }) => {
        const day = value[key];
        const isOpen = Boolean(day);
        return (
          <div key={key} className="flex items-center gap-3">
            <label className="flex w-32 shrink-0 items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={(e) => toggle(key, e.target.checked)}
                className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-200"
              />
              {label}
            </label>
            {isOpen && day ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => setTime(key, "open", e.target.value)}
                  className="h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
                <span className="text-ink-muted">—</span>
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) => setTime(key, "close", e.target.value)}
                  className="h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            ) : (
              <span className="text-xs text-ink-faint">Yopiq</span>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-ink-faint">
        Hech bir kun belgilanmasa — do&apos;kon doim ochiq hisoblanadi (faqat qo&apos;lda Ochiq/Yopiq amal qiladi).
        Ish vaqtidan tashqarida buyurtma qabul qilinmaydi va do&apos;kon ro&apos;yxatda ko&apos;rinmaydi.
      </p>
    </div>
  );
}
