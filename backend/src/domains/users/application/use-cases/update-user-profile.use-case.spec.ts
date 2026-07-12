import { User } from '../../domain/entities/user.entity';
import { UsersClockPort } from '../../domain/ports/users-clock.port';
import { UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { FirstName } from '../../domain/value-objects/first-name.value-object';
import { LastName } from '../../domain/value-objects/last-name.value-object';
import { UserEmail } from '../../domain/value-objects/user-email.value-object';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { UpdateUserProfileCommand } from '../dto/update-user-profile.command';
import { UserNotFoundApplicationException } from '../exceptions/user-not-found.application-exception';
import { UpdateUserProfileUseCase } from './update-user-profile.use-case';

class InMemoryUsersRepository extends UsersRepositoryPort {
  private readonly users: User[] = [];

  async findById(id: UserId): Promise<User | null> {
    return this.users.find((user) => user.getId().getValue() === id.getValue()) ?? null;
  }

  async findByEmail(email: UserEmail): Promise<User | null> {
    return this.users.find((user) => user.getEmail().getValue() === email.getValue()) ?? null;
  }

  async save(user: User): Promise<void> {
    this.users.push(user);
  }

  async update(user: User): Promise<void> {
    const index = this.users.findIndex(
      (candidate) => candidate.getId().getValue() === user.getId().getValue(),
    );

    if (index >= 0) {
      this.users[index] = user;
    }
  }
}

class FixedClock extends UsersClockPort {
  now(): Date {
    return new Date('2026-02-01T00:00:00.000Z');
  }
}

describe('UpdateUserProfileUseCase', () => {
  it('updates firstName and lastName for existing user', async () => {
    const repository = new InMemoryUsersRepository();

    await repository.save(
      User.createNew({
        id: UserId.create('user-42'),
        email: UserEmail.create('user42@example.com'),
        firstName: FirstName.create('Old'),
        lastName: LastName.create('Name'),
        now: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );

    const useCase = new UpdateUserProfileUseCase(repository, new FixedClock());
    const result = await useCase.execute(
      new UpdateUserProfileCommand('user-42', 'New', 'Identity'),
    );

    expect(result.firstName).toBe('New');
    expect(result.lastName).toBe('Identity');
    expect(result.updatedAt.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('fails when user does not exist', async () => {
    const useCase = new UpdateUserProfileUseCase(
      new InMemoryUsersRepository(),
      new FixedClock(),
    );

    await expect(
      useCase.execute(new UpdateUserProfileCommand('missing-user', 'New', 'Name')),
    ).rejects.toBeInstanceOf(UserNotFoundApplicationException);
  });
});
