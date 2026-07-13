import { User } from '../../../domain/entities/user.entity';
import { FirstName } from '../../../domain/value-objects/first-name.value-object';
import { LastName } from '../../../domain/value-objects/last-name.value-object';
import { UserEmail } from '../../../domain/value-objects/user-email.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import { UsersPersistenceRecord } from './users-persistence.types';

export function toDomainUser(record: UsersPersistenceRecord): User {
  return User.rehydrate({
    id: UserId.create(record.id),
    email: UserEmail.create(record.email),
    firstName: FirstName.create(record.firstName),
    lastName: LastName.create(record.lastName),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toPersistenceUser(user: User): UsersPersistenceRecord {
  return {
    id: user.getId().getValue(),
    email: user.getEmail().getValue(),
    firstName: user.getFirstName().getValue(),
    lastName: user.getLastName().getValue(),
    createdAt: user.getCreatedAt(),
    updatedAt: user.getUpdatedAt(),
  };
}
