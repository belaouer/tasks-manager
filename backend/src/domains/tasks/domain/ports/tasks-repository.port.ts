import { Task } from '../entities/task.entity';
import { TaskId } from '../value-objects/task-id.value-object';
import { TaskListId } from '../value-objects/task-list-id.value-object';
import { TaskOwnerUserId } from '../value-objects/task-owner-user-id.value-object';

export abstract class TasksRepositoryPort {
  abstract findById(id: TaskId): Promise<Task | null>;
  abstract findByListIdAndOwnerUserId(
    listId: TaskListId,
    ownerUserId: TaskOwnerUserId,
  ): Promise<Task[]>;
  abstract save(task: Task): Promise<void>;
  abstract update(task: Task): Promise<void>;
  abstract deleteById(id: TaskId): Promise<void>;
}
