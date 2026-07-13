import { TaskList } from '../../../domain/entities/task-list.entity';
import { ListId } from '../../../domain/value-objects/list-id.value-object';
import { ListName } from '../../../domain/value-objects/list-name.value-object';
import { OwnerUserId } from '../../../domain/value-objects/owner-user-id.value-object';
import { ListsPersistenceRecord } from './lists-persistence.types';

export function toDomainTaskList(record: ListsPersistenceRecord): TaskList {
  return TaskList.rehydrate({
    id: ListId.create(record.id),
    ownerUserId: OwnerUserId.create(record.ownerUserId),
    name: ListName.create(record.name),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toPersistenceTaskList(taskList: TaskList): ListsPersistenceRecord {
  return {
    id: taskList.getId().getValue(),
    ownerUserId: taskList.getOwnerUserId().getValue(),
    name: taskList.getName().getValue(),
    createdAt: taskList.getCreatedAt(),
    updatedAt: taskList.getUpdatedAt(),
  };
}
