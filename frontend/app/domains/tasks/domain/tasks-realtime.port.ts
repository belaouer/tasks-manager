import type { TasksRealtimeEventHandlers } from './tasks-realtime-events';
import type { TasksRealtimeLifecycleHandlers } from './tasks-realtime-lifecycle';

export abstract class TasksRealtimePort {
  abstract connect(accessToken: string): void;

  abstract disconnect(): void;

  abstract joinList(listId: string): void;

  abstract leaveList(listId: string): void;

  abstract onEvents(handlers: TasksRealtimeEventHandlers): void;

  abstract onLifecycle(handlers: TasksRealtimeLifecycleHandlers): void;

  abstract removeAllListeners(): void;
}
