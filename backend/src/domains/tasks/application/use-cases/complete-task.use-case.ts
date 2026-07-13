import { Injectable } from '@nestjs/common';
import { CompleteTaskCommand } from '../dto/complete-task.command';
import { TaskSummaryDto } from '../dto/task-summary.dto';
import { TaskAccessDeniedApplicationException } from '../exceptions/task-access-denied.application-exception';
import { TaskNotFoundApplicationException } from '../exceptions/task-not-found.application-exception';
import { TasksClockPort } from '../../domain/ports/tasks-clock.port';
import { TasksRepositoryPort } from '../../domain/ports/tasks-repository.port';
import { TasksRealtimePublisherPort } from '../ports/tasks-realtime-publisher.port';
import { TaskId } from '../../domain/value-objects/task-id.value-object';
import { TaskListId } from '../../domain/value-objects/task-list-id.value-object';
import { TaskOwnerUserId } from '../../domain/value-objects/task-owner-user-id.value-object';

@Injectable()
export class CompleteTaskUseCase {
  constructor(
    private readonly tasksRepository: TasksRepositoryPort,
    private readonly tasksClock: TasksClockPort,
    private readonly tasksRealtimePublisher: TasksRealtimePublisherPort,
  ) {}

  async execute(command: CompleteTaskCommand): Promise<TaskSummaryDto> {
    const ownerUserId = TaskOwnerUserId.create(command.ownerUserId);
    const listId = TaskListId.create(command.listId);
    const taskId = TaskId.create(command.taskId);

    const task = await this.tasksRepository.findById(taskId);
    if (task === null) {
      throw new TaskNotFoundApplicationException();
    }

    if (
      task.getOwnerUserId().getValue() !== ownerUserId.getValue() ||
      task.getListId().getValue() !== listId.getValue()
    ) {
      throw new TaskAccessDeniedApplicationException();
    }

    const updatedTask = task.complete(this.tasksClock.now());
    await this.tasksRepository.update(updatedTask);

    const summary = new TaskSummaryDto(
      updatedTask.getId().getValue(),
      updatedTask.getListId().getValue(),
      updatedTask.getOwnerUserId().getValue(),
      updatedTask.getShortDescription().getValue(),
      updatedTask.getLongDescription()?.getValue() ?? null,
      updatedTask.getDueDate().getValue(),
      updatedTask.getCreatedAt(),
      updatedTask.getUpdatedAt(),
      updatedTask.getCompletedAt(),
      updatedTask.isCompleted(),
    );

    await this.tasksRealtimePublisher.publishTaskCompleted(summary);

    return summary;
  }
}
