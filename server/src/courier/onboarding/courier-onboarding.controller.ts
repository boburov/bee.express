import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { Authenticated } from '../../auth/types';
import { CourierOnboardingService } from './courier-onboarding.service';
import { ApplyCourierDto } from './dto/apply-courier.dto';

/**
 * Courier onboarding — the ONE courier-area surface open to users who do not
 * (yet) hold the `courier` role. No @Roles guard: the global JwtAuthGuard still
 * requires a valid token, and RolesGuard waves through routes with no role
 * metadata. A super-admin has no User row, so they're rejected here.
 */
@Controller('courier/onboarding')
export class CourierOnboardingController {
  constructor(private readonly onboarding: CourierOnboardingService) {}

  @Get('me')
  me(@CurrentUser() actor: Authenticated) {
    return this.onboarding.getMine(this.requireUser(actor));
  }

  @Post('apply')
  @HttpCode(HttpStatus.OK)
  apply(@Body() dto: ApplyCourierDto, @CurrentUser() actor: Authenticated) {
    return this.onboarding.apply(this.requireUser(actor), dto);
  }

  private requireUser(actor: Authenticated): string {
    if (actor.type !== 'user') {
      throw new ForbiddenException('Faqat foydalanuvchilar uchun');
    }
    return actor.id;
  }
}
