import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../../domain/entities/auth-user.entity';
import { Email } from '../../../domain/value-objects/email.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';

@Injectable()
export class AuthUserStoreService {
  private readonly usersById = new Map<string, AuthUser>();

  findByEmail(email: Email): AuthUser | null {
    for (const user of this.usersById.values()) {
      if (user.getEmail().equals(email)) {
        return user;
      }
    }

    return null;
  }

  findById(userId: UserId): AuthUser | null {
    return this.usersById.get(userId.getValue()) ?? null;
  }

  save(user: AuthUser): void {
    this.usersById.set(user.getId().getValue(), user);
  }

  update(user: AuthUser): void {
    this.usersById.set(user.getId().getValue(), user);
  }
}
