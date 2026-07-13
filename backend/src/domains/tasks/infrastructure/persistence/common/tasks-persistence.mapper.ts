import { Task } from '../../../domain/entities/task.entity';
import { TaskDueDate } from '../../../domain/value-objects/task-due-date.value-object';
import { TaskId } from '../../../domain/value-objects/task-id.value-object';
import { TaskListId } from '../../../domain/value-objects/task-list-id.value-object';
import { TaskLongDescription } from '../../../domain/value-objects/task-long-description.value-object';
import { TaskOwnerUserId } from '../../../domain/value-objects/task-owner-user-id.value-object';
import { TaskShortDescription } from '../../../domain/value-objects/task-short-description.value-object';
import { TasksPersistenceRecord } from './tasks-persistence.types';

export function toDomainTask(record: TasksPersistenceRecord): Task {
  return Task.rehydrate({
    id: TaskId.create(record.id),
    listId: TaskListId.create(record.listId),
    ownerUserId: TaskOwnerUserId.create(record.ownerUserId),
    shortDescription: TaskShortDescription.create(record.shortDescription),
    longDescription: TaskLongDescription.createOptional(record.longDescription),
    dueDate: TaskDueDate.create(record.dueDate),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt,
  });
}

export function toPersistenceTask(task: Task): TasksPersistenceRecord {
  return {
    id: task.getId().getValue(),
    listId: task.getListId().getValue(),
    ownerUserId: task.getOwnerUserId().getValue(),
    shortDescription: task.getShortDescription().getValue(),
    longDescription: task.getLongDescription()?.getValue() ?? null,
    dueDate: task.getDueDate().getValue(),
    createdAt: task.getCreatedAt(),
    updatedAt: task.getUpdatedAt(),
    completedAt: task.getCompletedAt(),
  };
}
