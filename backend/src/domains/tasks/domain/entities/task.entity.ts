import { TaskDueDate } from '../value-objects/task-due-date.value-object';
import { TaskId } from '../value-objects/task-id.value-object';
import { TaskListId } from '../value-objects/task-list-id.value-object';
import { TaskLongDescription } from '../value-objects/task-long-description.value-object';
import { TaskOwnerUserId } from '../value-objects/task-owner-user-id.value-object';
import { TaskShortDescription } from '../value-objects/task-short-description.value-object';

export class Task {
  private constructor(
    private readonly id: TaskId,
    private readonly listId: TaskListId,
    private readonly ownerUserId: TaskOwnerUserId,
    private readonly shortDescription: TaskShortDescription,
    private readonly longDescription: TaskLongDescription | null,
    private readonly dueDate: TaskDueDate,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
    private readonly completedAt: Date | null,
  ) {}

  static createNew(params: {
    id: TaskId;
    listId: TaskListId;
    ownerUserId: TaskOwnerUserId;
    shortDescription: TaskShortDescription;
    longDescription: TaskLongDescription | null;
    dueDate: TaskDueDate;
    now: Date;
  }): Task {
    return new Task(
      params.id,
      params.listId,
      params.ownerUserId,
      params.shortDescription,
      params.longDescription,
      params.dueDate,
      params.now,
      params.now,
      null,
    );
  }

  static rehydrate(params: {
    id: TaskId;
    listId: TaskListId;
    ownerUserId: TaskOwnerUserId;
    shortDescription: TaskShortDescription;
    longDescription: TaskLongDescription | null;
    dueDate: TaskDueDate;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
  }): Task {
    return new Task(
      params.id,
      params.listId,
      params.ownerUserId,
      params.shortDescription,
      params.longDescription,
      params.dueDate,
      params.createdAt,
      params.updatedAt,
      params.completedAt,
    );
  }

  complete(now: Date): Task {
    if (this.completedAt !== null) {
      return this;
    }

    return new Task(
      this.id,
      this.listId,
      this.ownerUserId,
      this.shortDescription,
      this.longDescription,
      this.dueDate,
      this.createdAt,
      now,
      now,
    );
  }

  reopen(now: Date): Task {
    if (this.completedAt === null) {
      return this;
    }

    return new Task(
      this.id,
      this.listId,
      this.ownerUserId,
      this.shortDescription,
      this.longDescription,
      this.dueDate,
      this.createdAt,
      now,
      null,
    );
  }

  getId(): TaskId {
    return this.id;
  }

  getListId(): TaskListId {
    return this.listId;
  }

  getOwnerUserId(): TaskOwnerUserId {
    return this.ownerUserId;
  }

  getShortDescription(): TaskShortDescription {
    return this.shortDescription;
  }

  getLongDescription(): TaskLongDescription | null {
    return this.longDescription;
  }

  getDueDate(): TaskDueDate {
    return this.dueDate;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getCompletedAt(): Date | null {
    return this.completedAt;
  }

  isCompleted(): boolean {
    return this.completedAt !== null;
  }
}
