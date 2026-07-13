import { GetListTasksCommand } from '../dto/get-list-tasks.command';
import { GetListTasksUseCase } from './get-list-tasks.use-case';
import { Task } from '../../domain/entities/task.entity';
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

describe('GetListTasksUseCase', () => {
  it('returns only tasks for the given owner and list', async () => {
    const repository = new InMemoryTasksRepository();

    await repository.save(
      Task.createNew({
        id: TaskId.create('task-1'),
        listId: TaskListId.create('list-1'),
        ownerUserId: TaskOwnerUserId.create('owner-1'),
        shortDescription: TaskShortDescription.create('Task 1'),
        longDescription: TaskLongDescription.createOptional('Long 1'),
        dueDate: TaskDueDate.create(new Date('2026-04-02T00:00:00.000Z')),
        now: new Date('2026-04-01T00:00:00.000Z'),
      }),
    );

    await repository.save(
      Task.createNew({
        id: TaskId.create('task-2'),
        listId: TaskListId.create('list-2'),
        ownerUserId: TaskOwnerUserId.create('owner-1'),
        shortDescription: TaskShortDescription.create('Task 2'),
        longDescription: TaskLongDescription.createOptional('Long 2'),
        dueDate: TaskDueDate.create(new Date('2026-04-03T00:00:00.000Z')),
        now: new Date('2026-04-01T00:00:00.000Z'),
      }),
    );

    await repository.save(
      Task.createNew({
        id: TaskId.create('task-3'),
        listId: TaskListId.create('list-1'),
        ownerUserId: TaskOwnerUserId.create('owner-2'),
        shortDescription: TaskShortDescription.create('Task 3'),
        longDescription: TaskLongDescription.createOptional('Long 3'),
        dueDate: TaskDueDate.create(new Date('2026-04-04T00:00:00.000Z')),
        now: new Date('2026-04-01T00:00:00.000Z'),
      }),
    );

    const useCase = new GetListTasksUseCase(repository);
    const result = await useCase.execute(
      new GetListTasksCommand('owner-1', 'list-1'),
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('task-1');
  });
});
