import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { Authenticated } from '../../auth/types';
import { SellerContext } from '../seller-context';
import { SellerFinanceService } from './seller-finance.service';

@Controller('seller/finance')
@Roles('seller')
export class SellerFinanceController {
  constructor(
    private readonly finance: SellerFinanceService,
    private readonly ctx: SellerContext,
  ) {}

  @Get('summary')
  async summary(@CurrentUser() actor: Authenticated) {
    const store = await this.ctx.requireOwnStore(actor.id);
    return this.finance.summary(store.id);
  }
}
