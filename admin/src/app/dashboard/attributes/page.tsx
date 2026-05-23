"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  ATTRIBUTE_TYPE_LABELS,
  attributeApi,
  extractApiError,
  type Attribute,
  type AttributeType,
} from "@/lib/catalog";

export default function AttributesPage() {
  const [attrs, setAttrs] = useState<Attribute[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function refresh() {
    try {
      setAttrs(await attributeApi.list());
      setError(null);
    } catch (err) {
      setError(extractApiError(err));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onDelete(a: Attribute) {
    if (!confirm(`"${a.name}" atributini o'chirilsinmi?`)) return;
    try {
      await attributeApi.remove(a.id);
      refresh();
    } catch (err) {
      alert(extractApiError(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Atributlar</h1>
          <p className="text-sm text-ink-muted mt-1">
            Filter va mahsulot xususiyatlari (RAM, rang, o&apos;lcham...). Kategoriyalarga biriktiriladi.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Yangi atribut</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Barcha atributlar {attrs ? `(${attrs.length})` : ""}</CardTitle>
        </CardHeader>
        <CardBody>
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">
              {error}
            </div>
          ) : null}
          {!attrs ? (
            <p className="text-sm text-ink-muted">Yuklanmoqda...</p>
          ) : attrs.length === 0 ? (
            <p className="text-sm text-ink-muted">Hali atribut qo&apos;shilmagan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted border-b border-line">
                    <th className="py-2 pr-4 font-medium">Nomi</th>
                    <th className="py-2 pr-4 font-medium">Turi</th>
                    <th className="py-2 pr-4 font-medium">Birlik</th>
                    <th className="py-2 pr-4 font-medium">Qiymatlar</th>
                    <th className="py-2 pr-4 font-medium">Kategoriyalar</th>
                    <th className="py-2 pr-4 font-medium">Filter</th>
                    <th className="py-2 pr-4 font-medium text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {attrs.map((a) => (
                    <tr key={a.id} className="border-b border-line-soft last:border-0">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-ink">{a.name}</div>
                        <div className="text-xs text-ink-muted font-mono">{a.slug}</div>
                      </td>
                      <td className="py-3 pr-4 text-ink-soft">{ATTRIBUTE_TYPE_LABELS[a.type]}</td>
                      <td className="py-3 pr-4 text-ink-soft">{a.unit ?? "—"}</td>
                      <td className="py-3 pr-4 text-ink-soft">{a._count?.values ?? 0}</td>
                      <td className="py-3 pr-4 text-ink-soft">{a._count?.categories ?? 0}</td>
                      <td className="py-3 pr-4 text-ink-soft">{a.isFilterable ? "Ha" : "Yo'q"}</td>
                      <td className="py-3 pr-4 text-right space-x-2">
                        <Link
                          href={`/dashboard/attributes/${a.id}`}
                          className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-ink hover:bg-surface-2"
                        >
                          Ochish
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(a)}>
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

      <CreateAttributeModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          refresh();
        }}
      />
    </div>
  );
}

function CreateAttributeModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<AttributeType>("SELECT");
  const [unit, setUnit] = useState("");
  const [isFilterable, setIsFilterable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setNameRu("");
      setSlug("");
      setType("SELECT");
      setUnit("");
      setIsFilterable(true);
      setErr(null);
    }
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await attributeApi.create({
        name: name.trim(),
        nameRu: nameRu.trim() || undefined,
        slug: slug.trim() || undefined,
        type,
        unit: unit.trim() || undefined,
        isFilterable,
      });
      onSaved();
    } catch (e) {
      setErr(extractApiError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yangi atribut"
      description="Atribut yaratilgandan keyin uning sahifasiga o'tib qiymatlar (SELECT/MULTI uchun) qo'shasiz."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={onSubmit} loading={saving} disabled={!name.trim()}>
            Yaratish
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Nomi (uz)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="RAM"
          required
        />
        <Input
          label="Nomi (ru) — ixtiyoriy"
          value={nameRu}
          onChange={(e) => setNameRu(e.target.value)}
          placeholder="Оперативная память"
        />
        <Input
          label="Slug — ixtiyoriy"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ram"
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">Turi</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AttributeType)}
            className="h-11 rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-bee-500 focus:ring-2 focus:ring-bee-200 outline-none"
          >
            {(Object.keys(ATTRIBUTE_TYPE_LABELS) as AttributeType[]).map((t) => (
              <option key={t} value={t}>
                {ATTRIBUTE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="O'lchov birligi — ixtiyoriy"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="GB, sm, kg..."
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isFilterable}
            onChange={(e) => setIsFilterable(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Xaridor filtrida ko&apos;rinsin
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
