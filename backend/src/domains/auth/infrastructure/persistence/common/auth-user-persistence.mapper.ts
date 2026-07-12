import { AuthUser } from '../../../domain/entities/auth-user.entity';
import { Email } from '../../../domain/value-objects/email.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';

export type AuthUserPersistenceRecord = {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly refreshTokenHash: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export function toDomainAuthUser(record: AuthUserPersistenceRecord): AuthUser {
  return AuthUser.rehydrate({
    id: UserId.create(record.id),
    email: Email.create(record.email),
    passwordHash: record.passwordHash,
    refreshTokenHash: record.refreshTokenHash,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toPersistenceAuthUser(user: AuthUser): AuthUserPersistenceRecord {
  return {
    id: user.getId().getValue(),
    email: user.getEmail().getValue(),
    passwordHash: user.getPasswordHash(),
    refreshTokenHash: user.getRefreshTokenHash(),
    createdAt: user.getCreatedAt(),
    updatedAt: user.getUpdatedAt(),
  };
}
