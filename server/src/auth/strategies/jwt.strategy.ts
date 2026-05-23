import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Authenticated, JwtPayload } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<Authenticated> {
    if (payload.type === 'super_admin') {
      const sa = await this.prisma.superAdmin.findUnique({ where: { id: payload.sub } });
      if (!sa || !sa.isActive) throw new UnauthorizedException();
      return { id: sa.id, type: 'super_admin' };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user || user.isBlocked) throw new UnauthorizedException();

    return {
      id: user.id,
      type: 'user',
      roleSlug: user.role?.slug ?? null,
    };
  }
}
