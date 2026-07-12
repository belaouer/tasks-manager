import { InvalidUserNameDomainException } from '../exceptions/invalid-user-name.domain-exception';

export class LastName {
  private constructor(private readonly value: string) {}

  static create(value: string): LastName {
    const normalized = value.trim();

    if (normalized.length < 2 || normalized.length > 100) {
      throw new InvalidUserNameDomainException('lastName');
    }

    return new LastName(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
