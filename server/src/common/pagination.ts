/**
 * Shared pagination envelope.
 *
 *   GET /api/foo?page=2&limit=20
 *
 * Service callers do `const { skip, take, page, limit } = parsePagination(dto)`
 * to drive Prisma, then wrap the result with `paginated(items, total, page, limit)`.
 *
 * The shape — `{ data, meta: { page, limit, total, totalPages } }` — is the one
 * documented in the User Panel / Food Module checklist (docs/cart-orders-v1.md
 * for the first consumers).
 */

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(input: PaginationInput): {
  page: number;
  limit: number;
  skip: number;
  take: number;
} {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const rawLimit = Math.floor(input.limit ?? DEFAULT_LIMIT);
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}
