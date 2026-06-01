import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { Authenticated } from '../../auth/types';
import { ContractsService } from '../../contracts/contracts.service';
import { SellerContext } from '../seller-context';
import { RejectContractDto } from './dto/reject-contract.dto';
import { SellerContractsQueryDto } from './dto/seller-contracts-query.dto';

/**
 * Seller manages courier contract requests for their own store. Store ownership
 * is resolved from the JWT via SellerContext — the URL never carries a store id.
 */
@Controller('seller/contracts')
@Roles('seller')
export class SellerContractsController {
  constructor(
    private readonly contracts: ContractsService,
    private readonly ctx: SellerContext,
  ) {}

  @Get()
  async list(
    @Query() query: SellerContractsQueryDto,
    @CurrentUser() actor: Authenticated,
  ) {
    const store = await this.ctx.requireOwnStore(actor.id);
    return this.contracts.listForStore(store.id, query.status);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string, @CurrentUser() actor: Authenticated) {
    const store = await this.ctx.requireOwnStore(actor.id);
    return this.contracts.approve(id, store.id);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectContractDto,
    @CurrentUser() actor: Authenticated,
  ) {
    const store = await this.ctx.requireOwnStore(actor.id);
    return this.contracts.reject(id, store.id, dto.reason);
  }

  @Patch(':id/revoke')
  @HttpCode(HttpStatus.OK)
  async revoke(
    @Param('id') id: string,
    @Body() body: { reason?: string } | undefined,
    @CurrentUser() actor: Authenticated,
  ) {
    const store = await this.ctx.requireOwnStore(actor.id);
    return this.contracts.revokeBySeller(id, store.id, body?.reason);
  }
}
