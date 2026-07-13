import { CompleteTaskCommand } from '../dto/complete-task.command';
import { CompleteTaskUseCase } from './complete-task.use-case';
import { TaskAccessDeniedApplicationException } from '../exceptions/task-access-denied.application-exception';
import { TaskNotFoundApplicationException } from '../exceptions/task-not-found.application-exception';
import { Task } from '../../domain/entities/task.entity';
import { TasksClockPort } from '../../domain/ports/tasks-clock.port';
import { TasksRepositoryPort } from '../../domain/ports/tasks-repository.port';
import { TaskDueDate } from '../../domain/value-objects/task-due-date.value-object';
import { TaskId } from '../../domain/value-objects/task-id.value-object';
import { TaskListId } from '../../domain/value-objects/task-list-id.value-object';
import { TaskLongDescription } from '../../domain/value-objects/task-long-description.value-object';
import { TaskOwnerUserId } from '../../domain/value-objects/task-owner-user-id.value-object';
import { TaskShortDescription } from '../../domain/value-objects/task-short-description.value-object';

class InMemoryTasksRepository extends TasksRepositoryPort {
  private readonly tasks = new Map<string, Task>();

  async findById(id: TaskId): Promise<Task | null> {
    return this.tasks.get(id.getValue()) ?? null;
  }

  async findByListIdAndOwnerUserId(
    listId: TaskListId,
    ownerUserId: TaskOwnerUserId,
  ): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) =>
        task.getListId().getValue() === listId.getValue() &&
        task.getOwnerUserId().getValue() === ownerUserId.getValue(),
    );
  }

  async save(task: Task): Promise<void> {
    this.tasks.set(task.getId().getValue(), task);
  }

  async update(task: Task): Promise<void> {
    this.tasks.set(task.getId().getValue(), task);
  }

  async deleteById(id: TaskId): Promise<void> {
    this.tasks.delete(id.getValue());
  }
}

class FixedClock extends TasksClockPort {
  now(): Date {
    return new Date('2026-04-06T00:00:00.000Z');
  }
}

describe('CompleteTaskUseCase', () => {
  it('completes a task owned by the user for the list', async () => {
    const repository = new InMemoryTasksRepository();

    await repository.save(
      Task.createNew({
        id: TaskId.create('task-1'),
        listId: TaskListId.create('list-1'),
        ownerUserId: TaskOwnerUserId.create('owner-1'),
        shortDescription: TaskShortDescription.create('Task 1'),
        longDescription: TaskLongDescription.createOptional('Long 1'),
        dueDate: TaskDueDate.create(new Date('2026-04-10T00:00:00.000Z')),
        now: new Date('2026-04-01T00:00:00.000Z'),
      }),
    );

    const useCase = new CompleteTaskUseCase(repository, new FixedClock());
    const result = await useCase.execute(
      new CompleteTaskCommand('owner-1', 'list-1', 'task-1'),
    );

    expect(result.completed).toBe(true);
    expect(result.completedAt).toEqual(new Date('2026-04-06T00:00:00.000Z'));
  });

  it('fails when task does not exist', async () => {
    const useCase = new CompleteTaskUseCase(
      new InMemoryTasksRepository(),
      new FixedClock(),
    );

    await expect(
      useCase.execute(new CompleteTaskCommand('owner-1', 'list-1', 'unknown')),
    ).rejects.toBeInstanceOf(TaskNotFoundApplicationException);
  });

  it('fails when owner or list does not match task', async () => {
    const repository = new InMemoryTasksRepository();

    await repository.save(
      Task.createNew({
        id: TaskId.create('task-1'),
        listId: TaskListId.create('list-1'),
        ownerUserId: TaskOwnerUserId.create('owner-1'),
        shortDescription: TaskShortDescription.create('Task 1'),
        longDescription: TaskLongDescription.createOptional('Long 1'),
        dueDate: TaskDueDate.create(new Date('2026-04-10T00:00:00.000Z')),
        now: new Date('2026-04-01T00:00:00.000Z'),
      }),
    );

    const useCase = new CompleteTaskUseCase(repository, new FixedClock());

    await expect(
      useCase.execute(new CompleteTaskCommand('owner-2', 'list-1', 'task-1')),
    ).rejects.toBeInstanceOf(TaskAccessDeniedApplicationException);
  });
});
