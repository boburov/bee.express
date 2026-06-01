import { Module } from '@nestjs/common';
import { ContractsModule } from '../contracts/contracts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CourierContractsController } from './courier-contracts.controller';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';
import { CourierStoresService } from './courier-stores.service';
import { CourierOnboardingController } from './onboarding/courier-onboarding.controller';
import { CourierOnboardingService } from './onboarding/courier-onboarding.service';

@Module({
  imports: [NotificationsModule, ContractsModule],
  controllers: [
    CourierController,
    CourierOnboardingController,
    CourierContractsController,
  ],
  providers: [CourierService, CourierOnboardingService, CourierStoresService],
})
export class CourierModule {}
