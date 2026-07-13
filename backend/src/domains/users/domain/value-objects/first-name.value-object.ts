import { InvalidUserNameDomainException } from '../exceptions/invalid-user-name.domain-exception';

export class FirstName {
  private constructor(private readonly value: string) {}

  static create(value: string): FirstName {
    const normalized = value.trim();

    if (normalized.length < 2 || normalized.length > 100) {
      throw new InvalidUserNameDomainException('firstName');
    }

    return new FirstName(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
