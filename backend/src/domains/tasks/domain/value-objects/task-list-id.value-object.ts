import { InvalidTaskListIdDomainException } from '../exceptions/invalid-task-list-id.domain-exception';

export class TaskListId {
  private constructor(private readonly value: string) {}

  static create(value: string): TaskListId {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new InvalidTaskListIdDomainException();
    }

    return new TaskListId(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
