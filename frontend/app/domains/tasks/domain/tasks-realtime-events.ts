import type { TaskSummary } from './task-summary';

export interface TaskDeletedEvent {
  readonly taskId: string;
  readonly listId: string;
  readonly ownerUserId: string;
}

export interface TasksRealtimeEventHandlers {
  readonly onTaskCreated: (task: TaskSummary) => void;
  readonly onTaskUpdated: (task: TaskSummary) => void;
  readonly onTaskCompleted: (task: TaskSummary) => void;
  readonly onTaskDeleted: (payload: TaskDeletedEvent) => void;
}
