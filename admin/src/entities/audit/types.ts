export type ActorType = "USER" | "SUPER_ADMIN" | "SYSTEM";

export interface AuditEntry {
  id: string;
  actorType: ActorType;
  actorId: string | null;
  actor: { type: "user" | "super_admin"; label: string } | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  metadata: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditListResponse {
  items: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListAuditQuery {
  action?: string;
  resource?: string;
  actorType?: ActorType;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
