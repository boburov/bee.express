import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContractsService } from './contracts.service';
import { DispatchService } from './dispatch.service';

/**
 * Core store↔courier contract domain. Consumed by:
 *   - CourierModule        (request/list/cancel contracts + temp-contract fallback)
 *   - SellerContractsModule (approve/reject/revoke)
 *   - OrdersModule         (DispatchService.onOrderReady on the READY transition)
 *
 * Talks to Prisma directly and never imports OrdersModule, so the orders↔
 * dispatch edge stays acyclic.
 */
@Module({
  imports: [NotificationsModule],
  providers: [ContractsService, DispatchService],
  exports: [ContractsService, DispatchService],
})
export class ContractsModule {}
