import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UsersClockPort } from '../../domain/ports/users-clock.port';
import { UsersIdGeneratorPort } from '../../domain/ports/users-id-generator.port';
import { UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { FirstName } from '../../domain/value-objects/first-name.value-object';
import { LastName } from '../../domain/value-objects/last-name.value-object';
import { UserEmail } from '../../domain/value-objects/user-email.value-object';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { CreateUserCommand } from '../dto/create-user.command';
import { UserProfileDto } from '../dto/user-profile.dto';
import { UserAlreadyExistsApplicationException } from '../exceptions/user-already-exists.application-exception';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepositoryPort,
    private readonly usersClock: UsersClockPort,
    private readonly usersIdGenerator: UsersIdGeneratorPort,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserProfileDto> {
    const email = UserEmail.create(command.email);
    const firstName = FirstName.create(command.firstName);
    const lastName = LastName.create(command.lastName);

    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser !== null) {
      throw new UserAlreadyExistsApplicationException();
    }

    const user = User.createNew({
      id: UserId.create(this.usersIdGenerator.generate()),
      email,
      firstName,
      lastName,
      now: this.usersClock.now(),
    });

    await this.usersRepository.save(user);

    return new UserProfileDto(
      user.getId().getValue(),
      user.getEmail().getValue(),
      user.getFirstName().getValue(),
      user.getLastName().getValue(),
      user.getCreatedAt(),
      user.getUpdatedAt(),
    );
  }
}
