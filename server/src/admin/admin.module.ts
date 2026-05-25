import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

/**
 * Aggregates SuperAdmin-only management modules. Each child module guards its
 * routes with @SuperAdminOnly() and uses PrismaService directly.
 */
@Module({
  imports: [UsersModule, AuditModule, RolesModule],
})
export class AdminModule {}
