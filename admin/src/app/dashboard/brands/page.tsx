"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { brandApi, extractApiError, type Brand } from "@/lib/catalog";

interface EditState {
  open: boolean;
  brand: Brand | null;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({ open: false, brand: null });

  async function refresh() {
    setLoading(true);
    try {
      const data = await brandApi.list();
      setBrands(data);
      setError(null);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onDelete(b: Brand) {
    if (!confirm(`"${b.name}" brendini o'chirilsinmi?`)) return;
    try {
      await brandApi.remove(b.id);
      refresh();
    } catch (err) {
      alert(extractApiError(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Brendlar</h1>
          <p className="text-sm text-ink-muted mt-1">
            Mahsulot brendlari. Sotuvchi mahsulot qo&apos;shganda shu ro&apos;yxatdan tanlaydi.
          </p>
        </div>
        <Button onClick={() => setEdit({ open: true, brand: null })}>+ Yangi brend</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Barcha brendlar {brands ? `(${brands.length})` : ""}</CardTitle>
        </CardHeader>
        <CardBody>
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">
              {error}
            </div>
          ) : null}
          {loading && !brands ? (
            <p className="text-sm text-ink-muted">Yuklanmoqda...</p>
          ) : brands && brands.length === 0 ? (
            <p className="text-sm text-ink-muted">Hali brend qo&apos;shilmagan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted border-b border-line">
                    <th className="py-2 pr-4 font-medium">Logo</th>
                    <th className="py-2 pr-4 font-medium">Nomi</th>
                    <th className="py-2 pr-4 font-medium">Slug</th>
                    <th className="py-2 pr-4 font-medium">Holat</th>
                    <th className="py-2 pr-4 font-medium text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {brands?.map((b) => (
                    <tr key={b.id} className="border-b border-line-soft last:border-0">
                      <td className="py-3 pr-4">
                        {b.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.logoUrl} alt={b.name} className="h-8 w-8 object-contain" />
                        ) : (
                          <span className="inline-block h-8 w-8 rounded bg-surface-2" />
                        )}
                      </td>
                      <td className="py-3 pr-4 font-medium text-ink">{b.name}</td>
                      <td className="py-3 pr-4 text-ink-muted font-mono text-xs">{b.slug}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            b.isActive
                              ? "inline-flex h-6 items-center rounded-full bg-green-100 px-2 text-xs font-medium text-green-700"
                              : "inline-flex h-6 items-center rounded-full bg-zinc-100 px-2 text-xs font-medium text-zinc-600"
                          }
                        >
                          {b.isActive ? "Aktiv" : "Passiv"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEdit({ open: true, brand: b })}
                        >
                          Tahrirlash
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(b)}>
                          O&apos;chirish
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <BrandEditModal
        state={edit}
        onClose={() => setEdit({ open: false, brand: null })}
        onSaved={() => {
          setEdit({ open: false, brand: null });
          refresh();
        }}
      />
    </div>
  );
}

interface BrandEditModalProps {
  state: EditState;
  onClose: () => void;
  onSaved: () => void;
}

function BrandEditModal({ state, onClose, onSaved }: BrandEditModalProps) {
  const isEdit = Boolean(state.brand);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (state.open) {
      setName(state.brand?.name ?? "");
      setSlug(state.brand?.slug ?? "");
      setLogoUrl(state.brand?.logoUrl ?? "");
      setIsActive(state.brand?.isActive ?? true);
      setErr(null);
    }
  }, [state]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        isActive,
      };
      if (state.brand) {
        await brandApi.update(state.brand.id, {
          ...payload,
          logoUrl: payload.logoUrl ?? null,
        });
      } else {
        await brandApi.create(payload);
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
      title={isEdit ? "Brendni tahrirlash" : "Yangi brend"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={onSubmit} loading={saving} disabled={!name.trim()}>
            {isEdit ? "Saqlash" : "Yaratish"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Nomi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Apple"
          required
        />
        <Input
          label="Slug (URL identifikatori)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="apple — bo'sh qoldirsangiz nomdan avtomatik yaratiladi"
          hint="Faqat lotin harf, raqam, defis."
        />
        <Input
          label="Logo URL"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
          type="url"
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Aktiv
        </label>
        {err ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
