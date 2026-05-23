"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  categoryApi,
  extractApiError,
  type Category,
  type CategoryNode,
} from "@/lib/catalog";

export default function CategoriesPage() {
  const [tree, setTree] = useState<CategoryNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [create, setCreate] = useState<{ open: boolean; parent: Category | null }>({
    open: false,
    parent: null,
  });

  async function refresh() {
    try {
      setTree(await categoryApi.tree());
      setError(null);
    } catch (err) {
      setError(extractApiError(err));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onDelete(c: CategoryNode) {
    if (!confirm(`"${c.name}" kategoriyasini o'chirilsinmi?`)) return;
    try {
      await categoryApi.remove(c.id);
      refresh();
    } catch (err) {
      alert(extractApiError(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Kategoriyalar</h1>
          <p className="text-sm text-ink-muted mt-1">
            Mahsulot kategoriyalarining daraxti. Har kategoriyaga atributlar biriktirish mumkin.
          </p>
        </div>
        <Button onClick={() => setCreate({ open: true, parent: null })}>+ Root kategoriya</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daraxt</CardTitle>
        </CardHeader>
        <CardBody>
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">
              {error}
            </div>
          ) : null}
          {!tree ? (
            <p className="text-sm text-ink-muted">Yuklanmoqda...</p>
          ) : tree.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Hali kategoriya yo&apos;q. Birinchi root kategoriyani qo&apos;shing.
            </p>
          ) : (
            <ul className="space-y-1">
              {tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  onAddChild={(parent) => setCreate({ open: true, parent })}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <CreateCategoryModal
        state={create}
        onClose={() => setCreate({ open: false, parent: null })}
        onSaved={() => {
          setCreate({ open: false, parent: null });
          refresh();
        }}
      />
    </div>
  );
}

function TreeNode({
  node,
  depth,
  onAddChild,
  onDelete,
}: {
  node: CategoryNode;
  depth: number;
  onAddChild: (parent: Category) => void;
  onDelete: (node: CategoryNode) => void;
}) {
  return (
    <li>
      <div
        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2 group"
        style={{ paddingLeft: 8 + depth * 20 }}
      >
        <span className="text-ink-faint text-xs w-4">
          {node.children.length > 0 ? "▾" : "•"}
        </span>
        {node.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.iconUrl} alt="" className="h-5 w-5 object-contain" />
        ) : null}
        <div className="flex-1 min-w-0">
          <Link
            href={`/dashboard/categories/${node.id}`}
            className="text-sm font-medium text-ink hover:underline"
          >
            {node.name}
          </Link>
          <span className="ml-2 text-xs text-ink-muted font-mono">{node.slug}</span>
          {!node.isActive ? (
            <span className="ml-2 inline-flex h-5 items-center rounded-full bg-zinc-100 px-2 text-[10px] font-medium text-zinc-600">
              passiv
            </span>
          ) : null}
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => onAddChild(node)}>
            + Ichki
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(node)}>
            O&apos;chirish
          </Button>
        </div>
      </div>
      {node.children.length > 0 ? (
        <ul className="space-y-1">
          {node.children.map((c) => (
            <TreeNode
              key={c.id}
              node={c}
              depth={depth + 1}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function CreateCategoryModal({
  state,
  onClose,
  onSaved,
}: {
  state: { open: boolean; parent: Category | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [slug, setSlug] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (state.open) {
      setName("");
      setNameRu("");
      setSlug("");
      setIconUrl("");
      setSortOrder(0);
      setIsActive(true);
      setErr(null);
    }
  }, [state]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await categoryApi.create({
        name: name.trim(),
        nameRu: nameRu.trim() || undefined,
        slug: slug.trim() || undefined,
        parentId: state.parent?.id,
        iconUrl: iconUrl.trim() || undefined,
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
      open={state.open}
      onClose={onClose}
      title={state.parent ? `"${state.parent.name}" ichida yangi` : "Yangi root kategoriya"}
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
          placeholder="Telefonlar"
          required
        />
        <Input
          label="Nomi (ru)"
          value={nameRu}
          onChange={(e) => setNameRu(e.target.value)}
          placeholder="Телефоны"
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="telefonlar"
        />
        <Input
          label="Icon URL"
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          placeholder="https://..."
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
