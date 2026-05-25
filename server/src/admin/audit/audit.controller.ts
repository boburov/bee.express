import { Controller, Get, Query } from '@nestjs/common';
import { SuperAdminOnly } from '../../auth/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { ListAuditQueryDto } from './dto/list-audit-query.dto';

@Controller('admin/audit')
@SuperAdminOnly()
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query() query: ListAuditQueryDto) {
    return this.audit.list(query);
  }
}
