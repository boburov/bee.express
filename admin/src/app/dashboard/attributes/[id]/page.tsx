"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  ATTRIBUTE_TYPE_HAS_VALUES,
  ATTRIBUTE_TYPE_LABELS,
  attributeApi,
  extractApiError,
  type AttributeDetail,
  type AttributeType,
  type AttributeValue,
} from "@/lib/catalog";

export default function AttributeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [data, setData] = useState<AttributeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [valueModal, setValueModal] = useState<{ open: boolean; value: AttributeValue | null }>({
    open: false,
    value: null,
  });

  async function refresh() {
    if (!id) return;
    try {
      setData(await attributeApi.get(id));
      setError(null);
    } catch (err) {
      setError(extractApiError(err));
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) return null;

  async function onDelete() {
    if (!data) return;
    if (!confirm(`"${data.name}" atributi to'liq o'chirilsinmi?`)) return;
    try {
      await attributeApi.remove(data.id);
      router.replace("/dashboard/attributes");
    } catch (err) {
      alert(extractApiError(err));
    }
  }

  async function onValueDelete(v: AttributeValue) {
    if (!data) return;
    if (!confirm(`"${v.value}" qiymatini o'chirilsinmi?`)) return;
    try {
      await attributeApi.removeValue(data.id, v.id);
      refresh();
    } catch (err) {
      alert(extractApiError(err));
    }
  }

  const hasValues = data ? ATTRIBUTE_TYPE_HAS_VALUES[data.type] : false;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/attributes" className="text-sm text-ink-muted hover:text-ink">
            ← Atributlar
          </Link>
          <h1 className="text-2xl font-semibold text-ink mt-1">{data?.name ?? "Yuklanmoqda..."}</h1>
          {data ? (
            <p className="text-sm text-ink-muted mt-1">
              {ATTRIBUTE_TYPE_LABELS[data.type]}
              {data.unit ? ` · ${data.unit}` : ""}
              {data.isFilterable ? " · filterda ko'rinadi" : " · filterda ko'rinmaydi"}
            </p>
          ) : null}
        </div>
        {data ? (
          <Button variant="ghost" onClick={onDelete}>
            O&apos;chirish
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {data && hasValues ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Qiymatlar ({data.values.length})</CardTitle>
              <Button onClick={() => setValueModal({ open: true, value: null })}>
                + Qiymat qo&apos;shish
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {data.values.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Hali qiymat qo&apos;shilmagan. Masalan, &quot;Rang&quot; atributi uchun: qora, oq, qizil.
              </p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {data.values.map((v) => (
                  <li key={v.id} className="py-3 flex items-center gap-3">
                    {v.hexColor ? (
                      <span
                        className="h-5 w-5 rounded-full border border-line"
                        style={{ backgroundColor: v.hexColor }}
                        aria-hidden
                      />
                    ) : null}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink">{v.label ?? v.value}</div>
                      <div className="text-xs text-ink-muted font-mono">{v.value}</div>
                    </div>
                    <span className="text-xs text-ink-muted">tartib: {v.sortOrder}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setValueModal({ open: true, value: v })}
                    >
                      Tahrirlash
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onValueDelete(v)}>
                      O&apos;chirish
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      ) : null}

      {data && !hasValues ? (
        <Card>
          <CardBody>
            <p className="text-sm text-ink-muted">
              {ATTRIBUTE_TYPE_LABELS[data.type]} turidagi atributlarda qiymatlar yo&apos;q —
              sotuvchi mahsulot qo&apos;shishda to&apos;g&apos;ridan-to&apos;g&apos;ri qiymat kiritadi.
            </p>
          </CardBody>
        </Card>
      ) : null}

      {data ? (
        <Card>
          <CardHeader>
            <CardTitle>Biriktirilgan kategoriyalar ({data.categories.length})</CardTitle>
          </CardHeader>
          <CardBody>
            {data.categories.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Bu atribut hali hech qaysi kategoriyaga biriktirilmagan.
                Kategoriya sahifasidan biriktirishingiz mumkin.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.categories.map((c) => (
                  <li key={c.categoryId} className="text-sm">
                    <Link
                      href={`/dashboard/categories/${c.categoryId}`}
                      className="text-ink hover:underline"
                    >
                      {c.category.name}
                    </Link>
                    {c.isRequired ? (
                      <span className="ml-2 inline-flex h-5 items-center rounded-full bg-amber-100 px-2 text-[10px] font-medium text-amber-700">
                        Majburiy
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      ) : null}

      <ValueModal
        attributeId={data?.id}
        state={valueModal}
        onClose={() => setValueModal({ open: false, value: null })}
        onSaved={() => {
          setValueModal({ open: false, value: null });
          refresh();
        }}
      />
    </div>
  );
}

function ValueModal({
  attributeId,
  state,
  onClose,
  onSaved,
}: {
  attributeId?: string;
  state: { open: boolean; value: AttributeValue | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [hexColor, setHexColor] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (state.open) {
      setValue(state.value?.value ?? "");
      setLabel(state.value?.label ?? "");
      setHexColor(state.value?.hexColor ?? "");
      setSortOrder(state.value?.sortOrder ?? 0);
      setErr(null);
    }
  }, [state]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!attributeId) return;
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        value: value.trim(),
        label: label.trim() || undefined,
        hexColor: hexColor.trim() || undefined,
        sortOrder,
      };
      if (state.value) {
        await attributeApi.updateValue(attributeId, state.value.id, {
          ...payload,
          label: payload.label ?? null,
          hexColor: payload.hexColor ?? null,
        });
      } else {
        await attributeApi.addValue(attributeId, payload);
      }
      onSaved();
    } catch (e) {
      setErr(extractApiError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={state.value ? "Qiymatni tahrirlash" : "Yangi qiymat"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={onSubmit} loading={saving} disabled={!value.trim()}>
            Saqlash
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Qiymat"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="qora"
          required
        />
        <Input
          label="Ko'rsatma (label) — ixtiyoriy"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Qora"
        />
        <Input
          label="Hex rang (faqat rang atributi uchun)"
          value={hexColor}
          onChange={(e) => setHexColor(e.target.value)}
          placeholder="#000000"
          hint="#RRGGBB formatda"
        />
        <Input
          label="Tartib"
          value={String(sortOrder)}
          onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          type="number"
          inputMode="numeric"
        />
        {err ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
