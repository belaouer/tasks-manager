import { GetUserProfileCommand } from '../dto/get-user-profile.command';
import { UserNotFoundApplicationException } from '../exceptions/user-not-found.application-exception';
import { GetUserProfileUseCase } from './get-user-profile.use-case';
import { UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { UserEmail } from '../../domain/value-objects/user-email.value-object';
import { FirstName } from '../../domain/value-objects/first-name.value-object';
import { LastName } from '../../domain/value-objects/last-name.value-object';

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

describe('GetUserProfileUseCase', () => {
  it('returns user profile when user exists', async () => {
    const repository = new InMemoryUsersRepository();

    await repository.save(
      User.createNew({
        id: UserId.create('user-200'),
        email: UserEmail.create('user.profile@example.com'),
        firstName: FirstName.create('User'),
        lastName: LastName.create('Profile'),
        now: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );

    const useCase = new GetUserProfileUseCase(repository);
    const result = await useCase.execute(new GetUserProfileCommand('user-200'));

    expect(result.id).toBe('user-200');
    expect(result.email).toBe('user.profile@example.com');
  });

  it('fails when user does not exist', async () => {
    const useCase = new GetUserProfileUseCase(new InMemoryUsersRepository());

    await expect(
      useCase.execute(new GetUserProfileCommand('unknown-user')),
    ).rejects.toBeInstanceOf(UserNotFoundApplicationException);
  });
});
