"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Search, ShieldCheck, ShieldOff, UserCheck } from "lucide-react";
import { extractApiError } from "@/shared/auth/api";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input } from "@/shared/ui/Input";
import { Pagination } from "@/shared/ui/Pagination";
import { Select } from "@/shared/ui/Select";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/shared/ui/Table";
import { useDebounce } from "@/shared/lib/useDebounce";
import { formatPhone, userDisplayName, usersApi } from "@/entities/user/api";
import type { AdminUser, AdminUserListResponse } from "@/entities/user/types";
import { AssignRoleModal } from "@/features/users/assign-role/AssignRoleModal";
import { BlockUserModal } from "@/features/users/block-user/BlockUserModal";

interface UsersTableProps {
  /**
   * Fixed role filter. When set, the page is locked to a single audience
   * (customers / sellers / couriers) and the role selector is hidden.
   * Use "_none" for users with no role assigned.
   */
  fixedRoleSlug?: string;
  /** Empty-state copy shown when the filtered list is empty. */
  emptyTitle?: string;
  emptyDescription?: string;
}

const PAGE_SIZE = 20;

/**
 * Reusable users list. Powers /dashboard/customers, /dashboard/sellers,
 * /dashboard/couriers — same component, different `fixedRoleSlug`.
 */
export function UsersTable({
  fixedRoleSlug,
  emptyTitle = "Hozircha foydalanuvchi yo'q",
  emptyDescription = "Yangi foydalanuvchilar ro'yxatdan o'tganda shu yerda paydo bo'ladi.",
}: UsersTableProps) {
  const [data, setData] = useState<AdminUserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 350);
  const [blockedFilter, setBlockedFilter] = useState<"" | "active" | "blocked">("");
  const [page, setPage] = useState(1);

  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.list({
        roleSlug: fixedRoleSlug,
        q: debouncedQ.trim() || undefined,
        isBlocked:
          blockedFilter === "" ? undefined : blockedFilter === "blocked",
        page,
        pageSize: PAGE_SIZE,
      });
      setData(res);
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }, [fixedRoleSlug, debouncedQ, blockedFilter, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, blockedFilter, fixedRoleSlug]);

  const onUserChanged = useCallback((updated: AdminUser) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((u) => (u.id === updated.id ? updated : u)),
          }
        : prev,
    );
  }, []);

  async function onUnblock(u: AdminUser) {
    if (!confirm(`${userDisplayName(u)} blokdan chiqarilsinmi?`)) return;
    try {
      const updated = await usersApi.unblock(u.id);
      onUserChanged(updated);
    } catch (e) {
      alert(extractApiError(e));
    }
  }

  const filtersDirty = useMemo(
    () => Boolean(debouncedQ || blockedFilter),
    [debouncedQ, blockedFilter],
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="p-4 flex flex-wrap items-end gap-3 border-b border-line">
          <div className="flex-1 min-w-[240px]">
            <Input
              placeholder="Ism, familiya, telefon yoki @username"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              leftSlot={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="w-44">
            <Select
              value={blockedFilter}
              onChange={(e) =>
                setBlockedFilter(e.target.value as "" | "active" | "blocked")
              }
            >
              <option value="">Hammasi</option>
              <option value="active">Faqat aktivlar</option>
              <option value="blocked">Faqat bloklanganlar</option>
            </Select>
          </div>
        </div>

        <CardBody className="px-0 pb-0">
          {error ? (
            <div className="m-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading && !data ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && data.items.length === 0 ? (
            <EmptyState
              className="m-6"
              icon={<ShieldOff className="h-6 w-6" />}
              title={filtersDirty ? "Filterga mos foydalanuvchi topilmadi" : emptyTitle}
              description={
                filtersDirty
                  ? "Filterlarni tozalab qaytadan urinib ko'ring."
                  : emptyDescription
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Foydalanuvchi</TH>
                  <TH>Telefon</TH>
                  <TH>Telegram</TH>
                  <TH>Rol</TH>
                  <TH>Holat</TH>
                  <TH>Qo&apos;shilgan</TH>
                  <TH className="text-right">Amallar</TH>
                </TR>
              </THead>
              <TBody>
                {data?.items.map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatarUrl} name={userDisplayName(u)} size={32} />
                        <div className="min-w-0">
                          <div className="font-medium text-ink truncate">
                            {userDisplayName(u)}
                          </div>
                          <div className="text-[11px] text-ink-faint font-mono truncate">
                            {u.id}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD className="font-mono text-xs text-ink-muted">
                      {u.phone ? formatPhone(u.phone) : "—"}
                    </TD>
                    <TD className="text-xs">
                      {u.telegramUsername ? (
                        <span className="text-ink-soft">@{u.telegramUsername}</span>
                      ) : u.telegramId ? (
                        <span className="text-ink-muted font-mono">{u.telegramId}</span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </TD>
                    <TD>
                      {u.role ? (
                        <Badge tone="brand">{u.role.name}</Badge>
                      ) : (
                        <Badge tone="neutral">Rol yo&apos;q</Badge>
                      )}
                    </TD>
                    <TD>
                      {u.isBlocked ? (
                        <Badge tone="danger">Bloklangan</Badge>
                      ) : (
                        <Badge tone="success">Aktiv</Badge>
                      )}
                    </TD>
                    <TD className="text-xs text-ink-muted">
                      {new Date(u.createdAt).toLocaleDateString("uz-UZ")}
                    </TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRoleTarget(u)}
                          leftIcon={<ShieldCheck className="h-4 w-4" />}
                        >
                          Rol
                        </Button>
                        {u.isBlocked ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUnblock(u)}
                            leftIcon={<UserCheck className="h-4 w-4" />}
                          >
                            Tiklash
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBlockTarget(u)}
                            leftIcon={<Ban className="h-4 w-4" />}
                          >
                            Bloklash
                          </Button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>

        {data && data.total > 0 ? (
          <div className="p-3 border-t border-line">
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </Card>

      <BlockUserModal
        user={blockTarget}
        onClose={() => setBlockTarget(null)}
        onDone={(updated) => {
          onUserChanged(updated);
          setBlockTarget(null);
        }}
      />

      <AssignRoleModal
        user={roleTarget}
        onClose={() => setRoleTarget(null)}
        onDone={(updated) => {
          onUserChanged(updated);
          setRoleTarget(null);
        }}
      />
    </div>
  );
}

