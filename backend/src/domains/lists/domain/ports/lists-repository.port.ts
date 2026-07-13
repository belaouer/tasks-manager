import { TaskList } from '../entities/task-list.entity';
import { ListId } from '../value-objects/list-id.value-object';
import { ListName } from '../value-objects/list-name.value-object';
import { OwnerUserId } from '../value-objects/owner-user-id.value-object';

export abstract class ListsRepositoryPort {
  abstract findById(id: ListId): Promise<TaskList | null>;
  abstract findByOwnerUserId(ownerUserId: OwnerUserId): Promise<TaskList[]>;
  abstract findByOwnerUserIdAndName(
    ownerUserId: OwnerUserId,
    name: ListName,
  ): Promise<TaskList | null>;
  abstract save(taskList: TaskList): Promise<void>;
  abstract update(taskList: TaskList): Promise<void>;
  abstract deleteById(id: ListId): Promise<void>;
}
