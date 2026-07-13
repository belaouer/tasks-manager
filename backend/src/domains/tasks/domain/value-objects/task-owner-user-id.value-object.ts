import { InvalidTaskOwnerUserIdDomainException } from '../exceptions/invalid-task-owner-user-id.domain-exception';

export class TaskOwnerUserId {
  private constructor(private readonly value: string) {}

  static create(value: string): TaskOwnerUserId {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new InvalidTaskOwnerUserIdDomainException();
    }

    return new TaskOwnerUserId(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
