import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, SUPER_ADMIN_ONLY_KEY } from '../decorators/roles.decorator';
import { Authenticated } from '../types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const superAdminOnly = this.reflector.getAllAndOverride<boolean>(SUPER_ADMIN_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const allowedRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!superAdminOnly && (!allowedRoles || allowedRoles.length === 0)) {
      return true; // no role restriction
    }

    const req = context.switchToHttp().getRequest<{ user?: Authenticated }>();
    const user = req.user;
    if (!user) throw new ForbiddenException();

    if (superAdminOnly) {
      if (user.type !== 'super_admin') throw new ForbiddenException('Super admin only');
      return true;
    }

    // SuperAdmin bypasses role checks
    if (user.type === 'super_admin') return true;

    if (!user.roleSlug || !allowedRoles!.includes(user.roleSlug)) {
      throw new ForbiddenException(`Required role: ${allowedRoles!.join(', ')}`);
    }
    return true;
  }
}
