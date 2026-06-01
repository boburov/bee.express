import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Authenticated } from '../auth/types';
import { ContractsService } from '../contracts/contracts.service';
import { CourierStoresService } from './courier-stores.service';
import { CourierContractsQueryDto } from './dto/courier-contracts-query.dto';
import { CourierStoresQueryDto } from './dto/courier-stores-query.dto';
import { RequestContractDto } from './dto/request-contract.dto';

/**
 * Courier-side store discovery + contract management. The courier id comes from
 * the JWT — never the URL — so a courier can only see/touch their own contracts.
 */
@Controller('courier')
@Roles('courier')
export class CourierContractsController {
  constructor(
    private readonly contracts: ContractsService,
    private readonly stores: CourierStoresService,
  ) {}

  @Get('stores')
  listStores(
    @Query() query: CourierStoresQueryDto,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.stores.listStores(this.requireCourier(actor), query);
  }

  @Get('contracts')
  listContracts(
    @Query() query: CourierContractsQueryDto,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.contracts.listForCourier(this.requireCourier(actor), query.status);
  }

  @Post('contracts')
  @HttpCode(HttpStatus.CREATED)
  request(@Body() dto: RequestContractDto, @CurrentUser() actor: Authenticated) {
    return this.contracts.requestContract(
      this.requireCourier(actor),
      dto.storeId,
      dto.message,
    );
  }

  @Post('contracts/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string } | undefined,
    @CurrentUser() actor: Authenticated,
  ) {
    return this.contracts.cancelByCourier(
      id,
      this.requireCourier(actor),
      body?.reason,
    );
  }

  private requireCourier(actor: Authenticated): string {
    if (actor.type !== 'user') {
      throw new ForbiddenException('Faqat kuryerlar uchun');
    }
    return actor.id;
  }
}
