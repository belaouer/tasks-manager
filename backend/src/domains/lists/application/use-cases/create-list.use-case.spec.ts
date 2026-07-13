import { CreateListCommand } from '../dto/create-list.command';
import { ListNameAlreadyExistsApplicationException } from '../exceptions/list-name-already-exists.application-exception';
import { CreateListUseCase } from './create-list.use-case';
import { ListsClockPort } from '../../domain/ports/lists-clock.port';
import { ListsIdGeneratorPort } from '../../domain/ports/lists-id-generator.port';
import { ListsRepositoryPort } from '../../domain/ports/lists-repository.port';
import { TaskList } from '../../domain/entities/task-list.entity';
import { ListId } from '../../domain/value-objects/list-id.value-object';
import { ListName } from '../../domain/value-objects/list-name.value-object';
import { OwnerUserId } from '../../domain/value-objects/owner-user-id.value-object';

class InMemoryListsRepository extends ListsRepositoryPort {
  private readonly lists = new Map<string, TaskList>();

  async findById(id: ListId): Promise<TaskList | null> {
    return this.lists.get(id.getValue()) ?? null;
  }

  async findByOwnerUserId(ownerUserId: OwnerUserId): Promise<TaskList[]> {
    return Array.from(this.lists.values()).filter(
      (taskList) => taskList.getOwnerUserId().getValue() === ownerUserId.getValue(),
    );
  }

  async findByOwnerUserIdAndName(
    ownerUserId: OwnerUserId,
    name: ListName,
  ): Promise<TaskList | null> {
    for (const taskList of this.lists.values()) {
      if (
        taskList.getOwnerUserId().getValue() === ownerUserId.getValue() &&
        taskList.getName().getValue() === name.getValue()
      ) {
        return taskList;
      }
    }

    return null;
  }

  async save(taskList: TaskList): Promise<void> {
    this.lists.set(taskList.getId().getValue(), taskList);
  }

  async update(taskList: TaskList): Promise<void> {
    this.lists.set(taskList.getId().getValue(), taskList);
  }

  async deleteById(id: ListId): Promise<void> {
    this.lists.delete(id.getValue());
  }
}

class FixedClock extends ListsClockPort {
  now(): Date {
    return new Date('2026-03-01T00:00:00.000Z');
  }
}

class FixedIdGenerator extends ListsIdGeneratorPort {
  generate(): string {
    return 'list-1';
  }
}

describe('CreateListUseCase', () => {
  it('creates list when name is unique for owner', async () => {
    const useCase = new CreateListUseCase(
      new InMemoryListsRepository(),
      new FixedClock(),
      new FixedIdGenerator(),
    );

    const result = await useCase.execute(
      new CreateListCommand('owner-1', 'Personal'),
    );

    expect(result.id).toBe('list-1');
    expect(result.ownerUserId).toBe('owner-1');
    expect(result.name).toBe('Personal');
  });

  it('fails when owner already has same name', async () => {
    const repository = new InMemoryListsRepository();

    await repository.save(
      TaskList.createNew({
        id: ListId.create('existing-list'),
        ownerUserId: OwnerUserId.create('owner-1'),
        name: ListName.create('Personal'),
        now: new Date('2026-03-01T00:00:00.000Z'),
      }),
    );

    const useCase = new CreateListUseCase(
      repository,
      new FixedClock(),
      new FixedIdGenerator(),
    );

    await expect(
      useCase.execute(new CreateListCommand('owner-1', 'Personal')),
    ).rejects.toBeInstanceOf(ListNameAlreadyExistsApplicationException);
  });
});
