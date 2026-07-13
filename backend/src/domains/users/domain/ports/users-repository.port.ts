import { User } from '../entities/user.entity';
import { UserEmail } from '../value-objects/user-email.value-object';
import { UserId } from '../value-objects/user-id.value-object';

export abstract class UsersRepositoryPort {
  abstract findById(id: UserId): Promise<User | null>;
  abstract findByEmail(email: UserEmail): Promise<User | null>;
  abstract save(user: User): Promise<void>;
  abstract update(user: User): Promise<void>;
}
