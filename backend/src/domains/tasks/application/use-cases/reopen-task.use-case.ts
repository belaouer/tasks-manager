import { Injectable } from '@nestjs/common';
import { ReopenTaskCommand } from '../dto/reopen-task.command';
import { TaskSummaryDto } from '../dto/task-summary.dto';
import { TaskAccessDeniedApplicationException } from '../exceptions/task-access-denied.application-exception';
import { TaskNotFoundApplicationException } from '../exceptions/task-not-found.application-exception';
import { TasksClockPort } from '../../domain/ports/tasks-clock.port';
import { TasksRepositoryPort } from '../../domain/ports/tasks-repository.port';
import { TaskId } from '../../domain/value-objects/task-id.value-object';
import { TaskListId } from '../../domain/value-objects/task-list-id.value-object';
import { TaskOwnerUserId } from '../../domain/value-objects/task-owner-user-id.value-object';

@Injectable()
export class ReopenTaskUseCase {
  constructor(
    private readonly tasksRepository: TasksRepositoryPort,
    private readonly tasksClock: TasksClockPort,
  ) {}

  async execute(command: ReopenTaskCommand): Promise<TaskSummaryDto> {
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

    const updatedTask = task.reopen(this.tasksClock.now());
    await this.tasksRepository.update(updatedTask);

    return new TaskSummaryDto(
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
  }
}
