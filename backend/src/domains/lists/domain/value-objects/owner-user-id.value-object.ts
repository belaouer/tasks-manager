import { InvalidOwnerUserIdDomainException } from '../exceptions/invalid-owner-user-id.domain-exception';

export class OwnerUserId {
  private constructor(private readonly value: string) {}

  static create(value: string): OwnerUserId {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new InvalidOwnerUserIdDomainException();
    }

    return new OwnerUserId(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
