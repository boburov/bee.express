import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to a set of role slugs. SuperAdmin bypasses this check.
 * Example: @Roles('admin', 'seller')
 */
export const Roles = (...slugs: string[]) => SetMetadata(ROLES_KEY, slugs);

export const SUPER_ADMIN_ONLY_KEY = 'superAdminOnly';
export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_ONLY_KEY, true);
