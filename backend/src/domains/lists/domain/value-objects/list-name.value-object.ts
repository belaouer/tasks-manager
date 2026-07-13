import { InvalidListNameDomainException } from '../exceptions/invalid-list-name.domain-exception';

export class ListName {
  private constructor(private readonly value: string) {}

  static create(value: string): ListName {
    const normalized = value.trim();

    if (normalized.length < 1 || normalized.length > 120) {
      throw new InvalidListNameDomainException();
    }

    return new ListName(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
