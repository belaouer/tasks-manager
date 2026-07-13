import { InvalidTaskShortDescriptionDomainException } from '../exceptions/invalid-task-short-description.domain-exception';

export class TaskShortDescription {
  private constructor(private readonly value: string) {}

  static create(value: string): TaskShortDescription {
    const normalized = value.trim();

    if (normalized.length < 1 || normalized.length > 160) {
      throw new InvalidTaskShortDescriptionDomainException();
    }

    return new TaskShortDescription(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
