import { Module } from '@nestjs/common';
import { NotificationsModule } from '../../notifications/notifications.module';
import { ModerationApplicationsController } from './courier-applications/moderation-applications.controller';
import { ModerationApplicationsService } from './courier-applications/moderation-applications.service';
import { ModerationProductsController } from './products/moderation-products.controller';
import { ModerationProductsService } from './products/moderation-products.service';
import { ModerationStoresController } from './stores/moderation-stores.controller';
import { ModerationStoresService } from './stores/moderation-stores.service';

@Module({
  imports: [NotificationsModule],
  controllers: [
    ModerationProductsController,
    ModerationStoresController,
    ModerationApplicationsController,
  ],
  providers: [
    ModerationProductsService,
    ModerationStoresService,
    ModerationApplicationsService,
  ],
})
export class ModerationModule {}
