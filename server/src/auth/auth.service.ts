import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { OtpQueueService } from '../queue/otp-queue.service';
import { MiniAppLoginDto } from './dto/mini-app-login.dto';
import { PhoneRequestDto } from './dto/phone-request.dto';
import { PhoneVerifyDto } from './dto/phone-verify.dto';
import { SuperAdminLoginDto } from './dto/super-admin-login.dto';
import { JwtPayload, SuperAdminJwtPayload, UserJwtPayload } from './types';
import { generateOtpCode, otpExpiresAt } from './utils/otp';
import { InvalidPhoneError, normalizePhone } from './utils/phone';
import {
  InvalidInitDataError,
  initDataFingerprint,
  verifyTelegramInitData,
} from './utils/telegram-init-data';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds for accessToken
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpTtl: number;
  private readonly otpMaxAttempts: number;
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly botToken: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly otpQueue: OtpQueueService,
    config: ConfigService,
  ) {
    this.otpTtl = Number(config.get<string>('OTP_TTL_SECONDS') ?? 120);
    this.otpMaxAttempts = Number(config.get<string>('OTP_MAX_ATTEMPTS') ?? 5);
    this.accessTtlSeconds = parseTtlToSeconds(config.get<string>('JWT_ACCESS_TTL') ?? '15m');
    this.refreshTtlSeconds = parseTtlToSeconds(config.get<string>('JWT_REFRESH_TTL') ?? '30d');

    const access = config.get<string>('JWT_ACCESS_SECRET');
    const refresh = config.get<string>('JWT_REFRESH_SECRET');
    if (!access || !refresh) throw new Error('JWT secrets are not set');
    this.accessSecret = access;
    this.refreshSecret = refresh;
    this.botToken = config.get<string>('TELEGRAM_BOT_TOKEN');
  }

  // ───────────── Phone OTP ─────────────

  async requestPhoneOtp(dto: PhoneRequestDto, ctx: { ip?: string; ua?: string }) {
    const phone = this.parsePhone(dto.phone);

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      // The system requires Telegram link first (user must /start bot and share contact).
      throw new NotFoundException(
        'Bu raqam Telegram bot orqali ulanmagan. Avval botga /start bosib telefonni share qiling.',
      );
    }
    if (!user.telegramId) {
      throw new BadRequestException(
        'Telegram identifikator topilmadi. Botga qaytib /start bosing va telefonni share qiling.',
      );
    }
    if (user.isBlocked) {
      throw new UnauthorizedException('Hisob bloklangan');
    }

    const code = generateOtpCode(6);
    const expiresAt = otpExpiresAt(this.otpTtl);

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        phone,
        code,
        expiresAt,
        ip: ctx.ip ?? null,
        userAgent: ctx.ua ?? null,
      },
    });

    try {
      await this.otpQueue.publish({
        telegramId: user.telegramId,
        phone,
        code,
        ttlSeconds: this.otpTtl,
      });
    } catch (err) {
      this.logger.error(`OTP enqueue failed: ${(err as Error).message}`);
      throw new BadRequestException('OTP yuborib bo\'lmadi. Birozdan keyin qayta urinib ko\'ring.');
    }

    return { ok: true, ttlSeconds: this.otpTtl };
  }

  async verifyPhoneOtp(dto: PhoneVerifyDto, ctx: { ip?: string; ua?: string }): Promise<TokenPair & { userId: string }> {
    const phone = this.parsePhone(dto.phone);

    const otp = await this.prisma.otp.findFirst({
      where: {
        phone,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new UnauthorizedException('Kod muddati tugagan yoki topilmadi');
    if (otp.attempts >= this.otpMaxAttempts) {
      throw new UnauthorizedException('Urinishlar tugadi. Yangi kod so\'rang.');
    }

    if (otp.code !== dto.code) {
      await this.prisma.otp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Kod noto\'g\'ri');
    }

    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { role: true },
    });
    if (!user || user.isBlocked) throw new UnauthorizedException();

    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const tokens = await this.issueUserTokens(user.id, user.role?.slug ?? null, ctx);
    await this.prisma.auditLog.create({
      data: {
        actorType: 'USER',
        actorId: user.id,
        action: 'auth.login.phone',
        ip: ctx.ip ?? null,
        userAgent: ctx.ua ?? null,
      },
    });

    return { ...tokens, userId: user.id };
  }

  // ───────────── Telegram Mini App ─────────────

  /**
   * Sign in via Telegram Mini App initData.
   *
   * Verifies the HMAC-signed initData against TELEGRAM_BOT_TOKEN, then upserts
   * the user by telegramId. Phone may be absent on first contact — in that case
   * the user must still /start the bot to share their phone before they can be
   * routed by phone-based flows. We do NOT block login here on missing phone:
   * the mini-app onboarding screen will prompt for it next.
   */
  async loginViaMiniApp(
    dto: MiniAppLoginDto,
    ctx: { ip?: string; ua?: string },
  ): Promise<TokenPair & { userId: string; needsPhone: boolean }> {
    if (!this.botToken) {
      throw new BadRequestException('Telegram bot is not configured');
    }

    let verified;
    try {
      verified = verifyTelegramInitData(dto.initData, this.botToken);
    } catch (err) {
      if (err instanceof InvalidInitDataError) {
        throw new UnauthorizedException(`Telegram tasdiqlash xato: ${err.message}`);
      }
      throw err;
    }

    const telegramId = BigInt(verified.user.id);
    const existing = await this.prisma.user.findUnique({
      where: { telegramId },
      include: { role: true },
    });

    let user;
    if (existing) {
      if (existing.isBlocked) throw new UnauthorizedException('Hisob bloklangan');
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          telegramUsername: verified.user.username ?? existing.telegramUsername,
          telegramFirst: verified.user.first_name ?? existing.telegramFirst,
          telegramLast: verified.user.last_name ?? existing.telegramLast,
        },
        include: { role: true },
      });
    } else {
      // No phone yet — set a placeholder negative BigInt keyed off telegramId so the
      // UNIQUE constraint on phone holds. The user must complete onboarding by sharing
      // their phone via the bot (which will then update this row by telegramId).
      const placeholderPhone = -BigInt(verified.user.id);
      user = await this.prisma.user.create({
        data: {
          phone: placeholderPhone,
          telegramId,
          telegramUsername: verified.user.username ?? null,
          telegramFirst: verified.user.first_name ?? null,
          telegramLast: verified.user.last_name ?? null,
          telegramLinkedAt: new Date(),
        },
        include: { role: true },
      });
    }

    const tokens = await this.issueUserTokens(user.id, user.role?.slug ?? null, ctx);
    await this.prisma.auditLog.create({
      data: {
        actorType: 'USER',
        actorId: user.id,
        action: 'auth.login.miniapp',
        ip: ctx.ip ?? null,
        userAgent: ctx.ua ?? null,
        metadata: { fingerprint: initDataFingerprint(dto.initData) },
      },
    });

    return {
      ...tokens,
      userId: user.id,
      needsPhone: user.phone < 0n,
    };
  }

  // ───────────── Super Admin ─────────────

  async superAdminLogin(dto: SuperAdminLoginDto, ctx: { ip?: string; ua?: string }): Promise<TokenPair & { superAdminId: string }> {
    const sa = await this.prisma.superAdmin.findUnique({ where: { username: dto.username } });
    if (!sa || !sa.isActive) throw new UnauthorizedException('Login yoki parol noto\'g\'ri');

    const ok = await bcrypt.compare(dto.password, sa.password);
    if (!ok) throw new UnauthorizedException('Login yoki parol noto\'g\'ri');

    await this.prisma.superAdmin.update({
      where: { id: sa.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.issueSuperAdminTokens(sa.id, ctx);
    await this.prisma.auditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: sa.id,
        action: 'auth.login.superadmin',
        ip: ctx.ip ?? null,
        userAgent: ctx.ua ?? null,
      },
    });

    return { ...tokens, superAdminId: sa.id };
  }

  // ───────────── Refresh / Logout ─────────────

  async refresh(refreshToken: string, ctx: { ip?: string; ua?: string }): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Refresh token noto\'g\'ri');
    }

    if (payload.type === 'super_admin') {
      const sess = await this.prisma.superAdminSession.findUnique({ where: { token: refreshToken } });
      if (!sess || sess.revokedAt || sess.expiresAt < new Date()) {
        throw new UnauthorizedException('Sessiya yopilgan');
      }
      await this.prisma.superAdminSession.update({
        where: { id: sess.id },
        data: { revokedAt: new Date() },
      });
      return this.issueSuperAdminTokens(payload.sub, ctx);
    }

    const sess = await this.prisma.session.findUnique({ where: { token: refreshToken } });
    if (!sess || sess.revokedAt || sess.expiresAt < new Date()) {
      throw new UnauthorizedException('Sessiya yopilgan');
    }
    await this.prisma.session.update({
      where: { id: sess.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user || user.isBlocked) throw new UnauthorizedException();

    return this.issueUserTokens(user.id, user.role?.slug ?? null, ctx);
  }

  async logout(refreshToken: string): Promise<void> {
    // Best-effort revoke; we don't 401 if token is unknown.
    await this.prisma.session.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
    await this.prisma.superAdminSession.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  // ───────────── Me ─────────────

  async getCurrentUser(actorId: string, actorType: 'user' | 'super_admin') {
    if (actorType === 'super_admin') {
      const sa = await this.prisma.superAdmin.findUnique({
        where: { id: actorId },
        select: { id: true, username: true, fullName: true, lastLogin: true, createdAt: true },
      });
      return { type: 'super_admin' as const, ...sa };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actorId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException();

    return {
      type: 'user' as const,
      id: user.id,
      phone: user.phone.toString(),
      telegramId: user.telegramId?.toString() ?? null,
      telegramUsername: user.telegramUsername,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role ? { id: user.role.id, slug: user.role.slug, name: user.role.name } : null,
    };
  }

  // ───────────── Helpers ─────────────

  private parsePhone(input: string): bigint {
    try {
      return normalizePhone(input);
    } catch (err) {
      if (err instanceof InvalidPhoneError) {
        throw new BadRequestException('Telefon raqam noto\'g\'ri formatda');
      }
      throw err;
    }
  }

  private async issueUserTokens(
    userId: string,
    roleSlug: string | null,
    ctx: { ip?: string; ua?: string },
  ): Promise<TokenPair> {
    const payload: UserJwtPayload = { sub: userId, type: 'user', roleSlug };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtlSeconds,
    });

    const refreshToken = await this.jwt.signAsync(
      { ...payload, jti: randomBytes(16).toString('hex') },
      { secret: this.refreshSecret, expiresIn: this.refreshTtlSeconds },
    );

    await this.prisma.session.create({
      data: {
        userId,
        token: refreshToken,
        userAgent: ctx.ua ?? null,
        ip: ctx.ip ?? null,
        expiresAt: new Date(Date.now() + this.refreshTtlSeconds * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtlSeconds,
    };
  }

  private async issueSuperAdminTokens(superAdminId: string, ctx: { ip?: string; ua?: string }): Promise<TokenPair> {
    const payload: SuperAdminJwtPayload = { sub: superAdminId, type: 'super_admin' };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtlSeconds,
    });

    const refreshToken = await this.jwt.signAsync(
      { ...payload, jti: randomBytes(16).toString('hex') },
      { secret: this.refreshSecret, expiresIn: this.refreshTtlSeconds },
    );

    await this.prisma.superAdminSession.create({
      data: {
        superAdminId,
        token: refreshToken,
        userAgent: ctx.ua ?? null,
        ip: ctx.ip ?? null,
        expiresAt: new Date(Date.now() + this.refreshTtlSeconds * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtlSeconds,
    };
  }
}

function parseTtlToSeconds(ttl: string): number {
  const m = ttl.match(/^(\d+)\s*([smhd]?)$/i);
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = (m[2] ?? 's').toLowerCase();
  const mul = unit === 'd' ? 86400 : unit === 'h' ? 3600 : unit === 'm' ? 60 : 1;
  return n * mul;
}
