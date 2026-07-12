import { WeakPasswordDomainException } from '../exceptions/weak-password.domain-exception';

export class Password {
  private constructor(private readonly value: string) {}

  public static create(raw: string): Password {
    const hasMinimumLength = raw.length >= 8;
    const hasUppercase = /[A-Z]/.test(raw);
    const hasLowercase = /[a-z]/.test(raw);
    const hasDigit = /\d/.test(raw);

    if (!hasMinimumLength || !hasUppercase || !hasLowercase || !hasDigit) {
      throw new WeakPasswordDomainException();
    }

    return new Password(raw);
  }

  public getValue(): string {
    return this.value;
  }
}
