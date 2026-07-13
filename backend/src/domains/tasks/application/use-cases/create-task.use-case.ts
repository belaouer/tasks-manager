import { Injectable } from '@nestjs/common';
import { CreateTaskCommand } from '../dto/create-task.command';
import { TaskSummaryDto } from '../dto/task-summary.dto';
import { Task } from '../../domain/entities/task.entity';
import { TasksClockPort } from '../../domain/ports/tasks-clock.port';
import { TasksIdGeneratorPort } from '../../domain/ports/tasks-id-generator.port';
import { TasksRepositoryPort } from '../../domain/ports/tasks-repository.port';
import { TasksRealtimePublisherPort } from '../ports/tasks-realtime-publisher.port';
import { TaskDueDate } from '../../domain/value-objects/task-due-date.value-object';
import { TaskId } from '../../domain/value-objects/task-id.value-object';
import { TaskListId } from '../../domain/value-objects/task-list-id.value-object';
import { TaskLongDescription } from '../../domain/value-objects/task-long-description.value-object';
import { TaskOwnerUserId } from '../../domain/value-objects/task-owner-user-id.value-object';
import { TaskShortDescription } from '../../domain/value-objects/task-short-description.value-object';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    private readonly tasksRepository: TasksRepositoryPort,
    private readonly tasksClock: TasksClockPort,
    private readonly tasksIdGenerator: TasksIdGeneratorPort,
    private readonly tasksRealtimePublisher: TasksRealtimePublisherPort,
  ) {}

  async execute(command: CreateTaskCommand): Promise<TaskSummaryDto> {
    const ownerUserId = TaskOwnerUserId.create(command.ownerUserId);
    const listId = TaskListId.create(command.listId);

    const task = Task.createNew({
      id: TaskId.create(this.tasksIdGenerator.generate()),
      ownerUserId,
      listId,
      shortDescription: TaskShortDescription.create(command.shortDescription),
      longDescription: TaskLongDescription.createOptional(command.longDescription),
      dueDate: TaskDueDate.create(command.dueDate),
      now: this.tasksClock.now(),
    });

    await this.tasksRepository.save(task);

    const summary = new TaskSummaryDto(
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
    );

    await this.tasksRealtimePublisher.publishTaskCreated(summary);

    return summary;
  }
}
