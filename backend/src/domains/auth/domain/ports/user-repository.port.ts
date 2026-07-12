import { AuthUser } from '../entities/auth-user.entity';
import { Email } from '../value-objects/email.value-object';
import { UserId } from '../value-objects/user-id.value-object';

export abstract class UserRepositoryPort {
  abstract findByEmail(email: Email): Promise<AuthUser | null>;
  abstract findById(userId: UserId): Promise<AuthUser | null>;
  abstract save(user: AuthUser): Promise<void>;
  abstract update(user: AuthUser): Promise<void>;
}
