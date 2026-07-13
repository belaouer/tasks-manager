import { Injectable } from '@nestjs/common';
import { DeleteTaskCommand } from '../dto/delete-task.command';
import { TaskAccessDeniedApplicationException } from '../exceptions/task-access-denied.application-exception';
import { TaskNotFoundApplicationException } from '../exceptions/task-not-found.application-exception';
import { TasksRepositoryPort } from '../../domain/ports/tasks-repository.port';
import { TaskId } from '../../domain/value-objects/task-id.value-object';
import { TaskListId } from '../../domain/value-objects/task-list-id.value-object';
import { TaskOwnerUserId } from '../../domain/value-objects/task-owner-user-id.value-object';

@Injectable()
export class DeleteTaskUseCase {
  constructor(private readonly tasksRepository: TasksRepositoryPort) {}

  async execute(command: DeleteTaskCommand): Promise<void> {
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

    await this.tasksRepository.deleteById(taskId);
  }
}
