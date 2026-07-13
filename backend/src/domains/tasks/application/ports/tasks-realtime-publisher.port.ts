import { TaskSummaryDto } from '../dto/task-summary.dto';

export abstract class TasksRealtimePublisherPort {
  abstract publishTaskCreated(task: TaskSummaryDto): Promise<void>;
  abstract publishTaskUpdated(task: TaskSummaryDto): Promise<void>;
  abstract publishTaskCompleted(task: TaskSummaryDto): Promise<void>;
  abstract publishTaskDeleted(payload: {
    readonly taskId: string;
    readonly listId: string;
    readonly ownerUserId: string;
  }): Promise<void>;
}
