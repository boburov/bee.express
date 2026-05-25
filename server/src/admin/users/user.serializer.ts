import type { Role, User } from '@prisma/client';

export interface SerializedUser {
  id: string;
  phone: string | null; // null when the user only signed in via Mini App (placeholder negative phone)
  telegramId: string | null;
  telegramUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: { id: string; slug: string; name: string } | null;
  isBlocked: boolean;
  blockedAt: string | null;
  blockReason: string | null;
  createdAt: string;
  updatedAt: string;
}

type UserWithRole = User & { role: Role | null };

export function serializeUser(u: UserWithRole): SerializedUser {
  // Placeholder phones (created by Telegram Mini App login before /start) are negative.
  // Surface them as null so the UI shows "—" instead of garbage digits.
  const phone = u.phone < 0n ? null : u.phone.toString();

  return {
    id: u.id,
    phone,
    telegramId: u.telegramId?.toString() ?? null,
    telegramUsername: u.telegramUsername,
    firstName: u.firstName,
    lastName: u.lastName,
    avatarUrl: u.avatarUrl,
    role: u.role ? { id: u.role.id, slug: u.role.slug, name: u.role.name } : null,
    isBlocked: u.isBlocked,
    blockedAt: u.blockedAt?.toISOString() ?? null,
    blockReason: u.blockReason,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}
