import { InvalidTaskLongDescriptionDomainException } from '../exceptions/invalid-task-long-description.domain-exception';

export class TaskLongDescription {
  private constructor(private readonly value: string) {}

  static createOptional(value?: string | null): TaskLongDescription | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    if (normalized.length === 0) {
      return null;
    }

    if (normalized.length > 2000) {
      throw new InvalidTaskLongDescriptionDomainException();
    }

    return new TaskLongDescription(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
