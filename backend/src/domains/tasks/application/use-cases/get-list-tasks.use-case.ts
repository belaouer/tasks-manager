import { Injectable } from '@nestjs/common';
import { GetListTasksCommand } from '../dto/get-list-tasks.command';
import { TaskSummaryDto } from '../dto/task-summary.dto';
import { TasksRepositoryPort } from '../../domain/ports/tasks-repository.port';
import { TaskListId } from '../../domain/value-objects/task-list-id.value-object';
import { TaskOwnerUserId } from '../../domain/value-objects/task-owner-user-id.value-object';

@Injectable()
export class GetListTasksUseCase {
  constructor(private readonly tasksRepository: TasksRepositoryPort) {}

  async execute(command: GetListTasksCommand): Promise<TaskSummaryDto[]> {
    const ownerUserId = TaskOwnerUserId.create(command.ownerUserId);
    const listId = TaskListId.create(command.listId);

    const tasks = await this.tasksRepository.findByListIdAndOwnerUserId(
      listId,
      ownerUserId,
    );

    return tasks.map(
      (task) =>
        new TaskSummaryDto(
          task.getId().getValue(),
          task.getListId().getValue(),
          task.getOwnerUserId().getValue(),
          task.getShortDescription().getValue(),
          task.getLongDescription()?.getValue() ?? null,
          task.getDueDate().getValue(),
          task.getCreatedAt(),
          task.getUpdatedAt(),
          task.getCompletedAt(),
          task.isCompleted(),
        ),
    );
  }
}
