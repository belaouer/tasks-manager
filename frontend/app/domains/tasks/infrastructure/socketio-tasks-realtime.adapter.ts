import { io, type Socket } from 'socket.io-client';
import type { TaskSummary } from '../domain/task-summary';
import type {
  TaskDeletedEvent,
  TasksRealtimeEventHandlers
} from '../domain/tasks-realtime-events';
import { TasksRealtimePort } from '../domain/tasks-realtime.port';

export class SocketIoTasksRealtimeAdapter extends TasksRealtimePort {
  private socket: Socket | null = null;

  connect(accessToken: string): void {
    if (!import.meta.client || this.socket) {
      return;
    }

    const config = useRuntimeConfig();
    this.socket = io(`${config.public.apiBaseUrl}/tasks`, {
      auth: {
        token: `Bearer ${accessToken}`
      },
      withCredentials: true,
      transports: ['websocket']
    });
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket.disconnect();
    this.socket = null;
  }

  joinList(listId: string): void {
    this.socket?.emit('lists:join', { listId });
  }

  leaveList(listId: string): void {
    this.socket?.emit('lists:leave', { listId });
  }

  onEvents(handlers: TasksRealtimeEventHandlers): void {
    if (!this.socket) {
      return;
    }

    this.socket.on('task:created', (task: TaskSummary) => {
      handlers.onTaskCreated(task);
    });
    this.socket.on('task:updated', (task: TaskSummary) => {
      handlers.onTaskUpdated(task);
    });
    this.socket.on('task:completed', (task: TaskSummary) => {
      handlers.onTaskCompleted(task);
    });
    this.socket.on('task:deleted', (payload: TaskDeletedEvent) => {
      handlers.onTaskDeleted(payload);
    });
  }

  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }
}
