import { Injectable } from '@nestjs/common';
import { TaskSummaryDto } from '../../application/dto/task-summary.dto';
import { TasksRealtimePublisherPort } from '../../application/ports/tasks-realtime-publisher.port';
import { TasksRealtimeEmitterService } from './tasks-realtime-emitter.service';

@Injectable()
export class SocketIoTasksRealtimePublisherAdapter extends TasksRealtimePublisherPort {
  constructor(private readonly realtimeEmitter: TasksRealtimeEmitterService) {
    super();
  }

  async publishTaskCreated(task: TaskSummaryDto): Promise<void> {
    this.realtimeEmitter.emitToList(task.listId, 'task:created', task);
  }

  async publishTaskUpdated(task: TaskSummaryDto): Promise<void> {
    this.realtimeEmitter.emitToList(task.listId, 'task:updated', task);
  }

  async publishTaskCompleted(task: TaskSummaryDto): Promise<void> {
    this.realtimeEmitter.emitToList(task.listId, 'task:completed', task);
  }

  async publishTaskDeleted(payload: {
    readonly taskId: string;
    readonly listId: string;
    readonly ownerUserId: string;
  }): Promise<void> {
    this.realtimeEmitter.emitToList(payload.listId, 'task:deleted', payload);
  }
}
