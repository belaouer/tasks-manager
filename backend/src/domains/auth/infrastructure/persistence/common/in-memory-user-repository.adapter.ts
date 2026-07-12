import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../../domain/entities/auth-user.entity';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import { Email } from '../../../domain/value-objects/email.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import { AuthUserStoreService } from './auth-user-store.service';

@Injectable()
export class InMemoryUserRepositoryAdapter extends UserRepositoryPort {
  constructor(private readonly store: AuthUserStoreService) {
    super();
  }

  async findByEmail(email: Email): Promise<AuthUser | null> {
    return this.store.findByEmail(email);
  }

  async findById(userId: UserId): Promise<AuthUser | null> {
    return this.store.findById(userId);
  }

  async save(user: AuthUser): Promise<void> {
    this.store.save(user);
  }

  async update(user: AuthUser): Promise<void> {
    this.store.update(user);
  }
}
