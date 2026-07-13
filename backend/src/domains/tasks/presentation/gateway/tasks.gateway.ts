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
import { UseFilters } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { TasksRealtimeEmitterService } from '../../infrastructure/realtime/tasks-realtime-emitter.service';

interface TasksAccessTokenPayload {
  readonly sub: string;
  readonly email: string;
}

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    user?: TasksAccessTokenPayload;
  };
}

interface ListRoomPayload {
  readonly listId: string;
}

@WebSocketGateway({
  namespace: '/tasks',
  cors: {
    origin: true,
    credentials: true,
  },
})
@UseFilters()
export class TasksGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly realtimeEmitter: TasksRealtimeEmitterService,
  ) {}

  afterInit(server: Server): void {
    this.realtimeEmitter.setServer(server);
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect(true);
      return;
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const jwtIssuer = process.env.JWT_ISSUER;
    const jwtAudience = process.env.JWT_AUDIENCE;

    if (!accessSecret || !jwtIssuer || !jwtAudience) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<TasksAccessTokenPayload>(
        token,
        {
          secret: accessSecret,
          issuer: jwtIssuer,
          audience: jwtAudience,
          algorithms: ['HS256'],
        },
      );

      if (!payload.sub || !payload.email) {
        client.disconnect(true);
        return;
      }

      client.data.user = {
        sub: payload.sub,
        email: payload.email,
      };
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: AuthenticatedSocket): void {
    // Socket.IO handles room cleanup automatically on disconnect.
  }

  @SubscribeMessage('lists:join')
  async joinListRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ListRoomPayload,
  ): Promise<void> {
    if (!client.data.user) {
      client.disconnect(true);
      return;
    }

    const listId = this.normalizeListId(payload?.listId);
    if (!listId) {
      return;
    }

    await client.join(this.realtimeEmitter.getListRoomName(listId));
  }

  @SubscribeMessage('lists:leave')
  async leaveListRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ListRoomPayload,
  ): Promise<void> {
    const listId = this.normalizeListId(payload?.listId);
    if (!listId) {
      return;
    }

    await client.leave(this.realtimeEmitter.getListRoomName(listId));
  }

  private normalizeListId(listId: string | undefined): string | null {
    if (!listId) {
      return null;
    }

    const normalized = listId.trim();
    if (!normalized) {
      return null;
    }

    return normalized;
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      const normalized = authToken.trim();
      if (normalized.startsWith('Bearer ')) {
        return normalized.slice('Bearer '.length).trim();
      }

      return normalized;
    }

    const authHeader = client.handshake.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim();
    }

    return null;
  }
}
