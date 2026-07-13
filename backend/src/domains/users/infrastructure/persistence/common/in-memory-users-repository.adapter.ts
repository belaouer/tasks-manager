import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { UsersRepositoryPort } from '../../../domain/ports/users-repository.port';
import { UserEmail } from '../../../domain/value-objects/user-email.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import { UsersStoreService } from './users-store.service';

@Injectable()
export class InMemoryUsersRepositoryAdapter extends UsersRepositoryPort {
  constructor(private readonly usersStore: UsersStoreService) {
    super();
  }

  async findById(id: UserId): Promise<User | null> {
    return this.usersStore.findById(id);
  }

  async findByEmail(email: UserEmail): Promise<User | null> {
    return this.usersStore.findByEmail(email);
  }

  async save(user: User): Promise<void> {
    this.usersStore.save(user);
  }

  async update(user: User): Promise<void> {
    this.usersStore.update(user);
  }
}
