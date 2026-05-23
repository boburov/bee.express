"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  ATTRIBUTE_TYPE_LABELS,
  attributeApi,
  categoryApi,
  extractApiError,
  type Attribute,
  type CategoryDetail,
} from "@/lib/catalog";

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [data, setData] = useState<CategoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  async function refresh() {
    if (!id) return;
    try {
      setData(await categoryApi.get(id));
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
    if (!confirm(`"${data.name}" kategoriyasini o'chirilsinmi?`)) return;
    try {
      await categoryApi.remove(data.id);
      router.replace("/dashboard/categories");
    } catch (err) {
      alert(extractApiError(err));
    }
  }

  async function onDetachAttribute(attributeId: string) {
    if (!data) return;
    if (!confirm("Atribut ajratilsinmi?")) return;
    try {
      await categoryApi.detachAttribute(data.id, attributeId);
      refresh();
    } catch (err) {
      alert(extractApiError(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/categories" className="text-sm text-ink-muted hover:text-ink">
            ← Kategoriyalar
          </Link>
          <h1 className="text-2xl font-semibold text-ink mt-1">
            {data?.name ?? "Yuklanmoqda..."}
          </h1>
          {data ? (
            <p className="text-sm text-ink-muted mt-1">
              <span className="font-mono">{data.slug}</span>
              {data.parent ? (
                <>
                  {" · ota: "}
                  <Link href={`/dashboard/categories/${data.parent.id}`} className="hover:text-ink">
                    {data.parent.name}
                  </Link>
                </>
              ) : (
                " · root"
              )}
              {" · "}
              {data._count.products} ta mahsulot
            </p>
          ) : null}
        </div>
        {data ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setEditing(true)}>
              Tahrirlash
            </Button>
            <Button variant="ghost" onClick={onDelete}>
              O&apos;chirish
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {data ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Atributlar ({data.attributes.length})</CardTitle>
              <Button onClick={() => setAttachOpen(true)}>+ Atribut biriktirish</Button>
            </div>
          </CardHeader>
          <CardBody>
            {data.attributes.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Hali atribut biriktirilmagan. Sotuvchi bu kategoriyadagi mahsulot
                qo&apos;shganda quyidagi atributlar ko&apos;rinadi.
              </p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {data.attributes.map((a) => (
                  <li key={a.attributeId} className="py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/attributes/${a.attributeId}`}
                        className="text-sm font-medium text-ink hover:underline"
                      >
                        {a.attribute.name}
                      </Link>
                      <span className="ml-2 text-xs text-ink-muted">
                        {ATTRIBUTE_TYPE_LABELS[a.attribute.type]}
                        {a.attribute.unit ? ` · ${a.attribute.unit}` : ""}
                      </span>
                    </div>
                    {a.isRequired ? (
                      <span className="inline-flex h-6 items-center rounded-full bg-amber-100 px-2 text-xs font-medium text-amber-700">
                        Majburiy
                      </span>
                    ) : null}
                    <Button variant="ghost" size="sm" onClick={() => onDetachAttribute(a.attributeId)}>
                      Ajratish
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      ) : null}

      {data && data.children.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ichki kategoriyalar ({data.children.length})</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {data.children.map((c) => (
                <li key={c.id} className="text-sm">
                  <Link href={`/dashboard/categories/${c.id}`} className="text-ink hover:underline">
                    {c.name}
                  </Link>
                  <span className="ml-2 text-xs text-ink-muted font-mono">{c.slug}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      {data ? (
        <EditCategoryModal
          open={editing}
          data={data}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            refresh();
          }}
        />
      ) : null}

      {data ? (
        <AttachAttributeModal
          open={attachOpen}
          categoryId={data.id}
          alreadyAttached={data.attributes.map((a) => a.attributeId)}
          onClose={() => setAttachOpen(false)}
          onSaved={() => {
            setAttachOpen(false);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function EditCategoryModal({
  open,
  data,
  onClose,
  onSaved,
}: {
  open: boolean;
  data: CategoryDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(data.name);
  const [nameRu, setNameRu] = useState(data.nameRu ?? "");
  const [slug, setSlug] = useState(data.slug);
  const [iconUrl, setIconUrl] = useState(data.iconUrl ?? "");
  const [sortOrder, setSortOrder] = useState(data.sortOrder);
  const [isActive, setIsActive] = useState(data.isActive);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(data.name);
      setNameRu(data.nameRu ?? "");
      setSlug(data.slug);
      setIconUrl(data.iconUrl ?? "");
      setSortOrder(data.sortOrder);
      setIsActive(data.isActive);
      setErr(null);
    }
  }, [open, data]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await categoryApi.update(data.id, {
        name: name.trim(),
        nameRu: nameRu.trim() || null,
        slug: slug.trim() || undefined,
        iconUrl: iconUrl.trim() || null,
        sortOrder,
        isActive,
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
      title="Kategoriyani tahrirlash"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={onSubmit} loading={saving} disabled={!name.trim()}>
            Saqlash
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Nomi (uz)" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Nomi (ru)" value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
        <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <Input
          label="Icon URL"
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          type="url"
        />
        <Input
          label="Tartib"
          value={String(sortOrder)}
          onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          type="number"
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

function AttachAttributeModal({
  open,
  categoryId,
  alreadyAttached,
  onClose,
  onSaved,
}: {
  open: boolean;
  categoryId: string;
  alreadyAttached: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [available, setAvailable] = useState<Attribute[] | null>(null);
  const [attributeId, setAttributeId] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setIsRequired(false);
    setSortOrder(0);
    attributeApi
      .list()
      .then((list) => {
        const filtered = list.filter((a) => !alreadyAttached.includes(a.id));
        setAvailable(filtered);
        setAttributeId(filtered[0]?.id ?? "");
      })
      .catch((e) => setErr(extractApiError(e)));
  }, [open, alreadyAttached]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!attributeId) return;
    setSaving(true);
    setErr(null);
    try {
      await categoryApi.attachAttribute(categoryId, { attributeId, isRequired, sortOrder });
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
      title="Atribut biriktirish"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={onSubmit} loading={saving} disabled={!attributeId}>
            Biriktirish
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {available && available.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Mavjud barcha atributlar allaqachon biriktirilgan. Avval{" "}
            <Link href="/dashboard/attributes" className="text-ink underline">
              yangi atribut
            </Link>{" "}
            qo&apos;shing.
          </p>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-soft">Atribut</span>
            <select
              value={attributeId}
              onChange={(e) => setAttributeId(e.target.value)}
              className="h-11 rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-bee-500 focus:ring-2 focus:ring-bee-200 outline-none"
            >
              {available?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({ATTRIBUTE_TYPE_LABELS[a.type]})
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Majburiy (sotuvchi to&apos;ldirishi shart)
        </label>
        <Input
          label="Tartib"
          value={String(sortOrder)}
          onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          type="number"
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
