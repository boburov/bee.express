import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { Authenticated } from '../../auth/types';
import { SellerContext } from '../seller-context';
import { SellerStatsService } from './seller-stats.service';

@Controller('seller/stats')
@Roles('seller')
export class SellerStatsController {
  constructor(
    private readonly stats: SellerStatsService,
    private readonly ctx: SellerContext,
  ) {}

  @Get('summary')
  async summary(@CurrentUser() actor: Authenticated) {
    const store = await this.ctx.requireOwnStore(actor.id);
    return this.stats.summary(store.id);
  }
}
