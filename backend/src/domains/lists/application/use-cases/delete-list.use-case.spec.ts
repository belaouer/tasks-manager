import { DeleteListCommand } from '../dto/delete-list.command';
import { ListAccessDeniedApplicationException } from '../exceptions/list-access-denied.application-exception';
import { ListNotFoundApplicationException } from '../exceptions/list-not-found.application-exception';
import { DeleteListUseCase } from './delete-list.use-case';
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

describe('DeleteListUseCase', () => {
  it('deletes list when owner matches', async () => {
    const repository = new InMemoryListsRepository();

    await repository.save(
      TaskList.createNew({
        id: ListId.create('list-a'),
        ownerUserId: OwnerUserId.create('owner-1'),
        name: ListName.create('Personal'),
        now: new Date('2026-03-01T00:00:00.000Z'),
      }),
    );

    const useCase = new DeleteListUseCase(repository);
    await useCase.execute(new DeleteListCommand('owner-1', 'list-a'));

    const deleted = await repository.findById(ListId.create('list-a'));
    expect(deleted).toBeNull();
  });

  it('fails when list does not exist', async () => {
    const useCase = new DeleteListUseCase(new InMemoryListsRepository());

    await expect(
      useCase.execute(new DeleteListCommand('owner-1', 'missing-list')),
    ).rejects.toBeInstanceOf(ListNotFoundApplicationException);
  });

  it('fails when owner does not match', async () => {
    const repository = new InMemoryListsRepository();

    await repository.save(
      TaskList.createNew({
        id: ListId.create('list-a'),
        ownerUserId: OwnerUserId.create('owner-1'),
        name: ListName.create('Personal'),
        now: new Date('2026-03-01T00:00:00.000Z'),
      }),
    );

    const useCase = new DeleteListUseCase(repository);

    await expect(
      useCase.execute(new DeleteListCommand('owner-2', 'list-a')),
    ).rejects.toBeInstanceOf(ListAccessDeniedApplicationException);
  });
});
