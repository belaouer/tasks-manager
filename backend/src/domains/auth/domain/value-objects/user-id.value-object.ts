export class UserId {
  private constructor(private readonly value: string) {}

  public static create(value: string): UserId {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new Error('User id cannot be empty.');
    }

    return new UserId(normalized);
  }

  public getValue(): string {
    return this.value;
  }
}
