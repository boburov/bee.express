import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { ModerationModule } from './moderation/moderation.module';
import { AdminOrdersModule } from './orders/admin-orders.module';
import { RolesModule } from './roles/roles.module';
import { AdminStatsModule } from './stats/admin-stats.module';
import { UsersModule } from './users/users.module';

/**
 * Aggregates SuperAdmin-only management modules. Each child module guards its
 * routes with @SuperAdminOnly() and uses PrismaService directly.
 */
@Module({
  imports: [
    UsersModule,
    AuditModule,
    RolesModule,
    ModerationModule,
    AdminOrdersModule,
    AdminStatsModule,
  ],
})
export class AdminModule {}
