import { Hammer } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";

interface ComingSoonProps {
  title: string;
  description: string;
  next?: string[];
}

/**
 * Skeleton page shown for nav items whose feature work is still pending.
 * Keeps the layout consistent so the panel walks like the real product.
 */
export function ComingSoon({ title, description, next }: ComingSoonProps) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Hammer className="h-7 w-7" />}
        title="Bu bo'lim ishlab chiqilmoqda"
        description={
          next?.length
            ? "Yetkazilishi rejalashtirilgan ishlar:"
            : "Tez orada to'liq funksiya bilan qaytadi."
        }
        action={
          next?.length ? (
            <ul className="mt-4 text-left text-sm text-ink-soft space-y-1.5 max-w-md mx-auto">
              {next.map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
                  />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          ) : null
        }
      />
    </div>
  );
}
