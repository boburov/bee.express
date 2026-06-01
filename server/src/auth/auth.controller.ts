import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { MiniAppLoginDto } from './dto/mini-app-login.dto';
import { PhoneRequestDto } from './dto/phone-request.dto';
import { PhoneVerifyDto } from './dto/phone-verify.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SuperAdminLoginDto } from './dto/super-admin-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Authenticated } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // OTP delivery costs real money + can spam a victim's Telegram — keep it tight.
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Public()
  @Post('phone/request')
  @HttpCode(HttpStatus.OK)
  requestPhoneOtp(@Body() dto: PhoneRequestDto, @Req() req: Request, @Ip() ip: string) {
    return this.auth.requestPhoneOtp(dto, { ip, ua: req.headers['user-agent'] });
  }

  // A few code attempts are legitimate; the per-OTP attempt counter (5) is the
  // real guard, this just caps brute-force velocity per IP.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Public()
  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  verifyPhoneOtp(@Body() dto: PhoneVerifyDto, @Req() req: Request, @Ip() ip: string) {
    return this.auth.verifyPhoneOtp(dto, { ip, ua: req.headers['user-agent'] });
  }

  @Public()
  @Post('telegram/mini-app')
  @HttpCode(HttpStatus.OK)
  miniAppLogin(@Body() dto: MiniAppLoginDto, @Req() req: Request, @Ip() ip: string) {
    return this.auth.loginViaMiniApp(dto, { ip, ua: req.headers['user-agent'] });
  }

  // Throttle password brute-force.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('super-admin/login')
  @HttpCode(HttpStatus.OK)
  superAdminLogin(@Body() dto: SuperAdminLoginDto, @Req() req: Request, @Ip() ip: string) {
    return this.auth.superAdminLogin(dto, { ip, ua: req.headers['user-agent'] });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto, @Req() req: Request, @Ip() ip: string) {
    return this.auth.refresh(dto.refreshToken, { ip, ua: req.headers['user-agent'] });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto) {
    await this.auth.logout(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: Authenticated) {
    return this.auth.getCurrentUser(user.id, user.type);
  }
}
