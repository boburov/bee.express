import { Controller, Get, Query } from '@nestjs/common';
import { SuperAdminOnly } from '../../auth/decorators/roles.decorator';
import { AdminStatsService } from './admin-stats.service';
import { FinanceQueryDto } from './dto/finance-query.dto';

@Controller('admin')
@SuperAdminOnly()
export class AdminStatsController {
  constructor(private readonly stats: AdminStatsService) {}

  @Get('stats/summary')
  summary() {
    return this.stats.dashboard();
  }

  @Get('finance/summary')
  finance(@Query() query: FinanceQueryDto) {
    return this.stats.finance(query);
  }
}
