import { Injectable } from '@nestjs/common';
import { Task } from '../../../domain/entities/task.entity';
import { TaskId } from '../../../domain/value-objects/task-id.value-object';
import { TaskListId } from '../../../domain/value-objects/task-list-id.value-object';
import { TaskOwnerUserId } from '../../../domain/value-objects/task-owner-user-id.value-object';

@Injectable()
export class TasksStoreService {
  private readonly tasks = new Map<string, Task>();

  findById(id: TaskId): Task | null {
    return this.tasks.get(id.getValue()) ?? null;
  }

  findByListIdAndOwnerUserId(
    listId: TaskListId,
    ownerUserId: TaskOwnerUserId,
  ): Task[] {
    return Array.from(this.tasks.values()).filter(
      (task) =>
        task.getListId().getValue() === listId.getValue() &&
        task.getOwnerUserId().getValue() === ownerUserId.getValue(),
    );
  }

  save(task: Task): void {
    this.tasks.set(task.getId().getValue(), task);
  }

  update(task: Task): void {
    this.tasks.set(task.getId().getValue(), task);
  }

  deleteById(id: TaskId): void {
    this.tasks.delete(id.getValue());
  }
}
