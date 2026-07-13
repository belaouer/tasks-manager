import { InvalidTaskIdDomainException } from '../exceptions/invalid-task-id.domain-exception';

export class TaskId {
  private constructor(private readonly value: string) {}

  static create(value: string): TaskId {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new InvalidTaskIdDomainException();
    }

    return new TaskId(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
