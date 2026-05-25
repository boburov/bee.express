import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/types';
import { NotificationEvents, NotificationPushPayload } from './types';

/**
 * Realtime notification gateway.
 *
 * Connection: client opens `ws://host/socket.io/?token=<accessToken>` (Socket.IO).
 * On connection we verify the access JWT (same secret as the REST API uses)
 * and join the socket to:
 *   - per-user room        `user:<userId>`     (or `admin:<superAdminId>`)
 *   - per-role room        `role:<slug>`       (for broadcasts to a slug)
 *   - broadcast room       `broadcast`
 *
 * The service emits to the appropriate room; the gateway is purely transport
 * + auth and does not touch Prisma.
 */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  path: '/socket.io',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly accessSecret: string;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new Error('JWT_ACCESS_SECRET is not set');
    this.accessSecret = secret;
  }

  afterInit(): void {
    this.logger.log('Socket.IO gateway ready at /socket.io');
  }

  async handleConnection(client: Socket): Promise<void> {
    const token =
      (client.handshake.auth as { token?: string } | undefined)?.token ??
      (client.handshake.query.token as string | undefined) ??
      this.extractBearer(client.handshake.headers.authorization);

    if (!token) {
      client.emit('error', { message: 'token required' });
      client.disconnect(true);
      return;
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.accessSecret,
      });
    } catch {
      client.emit('error', { message: 'invalid token' });
      client.disconnect(true);
      return;
    }

    // Attach principal to the socket for downstream handlers.
    (client.data as { actorId: string; actorType: string; roleSlug?: string | null }) = {
      actorId: payload.sub,
      actorType: payload.type,
      roleSlug: payload.type === 'user' ? payload.roleSlug : undefined,
    };

    // Per-user room
    if (payload.type === 'super_admin') {
      await client.join(`admin:${payload.sub}`);
      // Super admins also see broadcasts.
      await client.join('broadcast');
    } else {
      await client.join(`user:${payload.sub}`);
      await client.join('broadcast');
      if (payload.roleSlug) await client.join(`role:${payload.roleSlug}`);
    }

    this.logger.debug(
      `WS connected ${payload.type}:${payload.sub} (rooms: ${[...client.rooms].join(',')})`,
    );
  }

  handleDisconnect(client: Socket): void {
    const meta = client.data as { actorType?: string; actorId?: string };
    if (meta?.actorId) {
      this.logger.debug(`WS disconnected ${meta.actorType}:${meta.actorId}`);
    }
  }

  // ─── Server → client emit helpers ───

  pushToUser(userId: string, payload: NotificationPushPayload): boolean {
    const room = `user:${userId}`;
    const ack = this.server.to(room).emit(NotificationEvents.New, payload);
    return ack;
  }

  pushToRole(roleSlug: string, payload: NotificationPushPayload): void {
    this.server.to(`role:${roleSlug}`).emit(NotificationEvents.New, payload);
  }

  pushBroadcast(payload: NotificationPushPayload): void {
    this.server.to('broadcast').emit(NotificationEvents.New, payload);
  }

  emitUnreadCount(userId: string, count: number): void {
    this.server
      .to(`user:${userId}`)
      .emit(NotificationEvents.UnreadCount, { count });
  }

  // ─── Client → server handlers ───

  @SubscribeMessage(NotificationEvents.MarkRead)
  onMarkRead(
    @ConnectedSocket() _client: Socket,
    @MessageBody() _body: { id: string },
  ) {
    // The REST endpoint is the source of truth. This handler exists so the
    // client can also hint via WS for nicer offline buffering later.
    return { ok: true };
  }

  private extractBearer(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const [scheme, token] = authHeader.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : null;
  }
}
