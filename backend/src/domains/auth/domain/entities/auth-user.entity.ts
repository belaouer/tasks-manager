import { Email } from '../value-objects/email.value-object';
import { UserId } from '../value-objects/user-id.value-object';

export type RefreshTokenHash = string | null;

export class AuthUser {
  private constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private readonly passwordHash: string,
    private readonly refreshTokenHash: RefreshTokenHash,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  public static registerNew(params: {
    id: UserId;
    email: Email;
    passwordHash: string;
    now: Date;
  }): AuthUser {
    return new AuthUser(
      params.id,
      params.email,
      params.passwordHash,
      null,
      params.now,
      params.now,
    );
  }

  public static rehydrate(params: {
    id: UserId;
    email: Email;
    passwordHash: string;
    refreshTokenHash: RefreshTokenHash;
    createdAt: Date;
    updatedAt: Date;
  }): AuthUser {
    return new AuthUser(
      params.id,
      params.email,
      params.passwordHash,
      params.refreshTokenHash,
      params.createdAt,
      params.updatedAt,
    );
  }

  public withRefreshTokenHash(tokenHash: string, now: Date): AuthUser {
    return new AuthUser(
      this.id,
      this.email,
      this.passwordHash,
      tokenHash,
      this.createdAt,
      now,
    );
  }

  public clearRefreshToken(now: Date): AuthUser {
    return new AuthUser(
      this.id,
      this.email,
      this.passwordHash,
      null,
      this.createdAt,
      now,
    );
  }

  public getId(): UserId {
    return this.id;
  }

  public getEmail(): Email {
    return this.email;
  }

  public getPasswordHash(): string {
    return this.passwordHash;
  }

  public getRefreshTokenHash(): RefreshTokenHash {
    return this.refreshTokenHash;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
