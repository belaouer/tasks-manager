import { Injectable } from '@nestjs/common';
import { Task } from '../../../domain/entities/task.entity';
import { TasksRepositoryPort } from '../../../domain/ports/tasks-repository.port';
import { TaskId } from '../../../domain/value-objects/task-id.value-object';
import { TaskListId } from '../../../domain/value-objects/task-list-id.value-object';
import { TaskOwnerUserId } from '../../../domain/value-objects/task-owner-user-id.value-object';
import { TasksStoreService } from './tasks-store.service';

@Injectable()
export class InMemoryTasksRepositoryAdapter extends TasksRepositoryPort {
  constructor(private readonly store: TasksStoreService) {
    super();
  }

  async findById(id: TaskId): Promise<Task | null> {
    return this.store.findById(id);
  }

  async findByListIdAndOwnerUserId(
    listId: TaskListId,
    ownerUserId: TaskOwnerUserId,
  ): Promise<Task[]> {
    return this.store.findByListIdAndOwnerUserId(listId, ownerUserId);
  }

  async save(task: Task): Promise<void> {
    this.store.save(task);
  }

  async update(task: Task): Promise<void> {
    this.store.update(task);
  }

  async deleteById(id: TaskId): Promise<void> {
    this.store.deleteById(id);
  }
}
