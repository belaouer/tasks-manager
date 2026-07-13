import { ListId } from '../value-objects/list-id.value-object';
import { ListName } from '../value-objects/list-name.value-object';
import { OwnerUserId } from '../value-objects/owner-user-id.value-object';

export class TaskList {
  private constructor(
    private readonly id: ListId,
    private readonly ownerUserId: OwnerUserId,
    private readonly name: ListName,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static createNew(params: {
    id: ListId;
    ownerUserId: OwnerUserId;
    name: ListName;
    now: Date;
  }): TaskList {
    return new TaskList(
      params.id,
      params.ownerUserId,
      params.name,
      params.now,
      params.now,
    );
  }

  static rehydrate(params: {
    id: ListId;
    ownerUserId: OwnerUserId;
    name: ListName;
    createdAt: Date;
    updatedAt: Date;
  }): TaskList {
    return new TaskList(
      params.id,
      params.ownerUserId,
      params.name,
      params.createdAt,
      params.updatedAt,
    );
  }

  rename(name: ListName, now: Date): TaskList {
    return new TaskList(this.id, this.ownerUserId, name, this.createdAt, now);
  }

  getId(): ListId {
    return this.id;
  }

  getOwnerUserId(): OwnerUserId {
    return this.ownerUserId;
  }

  getName(): ListName {
    return this.name;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
