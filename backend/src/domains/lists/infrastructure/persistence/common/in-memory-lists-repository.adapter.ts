import { Injectable } from '@nestjs/common';
import { TaskList } from '../../../domain/entities/task-list.entity';
import { ListsRepositoryPort } from '../../../domain/ports/lists-repository.port';
import { ListId } from '../../../domain/value-objects/list-id.value-object';
import { ListName } from '../../../domain/value-objects/list-name.value-object';
import { OwnerUserId } from '../../../domain/value-objects/owner-user-id.value-object';
import { ListsStoreService } from './lists-store.service';

@Injectable()
export class InMemoryListsRepositoryAdapter extends ListsRepositoryPort {
  constructor(private readonly store: ListsStoreService) {
    super();
  }

  async findById(id: ListId): Promise<TaskList | null> {
    return this.store.findById(id);
  }

  async findByOwnerUserId(ownerUserId: OwnerUserId): Promise<TaskList[]> {
    return this.store.findByOwnerUserId(ownerUserId);
  }

  async findByOwnerUserIdAndName(
    ownerUserId: OwnerUserId,
    name: ListName,
  ): Promise<TaskList | null> {
    return this.store.findByOwnerUserIdAndName(ownerUserId, name);
  }

  async save(taskList: TaskList): Promise<void> {
    this.store.save(taskList);
  }

  async update(taskList: TaskList): Promise<void> {
    this.store.update(taskList);
  }

  async deleteById(id: ListId): Promise<void> {
    this.store.deleteById(id);
  }
}
