import { CreateTaskCommand } from '../dto/create-task.command';
import { TasksRealtimePublisherPort } from '../ports/tasks-realtime-publisher.port';
import { CreateTaskUseCase } from './create-task.use-case';
import { Task } from '../../domain/entities/task.entity';
import { TasksClockPort } from '../../domain/ports/tasks-clock.port';
import { TasksIdGeneratorPort } from '../../domain/ports/tasks-id-generator.port';
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
    return new Date('2026-04-01T00:00:00.000Z');
  }
}

class FixedIdGenerator extends TasksIdGeneratorPort {
  generate(): string {
    return 'task-1';
  }
}

class FakeRealtimePublisher extends TasksRealtimePublisherPort {
  lastCreatedTaskId: string | null = null;

  async publishTaskCreated(task: { id: string }): Promise<void> {
    this.lastCreatedTaskId = task.id;
  }

  async publishTaskUpdated(): Promise<void> {}

  async publishTaskCompleted(): Promise<void> {}

  async publishTaskDeleted(): Promise<void> {}
}

describe('CreateTaskUseCase', () => {
  it('creates a task', async () => {
    const realtimePublisher = new FakeRealtimePublisher();
    const useCase = new CreateTaskUseCase(
      new InMemoryTasksRepository(),
      new FixedClock(),
      new FixedIdGenerator(),
      realtimePublisher,
    );

    const result = await useCase.execute(
      new CreateTaskCommand(
        'owner-1',
        'list-1',
        'Buy milk',
        'Remember lactose free',
        new Date('2026-04-03T10:00:00.000Z'),
      ),
    );

    expect(result.id).toBe('task-1');
    expect(result.ownerUserId).toBe('owner-1');
    expect(result.listId).toBe('list-1');
    expect(result.shortDescription).toBe('Buy milk');
    expect(result.longDescription).toBe('Remember lactose free');
    expect(result.completed).toBe(false);
    expect(result.completedAt).toBeNull();
    expect(realtimePublisher.lastCreatedTaskId).toBe('task-1');
  });

  it('normalizes empty long description as null', async () => {
    const realtimePublisher = new FakeRealtimePublisher();
    const useCase = new CreateTaskUseCase(
      new InMemoryTasksRepository(),
      new FixedClock(),
      new FixedIdGenerator(),
      realtimePublisher,
    );

    const result = await useCase.execute(
      new CreateTaskCommand(
        'owner-1',
        'list-1',
        'Pay bills',
        '   ',
        new Date('2026-04-05T12:00:00.000Z'),
      ),
    );

    expect(result.longDescription).toBeNull();
  });
});
