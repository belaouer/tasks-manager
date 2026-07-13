import { InvalidListIdDomainException } from '../exceptions/invalid-list-id.domain-exception';

export class ListId {
  private constructor(private readonly value: string) {}

  static create(value: string): ListId {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new InvalidListIdDomainException();
    }

    return new ListId(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
