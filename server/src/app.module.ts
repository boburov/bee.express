import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AddressesModule } from './addresses/addresses.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CartModule } from './cart/cart.module';
import { CatalogModule } from './catalog/catalog.module';
import { CourierModule } from './courier/courier.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductRequestsModule } from './product-requests/product-requests.module';
import { PublicModule } from './public/public.module';
import { QueueModule } from './queue/queue.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SellerModule } from './seller/seller.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global rate limit: 300 req/min per client IP (real IP via `trust proxy`).
    // Generous for normal browsing; auth/OTP routes tighten this with @Throttle.
    // In-memory store is fine for single-process pm2; switch to the Redis
    // storage provider if the API is ever scaled to multiple instances.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    QueueModule,
    AuthModule,
    CatalogModule,
    AdminModule,
    UploadsModule,
    SellerModule,
    PublicModule,
    ReviewsModule,
    ProductRequestsModule,
    NotificationsModule,
    AddressesModule,
    CartModule,
    OrdersModule,
    CourierModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Rate limiting runs first — throttles floods even on @Public() routes.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global auth — every route is protected unless decorated with @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
