import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

@Injectable()
export class TasksRealtimeEmitterService {
  private server: Server | null = null;

  setServer(server: Server): void {
    this.server = server;
  }

  emitToList(listId: string, event: string, payload: unknown): void {
    if (!this.server) {
      return;
    }

    this.server.to(this.getListRoomName(listId)).emit(event, payload);
  }

  getListRoomName(listId: string): string {
    return `list:${listId}`;
  }
}
