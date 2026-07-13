import { CreateUserCommand } from '../dto/create-user.command';
import { UserAlreadyExistsApplicationException } from '../exceptions/user-already-exists.application-exception';
import { CreateUserUseCase } from './create-user.use-case';
import { UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { UsersClockPort } from '../../domain/ports/users-clock.port';
import { UsersIdGeneratorPort } from '../../domain/ports/users-id-generator.port';
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

class FixedClock extends UsersClockPort {
  now(): Date {
    return new Date('2026-01-01T00:00:00.000Z');
  }
}

class FixedIdGenerator extends UsersIdGeneratorPort {
  generate(): string {
    return 'user-123';
  }
}

describe('CreateUserUseCase', () => {
  it('creates a user profile when email is not used', async () => {
    const useCase = new CreateUserUseCase(
      new InMemoryUsersRepository(),
      new FixedClock(),
      new FixedIdGenerator(),
    );

    const result = await useCase.execute(
      new CreateUserCommand('john.doe@example.com', 'John', 'Doe'),
    );

    expect(result.id).toBe('user-123');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
  });

  it('fails when email is already used', async () => {
    const repository = new InMemoryUsersRepository();
    await repository.save(
      User.createNew({
        id: UserId.create('existing-user'),
        email: UserEmail.create('jane.doe@example.com'),
        firstName: FirstName.create('Jane'),
        lastName: LastName.create('Doe'),
        now: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );

    const useCase = new CreateUserUseCase(
      repository,
      new FixedClock(),
      new FixedIdGenerator(),
    );

    await expect(
      useCase.execute(new CreateUserCommand('jane.doe@example.com', 'Jane', 'Doe')),
    ).rejects.toBeInstanceOf(UserAlreadyExistsApplicationException);
  });
});
