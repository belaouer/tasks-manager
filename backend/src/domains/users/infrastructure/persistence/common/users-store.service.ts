import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { UserEmail } from '../../../domain/value-objects/user-email.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';

@Injectable()
export class UsersStoreService {
  private readonly users = new Map<string, User>();

  findById(id: UserId): User | null {
    return this.users.get(id.getValue()) ?? null;
  }

  findByEmail(email: UserEmail): User | null {
    for (const user of this.users.values()) {
      if (user.getEmail().getValue() === email.getValue()) {
        return user;
      }
    }

    return null;
  }

  save(user: User): void {
    this.users.set(user.getId().getValue(), user);
  }

  update(user: User): void {
    this.users.set(user.getId().getValue(), user);
  }
}
