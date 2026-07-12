export class UserEmail {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(private readonly value: string) {}

  static create(value: string): UserEmail {
    const normalized = value.trim().toLowerCase();

    if (!UserEmail.EMAIL_REGEX.test(normalized)) {
      throw new Error('Invalid user email format.');
    }

    return new UserEmail(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
