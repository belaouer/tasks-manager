export abstract class AuthSessionPort {
  abstract readAccessToken(): string;

  abstract writeAccessToken(token: string): void;

  abstract clear(): void;
}
