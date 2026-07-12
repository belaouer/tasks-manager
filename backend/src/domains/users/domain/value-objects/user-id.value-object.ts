import { InvalidUserIdDomainException } from '../exceptions/invalid-user-id.domain-exception';

export class UserId {
  private constructor(private readonly value: string) {}

  static create(value: string): UserId {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new InvalidUserIdDomainException();
    }

    return new UserId(trimmed);
  }

  getValue(): string {
    return this.value;
  }
}
