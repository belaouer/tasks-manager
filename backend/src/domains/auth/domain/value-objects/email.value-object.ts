import { InvalidEmailFormatDomainException } from '../exceptions/invalid-email-format.domain-exception';

export class Email {
  private constructor(private readonly value: string) {}

  public static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalized)) {
      throw new InvalidEmailFormatDomainException();
    }

    return new Email(normalized);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }
}
