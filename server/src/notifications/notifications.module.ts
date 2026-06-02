import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { OrderNotifierService } from './order-notifier.service';

/**
 * Self-contained JWT module for the WS gateway. The AuthModule already
 * registers JwtModule but it's scoped there; we register a second instance
 * with the same secret to avoid leaking AuthService into the gateway.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, OrderNotifierService],
  exports: [NotificationsService, OrderNotifierService],
})
export class NotificationsModule {}
