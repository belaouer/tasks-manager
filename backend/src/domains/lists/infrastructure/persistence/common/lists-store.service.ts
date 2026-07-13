import { Injectable } from '@nestjs/common';
import { TaskList } from '../../../domain/entities/task-list.entity';
import { ListId } from '../../../domain/value-objects/list-id.value-object';
import { ListName } from '../../../domain/value-objects/list-name.value-object';
import { OwnerUserId } from '../../../domain/value-objects/owner-user-id.value-object';

@Injectable()
export class ListsStoreService {
  private readonly lists = new Map<string, TaskList>();

  findById(id: ListId): TaskList | null {
    return this.lists.get(id.getValue()) ?? null;
  }

  findByOwnerUserId(ownerUserId: OwnerUserId): TaskList[] {
    return Array.from(this.lists.values()).filter(
      (taskList) =>
        taskList.getOwnerUserId().getValue() === ownerUserId.getValue(),
    );
  }

  findByOwnerUserIdAndName(
    ownerUserId: OwnerUserId,
    name: ListName,
  ): TaskList | null {
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

  save(taskList: TaskList): void {
    this.lists.set(taskList.getId().getValue(), taskList);
  }

  update(taskList: TaskList): void {
    this.lists.set(taskList.getId().getValue(), taskList);
  }

  deleteById(id: ListId): void {
    this.lists.delete(id.getValue());
  }
}
